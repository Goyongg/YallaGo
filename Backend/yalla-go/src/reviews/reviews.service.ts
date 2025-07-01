import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Timestamp } from 'firebase-admin/firestore';


@Injectable()
export class ReviewsService {

    constructor(private readonly firebase: FirebaseService) {}

    //create a review in firestore
    async createReview(createReviewDto: CreateReviewDto, firebaseUid: string) {
        // Fetch role from the users collection
        const role = await this.fetchReviewerRole(firebaseUid);
        
        const revieweeId = await this.fetchRevieweeId(createReviewDto.rideId, role);
        
        const revRef = this.firebase.firestore.collection('reviews').doc();
        const reviewData = {
            reviewId: revRef.id,
            reviewerId: firebaseUid,
            revieweeId,
            //spread out the fields of the review
            ...createReviewDto,
            timeStamp: this.firebase.Timestamp.now()
        }

        await revRef.set(reviewData); // set data to vehicle
        return { message: "Review added successfully", reviewId: revRef.id }
    };

    private async fetchReviewerRole(firebaseUid: string): Promise<'driver' | 'passenger'> {
        const userSnap = await this.firebase.firestore.collection('users').doc(firebaseUid).get();

        if (!userSnap.exists) {
            throw new NotFoundException(`User with UID ${firebaseUid} not found`);
        }

        const userData = userSnap.data();
        const role = userData?.role;
        if (role !== 'driver' && role !== 'passenger') {
            throw new BadRequestException(`Invalid or missing role for user ${firebaseUid}`);
        }

        return role;
    }

    private async fetchRevieweeId(rideId: string, role: 'driver' | 'passenger'): Promise<string> {
        if (role === 'driver') {
            const bookingSnap = await this.firebase.firestore.collection('bookings').doc(rideId).get();

            if (!bookingSnap.exists) {
                throw new NotFoundException(`Booking not found`);
            }

            const bookingData = bookingSnap.data();
            if (!bookingData?.passengerId) {
                throw new NotFoundException(`Booking does not have a passengerId`);
            }

            return bookingData.passengerId;
        }

        if (role === 'passenger') {
            const rideSnap = await this.firebase.firestore.collection('rides').doc(rideId).get();

            if (!rideSnap.exists) {
                throw new Error(`Ride with ID ${rideId} not found`);
            }

            const rideData = rideSnap.data();
            if (!rideData?.driverId) {
                throw new Error(`Ride ${rideId} does not have a driverId`);
            }

            return rideData.driverId;
        }

        throw new Error(`Invalid role: ${role}`);
    }

}
