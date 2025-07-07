import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { RideStatus } from './enums/ride-status.enum';
import { GoogleMapsService } from 'src/google/google-maps/google-maps.service';
import { RidePlanDto } from './dto/ride-plan.dto';
import { Coordinates } from 'src/common/coordinates.dto';
import { SearchRidesDto } from './dto/search-rides.dto';

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
        private readonly googleMaps: GoogleMapsService
    ) {}

    // Check if user role is driver, then check if kyc is verified and if vehicle exists for driver
    private async validateDriver(firebaseUid: string) {
        const userSnap = await this.firebase.firestore.collection('users').doc(firebaseUid).get();
        if (!userSnap.exists) {
            throw new NotFoundException('User profile not found');
        }

        const user = userSnap.data()!; // assert non-null as already checked if exists

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

    private async searchNearbyRides(centerLat: number, centerLng: number, radiusKm: number) {
        const geoRidesCollection = await this.firebase.geoFirestore.collection('rides');

        // query rides that are near the radius (based on radiusKm)
        const query = geoRidesCollection.near({
            center: new this.firebase.GeoPoint(centerLat, centerLng),
            radius: radiusKm
        });

        const snapshot = await query.get();

        const rides = snapshot.docs.map(doc => ({
            rideId: doc.id,
            ...(doc.data() as any)
        }));

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

        // create the ride doc reference
        const rideRef = this.firebase.firestore.collection('rides').doc();

        // get GeoFirestore collection
        const geoRidesCollection = this.firebase.geoFirestore.collection('rides');

        // prepare data
        const rawRideData = {
            rideId: rideRef.id, // set rideId
            driverId: firebaseUid, // link driverId

            // named as coordinates since GeoFirestore expects a 'coordinates' field for index hashing
            coordinates: startGeoPoint, // starting point and query anchor

            endGeo: endGeoPoint, // ending point
            departureTime: departureTime,
            ...rest, // spread out ride fields 
            status: RideStatus.IN_PROGRESS
        };

        console.log(rawRideData.coordinates);

        const rideData = cleanRideData(rawRideData);

        // Set the document using GeoFirestore to add geohash
        await geoRidesCollection.doc(rideRef.id).set(rideData);

        // await rideRef.set(rideData); // set ride data
        return { message: "Ride created successfull", rideId: rideData.rideId }
    };

    // calculate recommended price per seat based on the start and end coordinates
    async recommendPrice(ridePlantDto: RidePlanDto) {

        // call distance matrix API to get distance and duration of the route
        const { distanceMeters, durationSeconds } =
            await this.googleMaps.getDistanceAndDuration(
                ridePlantDto.startPoint.lat,
                ridePlantDto.startPoint.lng,
                ridePlantDto.endPoint.lat,
                ridePlantDto.endPoint.lng,
                ridePlantDto.date,
                ridePlantDto.time
            );
            
        // convert distance to KM and duratin to mins
        const distanceKm = distanceMeters / 1000;
        const durationMin = durationSeconds / 60;

        // Price formula (AED)
        // sample
        const baseFee = 5.5;
        const perKmRate = 2.14;
        const perMinRate = 0.5;
        const maxPassengers = 3;
        
        const price = baseFee + (distanceKm * perKmRate) + (durationMin * perMinRate);
        
        return { recommendedPrice: Math.round(price / maxPassengers) };
    }

    // search ride service
    async searchRides(searchRidesDto: SearchRidesDto) {
        const radiusKm = 5; // deviation radius
        const toleranceKm = 0.7; // tolerance distance from destination

        // Step 1: search rides near pickup
        const candidates = await this.searchNearbyRides(
            searchRidesDto.startPoint.lat,
            searchRidesDto.startPoint.lng,
            radiusKm
        );

        console.log(candidates);

        // Step 2: filter rides by endpoint, seats, date
        const filtered = candidates.filter(ride => {
            // Filter by available seats
            if (ride.availableSeats < searchRidesDto.requestedSeats) return false;
            console.log(`Seats: ride=${ride.availableSeats}, requested=${searchRidesDto.requestedSeats}`);

            // Filter by date (assuming departureTime is Firestore Timestamp)
            const rideDate = ride.departureTime.toDate();
            const rideDateString = rideDate.toISOString().split('T')[0];
            if (rideDateString !== searchRidesDto.date) return false;

            // Filter by end location radius (haversine)
            // with tolerance of 700m from ride's destination
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

        return filtered;
    }
}
