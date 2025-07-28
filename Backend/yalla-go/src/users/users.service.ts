import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
import { GeoPoint, Timestamp } from 'firebase-admin/firestore';
import { FirebaseNotificationsService } from 'src/firebase/firebase-notifications.service';
import { PaymentStatus } from 'src/payments/enums/payment-status.enum';
import Stripe from 'stripe';

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
    private stripe: Stripe;

    constructor(
        private readonly firebase: FirebaseService,
        private readonly firebaseUserService: FirebaseUserService,
        private readonly firebaseDriverService: FirebaseDriverService,
        private readonly FirebaseNotificationsService: FirebaseNotificationsService
    ) {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new Error('🚨 STRIPE_SECRET_KEY not defined');
        }

        this.stripe = new Stripe(secretKey, { apiVersion: '2025-06-30.basil' });
    }

    private async getUpcomingRide(firebaseUid: string, now: Date, oneHourFromNow: Date) {
        // Fetch all rides created by this driver
        let rides: any[] = [];
        try {
        rides = await this.firebaseDriverService.getRideByDriver(firebaseUid);
        } catch (err) {
        console.warn(`[getUpcomingInfo] No rides found for driver ${firebaseUid}. Returning empty array.`);
        return []; // ✅ prevent throwing or breaking getHomePageInfo
        }

        if (!rides || rides.length === 0) {
        console.log(`[getUpcomingInfo] Driver ${firebaseUid} has no upcoming rides.`);
        return []; // ✅ no 404, just empty
        }

        // Will hold rides happening soon or departed
        const upcomingRides: typeof rides = [];

        // Loop through each ride
        for (const ride of rides) {
            // Convert Firestore Timestamp to JS Date
            const departureTime = ride.departureTime.toDate();
            const status = ride.status;
            // Check if departure is within the next hour and status is in-progress
            const matchesTimeWindow = departureTime >= now && departureTime <= oneHourFromNow;
            const isInProgressAndInTimeWindow = matchesTimeWindow && (status === RideStatus.IN_PROGRESS || status === RideStatus.BOOKED);
            // Check if status is DEPARTED
            const isDeparted = status === RideStatus.DEPARTED;

            if (isInProgressAndInTimeWindow || isDeparted) {
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
                    status: string;
                };

                // Only send ongoing/confirmed bookings
                if (bookingData.status === BookingStatus.ONGOING || bookingData.status === BookingStatus.CONFIRMED) {
                    const userData = await this.firebaseUserService.fetchUserData(bookingData.passengerId);

                    bookings.push({
                        passengerId: bookingData.passengerId,
                        passengerName: userData.name,
                        seatsBooked: bookingData.seatsBooked,
                        phoneNumber: userData.phoneNumber
                    });
                }
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

    private async getUpcomingBooking(firebaseUid: string, now: Date, oneHourFromNow: Date) {
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
                bookingPrice: number;
                status: string;
            };

            // Fetch the ride document linked to this booking
            const rideData = await this.firebaseDriverService.fetchRideData(bookingData.rideId);
            // Keep only specific ride fields
            const cleanRideData = pickFields(rideData, ['coordinates', 'startLocation', 'endGeo', 'endLocation', 'departureTime', 'polyline', 'comments', 'waypoints'])

            // Convert departure time to JS Date
            const departureTime = rideData.departureTime.toDate();

            // Define conditions
            const isWithinTimeWindow = departureTime >= now && departureTime <= oneHourFromNow;
            const isConfirmed = bookingData.status === BookingStatus.CONFIRMED;
            const isOngoing = bookingData.status === BookingStatus.ONGOING;

            // Proceed only if it's a confirmed booking within the time window, or if it's ongoing
            const shouldInclude = (isWithinTimeWindow && isConfirmed) || isOngoing;

            if (!shouldInclude) {
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
                bookingPrice: bookingData.bookingPrice,
                status: bookingData.status,
                ride: cleanRideData,
                driver: cleanDriverData,
                vehicle: cleanVehicleData
            });
        }

        // Return enriched bookings for passenger
        return enrichedBookings;
    }

    // fetch homepage user data based on role
    async getHomePageInfo(firebaseUid: string) {
        const userData = await this.firebaseUserService.fetchUserData(firebaseUid);

        const homepageFields = ['userId', 'name', 'gender', 'role', 'averageRating', 'ecoPoints'];

        const response = pickFields(userData, homepageFields);

        let upcomingInfo: any[] = [];

        try {
        upcomingInfo = await this.getUpcomingInfo(userData, firebaseUid);
        } 
        catch (err: any) {
        console.warn(`[getHomePageInfo] getUpcomingInfo() failed: ${err.message}`);
        // Always return empty array on failure to avoid frontend 404s
        upcomingInfo = [];
        }

        return { response, upcomingInfo }; 
    }

    async getUpcomingInfo(userData: any, firebaseUid: string) {
        const now = new Date();
        // Define 1 hour from now
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        // Check if the user is a driver
        if (userData.role === 'driver') {
            return this.getUpcomingRide(firebaseUid, now, oneHourFromNow);
        }

        return this.getUpcomingBooking(firebaseUid, now, oneHourFromNow);
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
        const userRef = await this.firebaseUserService.getUserRef(firebaseUid);

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
        const userRef = await this.firebaseUserService.getUserRef(firebaseUid);

        // If driver, delete driver vehicle
        const userData = await this.firebaseUserService.fetchUserData(firebaseUid);
        if (userData.role === 'driver') {
            // Get vehicle ref
            if (userData.vehicleId) {
            const vehRef = await this.firebaseDriverService.getVehicleRef(userData.vehicleId);
            await vehRef.delete(); // delete vehicle doc
            }
        }

        // delete user doc
        await userRef.delete();

        // Delete Firebase Auth user
        await this.firebase.auth.deleteUser(firebaseUid);

        return { message: "User deleted successfully"}
    }

    async getBookingRequests(firebaseUid: string) {
        const rides = await this.firebaseDriverService.getRideByDriver(firebaseUid);

        // Initialize an array to hold filtered and cleaned booking requests
        const bookingRequests: any [] = [];

        // Loop through each ride associated with this driver
        for(const ride of rides){
            // Query the bookings collection to find all bookings for the current ride
            const bookings = await this.firebase.firestore
                .collection('bookings')
                .where('rideId', '==', ride.rideId)
                .get();

            // Loop through each booking document
            for(const booking of bookings.docs)
                // Check if the booking status is PENDING (i.e., awaiting driver action)
                if (booking.data().status === BookingStatus.PENDING){
                    // Fetch the user data of the passenger who made this booking
                    const userData = await this.firebaseUserService.fetchUserData(booking.data().passengerId);
                    // Select only the required user fields (name and average rating)
                    const cleanUserData = pickFields(userData, ['name', 'averageRating'])
                    // Get seats booked
                    const cleanBookingData = pickFields(booking.data(), ['bookingId', 'seatsBooked'])
                    // Get start and end location
                    const rideData = await this.firebaseDriverService.fetchRideData(booking.data().rideId);
                    const cleanRideData = pickFields(rideData, ['startLocation', 'endLocation']);

                    // Merge the cleaned user and booking data into one object and store in the result array
                    bookingRequests.push({ ...cleanUserData, ...cleanBookingData, ...cleanRideData })
                }
        }
        // Return the list of all pending booking requests
        return { bookings: bookingRequests }
    }

    async acceptBookingRequest(bookingId: string) {
        const bookingRef = await this.firebaseUserService.getBookingRef(bookingId);
        
        // Extract the booking data from the document snapshot
        const bookingData = await this.firebaseUserService.fetchBookingData(bookingId);

        const rideRef = await this.firebaseDriverService.getRideRef(bookingData.rideId);

        const rideData = await this.firebaseDriverService.fetchRideData(bookingData.rideId);

        // 💳 Capture the authorized payment (only if paymentIntentId exists)
        if (bookingData.paymentIntentId) {
            try {
                const paymentIntent = await this.stripe.paymentIntents.retrieve(bookingData.paymentIntentId);

                if (paymentIntent.status === 'requires_capture') {
                    await this.stripe.paymentIntents.capture(bookingData.paymentIntentId);

                    await this.firebase.firestore.collection('payments').doc(bookingData.paymentIntentId).update({
                        status: PaymentStatus.PAID,
                        completedAt: this.firebase.FieldValue.serverTimestamp(),
                    });
                } 
                else {
                    console.log(`ℹ️ PaymentIntent ${paymentIntent.id} not ready for capture: status is '${paymentIntent.status}'`);
                }
            } 
            catch (err) {
                console.error(`❌ Failed to capture payment for booking ${bookingId}`, err.message);
                throw new Error('Payment capture failed. Booking cannot be confirmed.');
            }
        } 
        else {
            console.log(`ℹ️ No PaymentIntent found for booking ${bookingId}, skipping payment capture.`);
        }

        // Update the status field of this booking to CONFIRMED
        bookingRef.update({ status: BookingStatus.CONFIRMED })

        // Notify passenger
        await this.notifyPassenger(
            bookingData.passengerId,
            '✅ Booking Confirmed',
            `Your ride booking from ${rideData.startLocation} to ${rideData.endLocation} has been accepted by the driver.`
        );
        
        // Update the ride's status to BOOKED
        // This implies that at least one booking has been accepted for the ride
        if(rideData.status === RideStatus.IN_PROGRESS){
            rideRef.update({ status: RideStatus.BOOKED})
        }
        const newSeatsBooked = rideData.bookedSeats + bookingData.seatsBooked
        rideRef.update({ bookedSeats: newSeatsBooked})
        
        return { message: "Booking confirmed" }
    }

    async declineBookingRequest(bookingId: string) {
        const bookingRef = await this.firebaseUserService.getBookingRef(bookingId);

        // Extract the booking data from the snapshot
        const bookingData = await this.firebaseUserService.fetchBookingData(bookingId);

        // Retrieve the corresponding ride details using the rideId from the booking
        const rideData = await this.firebaseDriverService.fetchRideData(bookingData.rideId);

        // 💳 Cancel the PaymentIntent (only if paymentIntentId exists)
        if (bookingData.paymentIntentId) {
            try {
                const paymentIntent = await this.stripe.paymentIntents.retrieve(bookingData.paymentIntentId);

                if (paymentIntent.status === 'requires_capture') {
                    await this.stripe.paymentIntents.cancel(bookingData.paymentIntentId);

                    await this.firebase.firestore.collection('payments').doc(bookingData.paymentIntentId).update({
                        status: PaymentStatus.CANCELLED,
                        cancelledAt: this.firebase.FieldValue.serverTimestamp(),
                    });
                } 
                else {
                    console.log(`ℹ️ PaymentIntent ${paymentIntent.id} not cancelled — status is '${paymentIntent.status}'`);
                }
            } 
            catch (err) {
                console.error(`❌ Failed to cancel payment for booking ${bookingId}`, err.message);
            }
        } 
        else {
            console.log(`ℹ️ No PaymentIntent found for booking ${bookingId}, skipping payment cancellation.`);
        }

        // ❗ Update booking status to CANCELLED
        await bookingRef.update({ status: BookingStatus.CANCELLED });

        // Notify passenger
        await this.notifyPassenger(
            bookingData.passengerId,
            '❌ Booking Declined',
            `Unfortunately, your booking request from ${rideData.startLocation} to ${rideData.endLocation} was declined by the driver.`
        );

        // Calculate the new available seat count by adding back the cancelled seats
        const newSeats = bookingData.seatsBooked + rideData.availableSeats;

        // Get a reference to the ride document
        const rideRef = await this.firebase.firestore.collection('rides').doc(bookingData.rideId);

        // Update the ride document with the new available seat count
        rideRef.update({ availableSeats: newSeats })

        return { message: "Booking declined" }
    }

    async notifyPassenger(passengerId: string, title: string, body: string) {
        // Query Firestore for all FCM tokens associated with this passenger
        const tokenSnap = await this.firebase.firestore.collection('device-tokens')
            .where('userId', '==', passengerId)
            .get();

        // If no tokens are found, log a warning and exit the function
        if (tokenSnap.empty) {
            console.warn(`⚠️ No FCM tokens found for passenger ${passengerId}`);
            return;
        }

        // Extract the token strings from the Firestore documents
        const tokens = tokenSnap.docs.map(doc => doc.data().token);
        
        // Loop through each token and send the notification individually
        for (const token of tokens) {
            try {
                // Attempt to send the notification using FirebaseNotificationsService
                await this.FirebaseNotificationsService.sendToDevice(token, title, body);
                console.log(`✅ Notified passenger ${passengerId}`);
            } catch (error) {
                // Catch and log any error that occurs while sending the notification
                console.error(`❌ Error notifying passenger ${passengerId}`);
            }
        }
    }
    
    async saveDeviceToken(firebaseUid: string, token: string) {
        const tokenRef = this.firebase.firestore.collection('device-tokens').doc(token);
        const existingDoc = await tokenRef.get();

        const now = Timestamp.now().toDate();

        const tokenData: any = {
            userId: firebaseUid,
            token,
            lastActive: now,
        };

        if (!existingDoc.exists) {
            tokenData.createdAt = now;
        }

        await tokenRef.set(tokenData, { merge: true });
    }
}