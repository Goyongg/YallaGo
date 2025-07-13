import { BadRequestException, Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { getUserDefaults } from './dto/user-defaults.dto';
import { omitFields, pickFields } from 'src/common/helpers/object.helpers';
import { FirebaseUserService } from 'src/firebase/firebase-user.service';
import { PatchUserDto } from './dto/patch-user.dto';
import { FirebaseDriverService } from 'src/firebase/firebase-driver.service';
import { RideStatus } from 'src/rides/enums/ride-status.enum';
import { BookingStatus } from 'src/ride-passengers/enums/booking-status.enum';
import { GeoPoint } from 'firebase-admin/firestore';

// clean any undefined fields for userData
function cleanUserData(data: Record<string, any>) {
    const result: Record<string, any> = {}

    // go through each key value pairs and check undefined values
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || (typeof value === "string" && value.trim() === "")) { // check undefined/empty values
            if (key === 'gender') { // set default gender
                result[key] = 'prefer_not_to_say'
            }
            continue; //omit undefined fields
        }
        result[key] = value;
    }

    return result; // return cleaned user data
}

@Injectable()
export class UsersService {
    constructor(
        private readonly firebase: FirebaseService,
        private readonly firebaseUserService: FirebaseUserService,
        private readonly firebaseDriverService: FirebaseDriverService
    ) {}

    // fetch homepage user data based on role
    async getHomePageInfo(firebaseUid: string) {
        const userData = await this.firebaseUserService.fetchUserData(firebaseUid);

        const homepageFields = ['userId', 'name', 'gender', 'role', 'averageRating', 'ecoPoints'];

        const response = pickFields(userData, homepageFields);

        const upcomingInfo = await this.getUpcomingInfo(userData, firebaseUid);

        // return user info
        return { response, upcomingInfo }; 
    }

    async getUpcomingInfo(userData: any, firebaseUid: string) {
        const now = new Date();
        // Define 1 hour from now
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        // Check if the user is a driver
        if (userData.role === 'driver') {
            // Fetch all rides created by this driver
            const rides = await this.firebaseDriverService.getRideByDriver(firebaseUid);

            // Will hold rides happening soon or departed
            const upcomingRides: typeof rides = [];

            // Loop through each ride
            for (const ride of rides) {
                // Cast to make TypeScript aware of optional fields
                const rideWithDeparture = ride as {
                departureTime?: FirebaseFirestore.Timestamp;
                status?: string;
                };

                // If departureTime is missing or invalid, skip
                if (!rideWithDeparture.departureTime || typeof rideWithDeparture.departureTime.toDate !== 'function') {
                    continue;
                }

                // Convert Firestore Timestamp to JS Date
                const departureTime = rideWithDeparture.departureTime.toDate();
                // Check if departure is within the next hour
                const matchesTimeWindow = departureTime >= now && departureTime <= oneHourFromNow;

                // Check if status is DEPARTED
                const status = rideWithDeparture.status;
                const matchesStatus = status === RideStatus.DEPARTED;

                // If either condition is true, consider this an upcoming ride
                if (matchesTimeWindow || matchesStatus) {
                    upcomingRides.push(ride);
                }
            }

            // Array to collect enriched ride info
            const enrichedRides: any[] = [];

            // Loop through each upcoming ride
            for (const ride of upcomingRides) {
                // Remove fields you don't want to expose to clients
                const rideData = omitFields(ride, ['availableSeats','distanceMeters','driverId','durationSeconds','g','pricePerSeat','vehicleId']);

                // Fetch all bookings for this ride
                const bookingsSnapshot = await this.firebase.firestore
                .collection('bookings')
                .where('rideId', '==', ride.rideId)
                .get();

                const bookings: any[] = [];

                // Loop through bookings to enrich each with passenger data
                for (const bookingDoc of bookingsSnapshot.docs) {
                const bookingData = bookingDoc.data() as {
                    passengerId: string;
                    seatsBooked: number;
                };

                // Fetch user data for the passenger
                const userData = await this.firebaseUserService.fetchUserData(bookingData.passengerId);

                bookings.push({
                    passengerName: userData.name,
                    seatsBooked: bookingData.seatsBooked,
                    phoneNumber: userData.phoneNumber
                });
                }

                // Add the enriched ride (with bookings) to the list
                enrichedRides.push({
                ...rideData,
                bookings
                });
            }

            // Return enriched rides for driver
            return enrichedRides;
        }

        // If the user has a booking, treat them as passenger
        // Fetch all bookings for this passenger
        const upcomingBookings = await this.firebase.firestore
            .collection('bookings')
            .where('passengerId', '==', firebaseUid)
            .get();
        
        // Array to collect enriched booking info
        const enrichedBookings: any [] = [];

        // Loop through all bookings
        for (const bookingDoc of upcomingBookings.docs) {
            const bookingData = bookingDoc.data() as {
                rideId: string;
                seatsBooked: number;
                pickupPoint: string; 
                startGeo: GeoPoint;
                dropOffPoint: string;
                endGeo: GeoPoint; 
                status: string;
            };

            // Fetch the ride document linked to this booking
            const rideData = await this.firebaseDriverService.getRideById(bookingData.rideId);
            // Keep only specific ride fields
            const cleanRideData = pickFields(rideData, ['coordinates', 'departureTime', 'endGeo'])

            // Convert departure time to JS Date
            const departureTime = rideData.departureTime.toDate();
            console.log('Checking departure time:', departureTime.toISOString());

            // Define conditions
            const isWithinTimeWindow = departureTime >= now && departureTime <= oneHourFromNow;
            const isOngoing = bookingData.status === BookingStatus.ONGOING;

            // If neither applies, skip this booking
            if (!isWithinTimeWindow && !isOngoing) {
                continue;
            }

            // Fetch driver info linked to this ride
            const driverData = await this.firebaseUserService.fetchUserData(rideData.driverId);
            // Keep only selected driver fields
            const cleanDriverData = pickFields(driverData, ['driverId', 'name', 'phoneNumber', 'averageRating'])

            // Fetch vehicle info for this ride
            const vehicleData = await this.firebaseDriverService.fetchVehicleData(rideData.vehicleId)
            // Remove fields you don't want to expose
            const cleanVehicleData = omitFields(vehicleData, ['seats', 'driverId', 'vehicleId'])

            // Build the enriched booking object
            enrichedBookings.push({
                bookingId: bookingDoc.id,
                seatsBooked: bookingData.seatsBooked,
                status: bookingData.status,
                pickupPoint: bookingData.pickupPoint,
                bookingStart: bookingData.startGeo,
                dropOffPoint: bookingData.dropOffPoint,
                bookingEnd: bookingData.endGeo,
                ride: cleanRideData,
                driver: cleanDriverData,
                vehicle: cleanVehicleData
            });
        }

        
        // Return enriched bookings for passenger
        return enrichedBookings;
    }

    async getUserProfile(firebaseUid: string) {
        const userData = await this.firebaseUserService.fetchUserData(firebaseUid);

        // retrive vehicle info if driver
        if (userData.role === 'driver') { 
            return { 
                user: omitFields(userData, ['ratingCount', 'vehicleId']),
            };
        };

        return omitFields(userData, ['ratingCount']);
    }

    // create the user in firestore
    async createUser(createUserDto: CreateUserDto | CreateDriverDto, firebaseUid: string) {
        const userRef = this.firebase.firestore.collection('users').doc(firebaseUid);
        const rawUserData = {
            userId: firebaseUid, // set userid
            // spread out fields of the new user
            ...createUserDto,
            ...getUserDefaults(createUserDto.role)
        };

        const userData = cleanUserData(rawUserData);

        await userRef.set(userData); // set data to the user
        return { message: "User created successfully", userId: firebaseUid }
    };

    async updateUser(patchUserDto: PatchUserDto, firebaseUid: string) {
        // Get user doc ref
        const { userRef } = await this.firebaseUserService.getUserSnapshot(firebaseUid);

        // Get user doc data
        const userData = await this.firebaseUserService.fetchUserData(firebaseUid);

        // If user is not a driver but trying to update licenseNumber
        if (patchUserDto.licenseNumber && userData.role !== 'driver') {
            throw new BadRequestException('Only drivers can update licenseNumber.');
        }

        // Prepare update object by filtering out undefined fields
        const updates: Partial<typeof userData> = {};
        for (const [key, value] of Object.entries(patchUserDto)) {
            if (value !== undefined) {
            updates[key] = value;
            }
        }
        
        // If new email is provided, update Firebase Auth
        if (patchUserDto.email) {
            await this.firebase.auth.updateUser( firebaseUid, {
                email: patchUserDto.email
            });
        }

        // If no fields were provided, optionally throw an error
        if (Object.keys(updates).length === 0) {
            throw new BadRequestException('No fields provided to update.');
        }

        // Update Firestore Doc
        await userRef.update(updates);

        return { message: "User updated successfully"};
    }

    async deleteUser(firebaseUid: string) {
        // Get user doc ref
        const { userRef } = await this.firebaseUserService.getUserSnapshot(firebaseUid);

        // If driver, delete driver vehicle
        const userData = await this.firebaseUserService.fetchUserData(firebaseUid);
        if (userData.role === 'driver') {
            // Get vehicle ref
            if (userData.vehicleId) {
            const { vehRef } = await this.firebaseDriverService.getVehicleSnapshot(userData.vehicleId);
            await vehRef.delete(); // delete vehicle doc
            }
        }

        // delete user doc
        await userRef.delete();

        // Delete Firebase Auth user
        await this.firebase.auth.deleteUser(firebaseUid);

        return { message: "User deleted successfully"}
    }
}