import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { RideStatus } from './enums/ride-status.enum';
import { GoogleMapsService } from 'src/google/google-maps/google-maps.service';
import { RidePlanDto } from './dto/ride-plan.dto';
import { Coordinates } from 'src/common/coordinates.dto';
import { SearchRidesDto } from './dto/search-rides.dto';
import { BookingStatus } from 'src/ride-passengers/enums/booking-status.enum';
import { omitFields, pickFields } from 'src/common/helpers/object.helpers';
import { FirebaseUserService } from 'src/firebase/firebase-user.service';
import { FirebaseDriverService } from 'src/firebase/firebase-driver.service';

// clean any undefined fields for ride data
function cleanRideData(data: Record<string, any>) {
    const result: Record<string, any> = {}

    // go through each key value pairs and check undefined values
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || (typeof value === "string" && value.trim() === "")) { // check undefined/empty values
            if (key === 'femaleOnly') { // set femaleOnly to false
                result[key] = false;
            }
            continue; // omit undefined fields
        }

        // Omit empty arrays
        if (Array.isArray(value) && value.length === 0) {
            continue;
        }

        result[key] = value;
    }

    return result; // return cleaned ride data
}

// degress to radius
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

@Injectable()
export class RidesService {
    constructor(
        private readonly firebase: FirebaseService,
        private readonly firebaseUserService: FirebaseUserService,
        private readonly firebaseDriverService: FirebaseDriverService, 
        private readonly googleMaps: GoogleMapsService
    ) {}

    // Check if user role is driver, then check if kyc is verified and if vehicle exists for driver
    private async validateDriver(firebaseUid: string) {
        // fetch user data
        const user = await this.firebaseUserService.fetchUserData(firebaseUid);

        if (user.role !== 'driver') { // check role
            throw new ForbiddenException('Only Drivers can create rides.');
        }
        if (user.kycStatus !== 'verified') { // check kycStatus
            throw new ForbiddenException('Driver account is not verified');
        }
        if (!user.vehicleId) { // check if driver has a vehicle
            throw new ForbiddenException('Driver must have a registered vehicle.');
        }
    }

    // parse date and time from dto and convert to Timestamp
    private parseUaeDateTime(date: string, time: string) {
        const isoString = `${date}T${time}:00+04:00`; // set UAE timezone
        const jsDate = new Date(isoString);

        if (isNaN(jsDate.getTime())) {
        throw new BadRequestException('Invalid departureTime format');
        }
        if (jsDate.getTime() < Date.now()) { // check if deptature is in future
        throw new BadRequestException('Departure time must be in the future.');
        }

        return this.firebase.Timestamp.fromDate(jsDate); // return firestore Timestamp
    }

    // search nearby rides around a center point based on radiusKm (uses geofirestore query)
    private async searchNearbyRides(centerLat: number, centerLng: number, radiusKm: number) {
        const geoRidesCollection = await this.firebase.geoFirestore.collection('rides');

        // query rides that are near the radius
        const query = geoRidesCollection.near({
            center: new this.firebase.GeoPoint(centerLat, centerLng),
            radius: radiusKm
        });

        // get the snapshot of the query
        const snapshot = await query.get();

        // map firestore documents into ride objects
        const rides = snapshot.docs.map(doc => ({
            rideId: doc.id,
            ...(doc.data() as any)
        }))

        return rides;
    }

    // haversine function to find distance between 2 coordinates
    private haversine(coord1: Coordinates, coord2: Coordinates) {
        const R = 6371; // Radius of Earth in km
        const dLat = deg2rad(coord2.lat - coord1.lat);
        const dLng = deg2rad(coord2.lng - coord1.lng);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(coord1.lat)) *
            Math.cos(deg2rad(coord2.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    private async calculateEcoPoints(rideId: string) {
        // Fetch the ride document from the 'rides' collection using the rideId
        const rideData = await this.firebaseDriverService.getRideById(rideId);

        // Get the distance in meters from the ride data
        const distance = rideData.distanceMeters;

        console.log(distance)

        // Calculate eco points using the formula:
        // 1 point per 1000 meters, rounded down using Math.floor
        const ecoPoints = Math.floor(distance/1000);

        return ecoPoints
    }

    private async fetchVehicleId(driverId: string) {
        // fetch user data from users collection
        const userData = await this.firebaseUserService.fetchUserData(driverId);

        return userData.vehicleId
    }

    // Redact each enriched ride to include only allowed fields for frontend
    private redactEnrichedRides(enrichedRides: any[]): any[] {
        return enrichedRides.map(item => ({
            ride:  omitFields(item.ride, ['g', 'distanceMeters', 'vehicleId', 'status']),
            driver: pickFields(item.driver, ['name', 'averageRating']),
            vehicle: omitFields(item.vehicle, ['vehicleId', 'driverId'])
        }));
    }

    async fetchDriverRides(firebaseUid: string) {
        const rides = await this.firebaseDriverService.getRideByDriver(firebaseUid);

        return rides.map(ride =>
            omitFields(ride, ['g', 'distanceMeters' ,'driverId', 'vehicleId'])
        )
    }

    async checkRideConflict(date: string, time: string, firebaseUid: string) {
        const rides = await this.firebaseDriverService.getRideByDriver(firebaseUid);

        // Define the statuses considered for filtering
        const relevantStatuses = [RideStatus.IN_PROGRESS, RideStatus.BOOKED, RideStatus.DEPARTED];

        // Filter the rides active rides
        const activeRides = rides.filter(ride =>
            relevantStatuses.includes(ride.status as RideStatus)
        )

        // Convert incoming date/time to JS Date
        const requestedTimestamp = this.parseUaeDateTime(date, time);
        const requestedDateMs = requestedTimestamp.toDate().getTime();

        // Conflict window
        const conflictWindow = 10 * 60 * 1000; // 10 mins in milliseconds

        // Check if active ride for conflict
        for (const ride of activeRides) {
            if (!ride.departureTime) continue;

            const rideDateMs = ride.departureTime.toDate().getTime();

            const diffMs = Math.abs(requestedDateMs - rideDateMs);

            if (diffMs <= conflictWindow) {
                throw new BadRequestException('Conflicting departure time with existing rides');
            }
        }

        return {
            ok: true,
            message: "No conflicting departure times"
        }
    }

    // create ride service
    async createRide(createRideDto: CreateRideDto, firebaseUid: string) {

        // verify driver
        await this.validateDriver(firebaseUid);

        // Convert coordinates into GeoPoint
        const startGeoPoint = new this.firebase.GeoPoint(
            createRideDto.startPoint.lat, 
            createRideDto.startPoint.lng
        );

        const endGeoPoint = new this.firebase.GeoPoint(
            createRideDto.endPoint.lat, 
            createRideDto.endPoint.lng
        );

        // combine date and time (convert to UAE timezone)
        const departureTime = this.parseUaeDateTime(createRideDto.date, createRideDto.time);

        // destructure to pull out date, time, start/end coordinates
        const {date, time, startPoint, endPoint, ...rest } = createRideDto;
        
        let distanceData;

        // Get distance and duration of ride
        if (createRideDto.waypoints && createRideDto.waypoints.length > 0) {
            // Call Directions API with waypoints
            distanceData = await this.googleMaps.getDistanceAndDuration(
                createRideDto.startPoint.lat,
                createRideDto.startPoint.lng,
                createRideDto.endPoint.lat,
                createRideDto.endPoint.lng,
                createRideDto.date,
                createRideDto.time,
                createRideDto.waypoints.map((w) => w.coordinates)
            );
        } 
        else { // Call Directions API without waypoints
            distanceData = await this.googleMaps.getDistanceAndDuration(
                createRideDto.startPoint.lat,
                createRideDto.startPoint.lng,
                createRideDto.endPoint.lat,
                createRideDto.endPoint.lng,
                createRideDto.date,
                createRideDto.time,
            );
        }
        
        // create the ride doc reference
        const rideRef = this.firebase.firestore.collection('rides').doc();

        // get GeoFirestore collection
        const geoRidesCollection = this.firebase.geoFirestore.collection('rides');

        // get the vehicleId of the driver
        const vehicleId = await this.fetchVehicleId(firebaseUid);

        // prepare data
        const rawRideData = {
            rideId: rideRef.id, // set rideId
            driverId: firebaseUid, // link driverId

            // named as coordinates since GeoFirestore expects a 'coordinates' field for index hashing
            coordinates: startGeoPoint, // starting point and query anchor

            endGeo: endGeoPoint, // ending point
            departureTime: departureTime,
            durationSeconds: distanceData.durationSeconds, // duration of the trip in secs
            distanceMeters: distanceData.distanceMeters, //distance in meters
            vehicleId: vehicleId,
            ...rest, // spread out ride fields 
            status: RideStatus.IN_PROGRESS
        };

        const rideData = cleanRideData(rawRideData);

        // Set the document using GeoFirestore to add geohash
        await geoRidesCollection.doc(rideRef.id).set(rideData);

        // await rideRef.set(rideData); // set ride data
        return { message: "Ride created successfull", rideId: rideData.rideId }
    };

    // calculate recommended price per seat based on the start and end coordinates
    async recommendPrice(ridePlanDto: RidePlanDto) {

        let distanceMeters: number;
        let durationSeconds: number;

        // Get distance and duration of ride
        if (ridePlanDto.waypoints && ridePlanDto.waypoints.length > 0) {
            // console.log(ridePlanDto.waypoints);

            // Call Directions API with waypoints
            ({ distanceMeters, durationSeconds } = await this.googleMaps.getDistanceAndDuration(
                ridePlanDto.startPoint.lat,
                ridePlanDto.startPoint.lng,
                ridePlanDto.endPoint.lat,
                ridePlanDto.endPoint.lng,
                ridePlanDto.date,
                ridePlanDto.time,
                ridePlanDto.waypoints.map((w) => w.coordinates),
            ));
        } 
        else { // Call Directions API without waypoints
            ({ distanceMeters, durationSeconds } = await this.googleMaps.getDistanceAndDuration(
                ridePlanDto.startPoint.lat,
                ridePlanDto.startPoint.lng,
                ridePlanDto.endPoint.lat,
                ridePlanDto.endPoint.lng,
                ridePlanDto.date,
                ridePlanDto.time
            ));
        }
        
        // convert distance to KM and duratin to mins
        const distanceKm = distanceMeters / 1000;
        const durationMin = durationSeconds / 60;

        console.log(`Distance: ${distanceKm}`);
        console.log(`Duration: ${durationMin}`);

        // Price formula (AED) sample
        const baseFee = 5.5;
        const perKmRate = 2.14;
        const perMinRate = 0.5;
        const maxPassengers = 3;
        
        const price = baseFee + (distanceKm * perKmRate) + (durationMin * perMinRate);
        
        return { recommendedPrice: Math.round(price / maxPassengers) };
    }

    // search ride service
    async searchRides(searchRidesDto: SearchRidesDto) {
        const radiusKm = 5; // pickup radius
        const toleranceKm = 1; // tolerance distance for destination matching

        // Step 1: search rides near pickup
        const candidates = await this.searchNearbyRides(
            searchRidesDto.startPoint.lat,
            searchRidesDto.startPoint.lng,
            radiusKm
        );

        // if no rides found within search radius, return empty result
        if (candidates.length === 0) {
            return [];
        }

        // Step 2: filter rides by endpoint, seats, date
        const filtered = candidates.filter(ride => {
            // Don't include rides that are departed, completed, or cancelled
            if (ride.status !== RideStatus.IN_PROGRESS) return false;

            // Filter by available seats
            if (ride.availableSeats < searchRidesDto.requestedSeats) return false;

            // Filter female-only preference
            if (searchRidesDto.femaleOnly) { 
                // only include rides that have femaleOnly === true
                if (!ride.femaleOnly) return false;
            }

            // Filter by date (assuming departureTime is Firestore Timestamp)
            const rideDate = ride.departureTime.toDate();
            const rideDateString = rideDate.toISOString().split('T')[0];
            if (rideDateString !== searchRidesDto.date) return false;

            // Filter by end location radius (haversine)
            // with toleranceKm from ride's destination
            const distanceToEnd = this.haversine(
                { // ride destination
                    lat: ride.endGeo.latitude,
                    lng: ride.endGeo.longitude
                },
                { // search end location
                    lat: searchRidesDto.endPoint.lat,
                    lng: searchRidesDto.endPoint.lng
                }
            );

            if (distanceToEnd > toleranceKm) return false;

            return true;
        });

        // if no rides match the filters, return empty result
        if (filtered.length === 0) {
            return [];
        }

        // Step 3: Collect unique driver and vehicle IDs
        const driverIds = Array.from(new Set(filtered.map(ride => ride.driverId)));
        const vehicleIds = Array.from(new Set(filtered.map(ride => ride.vehicleId)));

        // Step 4: fetch drivers and vehicle in batches
        const driverSnapShot = await this.firebase.firestore
        .collection('users')
        .where(this.firebase.FieldPath.documentId(), 'in', driverIds)
        .get();

        const driversMap = new Map(
            driverSnapShot.docs.map(doc => [doc.id, doc.data()])
        );

        const vehicleSnapshot = await this.firebase.firestore
        .collection('vehicles')
        .where(this.firebase.FieldPath.documentId(), 'in', vehicleIds)
        .get();

        const vehiclesMap = new Map(
            vehicleSnapshot.docs.map(doc => [doc.id, doc.data()])
        );

        // Step 5: enrich rides (link driver and vehicle data with each ride)
        const enrichedRides = filtered.map(ride => ({
            ride,
            driver: driversMap.get(ride.driverId) ?? null,
            vehicle: vehiclesMap.get(ride.vehicleId) ?? null
        }));

        // return ride data with redacted fields
        return this.redactEnrichedRides(enrichedRides);
    }

    // Service method to handle the "Start Ride" action
    async startRide(rideId: string) {
        const rideRef = this.firebase.firestore.collection('rides').doc(rideId);

        // Update ride status to departed
        await rideRef.update({status: RideStatus.DEPARTED});

        // Query all bookings where the rideId matches the ride being started
        const bookingsSnap = await this.firebase.firestore.collection('bookings').where('rideId', '==', rideId).get();

        // Initialize a Firestore batch to perform all updates atomically
        const batch = this.firebase.firestore.batch();
        
        // Loop through each booking and update its status to ONGOING
        bookingsSnap.forEach(doc => {
            if(doc.data().status === BookingStatus.CONFIRMED){
                batch.update(doc.ref, { status: BookingStatus.ONGOING})
            }
        })

        // Commit all booking status updates in a single batch operation
        await batch.commit();

        return { message: 'Ride started, booking status for all bookings updated'}
    }

    // Service method to handle the "End Ride" action
    async endRide(rideId: string) {
        const rideRef = this.firebase.firestore.collection('rides').doc(rideId);

        // Update ride status to COMPLETED
        await rideRef.update({status: RideStatus.COMPLETED});

        // Query all bookings that belong to this ride
        const bookingsSnap = await this.firebase.firestore.collection('bookings').where('rideId', '==', rideId).get();

        // Calculate eco points once based on the ride's distance
        const calculatedEcoPoints = await this.calculateEcoPoints(rideId);

        // Initialize Firestore batch for grouped atomic updates
        const batch = this.firebase.firestore.batch();

        // Loop through each booking to:
        // -Set status to COMPLETED
        // -Reward passenger with eco points
        for (const bookingDoc of bookingsSnap.docs) {
            const bookingData = bookingDoc.data();
            if (bookingData.status === BookingStatus.ONGOING){
                const passengerId = bookingData.passengerId;

                // Update booking status to COMPLETED
                batch.update(bookingDoc.ref, { status: BookingStatus.COMPLETED });

                // Get user doc
                const userRef = this.firebase.firestore.collection('users').doc(passengerId);
                const userSnap = await userRef.get();

                if(!userSnap.exists){
                    throw new NotFoundException('User doesnt exist');
                }

                // Get current ecoPoints of the user
                const userData = userSnap.data()!;
                const currentEcoPoints = userData.ecoPoints;

                console.log(calculatedEcoPoints)

                // Update user’s ecoPoints by adding newly earned points
                batch.update(userRef, { ecoPoints: currentEcoPoints + calculatedEcoPoints });
            }
        }

        // Commit all updates in a single transaction
        await batch.commit();

        return { message: 'Ride ended, booking status for all bookings updated'}
    }

    // delete rides
    async deleteRide(rideId: string) {
        const rideRef = this.firebase.firestore.collection('rides').doc(rideId);
        const rideSnap = await rideRef.get();

        if(!rideSnap.exists) {
            throw new NotFoundException('Ride doesnt exist');
        }

        const rideData = rideSnap.data();
        if (!rideData) {
            throw new NotFoundException('Ride data is undefined');
        }

        // don't allow deleting rides that are booked or completed
        if (rideData.status !== RideStatus.IN_PROGRESS) {
            throw new BadRequestException('Ride cannot be deleted because it has already been booked or deleted');
        }

        // delete ride doc
        await rideRef.delete();

        return { message: "Ride deleted successfully"};
    }
}
