import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {

    constructor(private readonly firebase: FirebaseService) {}

    //create a review in firestore
    async createReview(createReviewDto: CreateReviewDto, firebaseUid: string) {
        // Get the user's role (driver or passenger) from their profile
        const role = await this.fetchReviewerRole(firebaseUid);
        // Determine who is being reviewed (the revieweeId)
        const revieweeId = await this.fetchRevieweeId(createReviewDto.rideId, role);
        
        const revRef = this.firebase.firestore.collection('reviews').doc();
        // Construct the review data object
        const reviewData = {
            reviewId: revRef.id,
            reviewerId: firebaseUid,
            revieweeId,
            //spread out the fields of the review
            ...createReviewDto,
            timeStamp: this.firebase.Timestamp.now()
        }

        // Update the reviewee's average rating and rating count
        await this.updateRevieweeRating(revieweeId, createReviewDto.rating);

        await revRef.set(reviewData); // set data to review
        return { message: "Review added successfully", reviewId: revRef.id }
    };

    private async fetchReviewerRole(firebaseUid: string): Promise<'driver' | 'passenger'> {
        const userSnap = await this.firebase.firestore.collection('users').doc(firebaseUid).get();
        // If the user document does not exist, throw a NotFoundException
        if (!userSnap.exists) {
            throw new NotFoundException(`User with UID ${firebaseUid} not found`);
        }
        
        // Extract the user data from the Firestore document
        const userData = userSnap.data();

        // Get the user's role from the data (e.g., 'driver' or 'passenger')
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

            // Extract booking data from the document
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

            // Extract ride data from the document
            const rideData = rideSnap.data()!;

            if (!rideData.driverId) {
                throw new NotFoundException(`Ride does not have a driverId`);
            }

            return rideData.driverId;
        }

        // If the role is somehow not 'driver' or 'passenger', throw a generic error (should not happen due to earlier validation)
        throw new Error(`Invalid role: ${role}`);
    }

    private async updateRevieweeRating(revieweeId: string, rating: number) {
        const userRef = this.firebase.firestore.collection('users').doc(revieweeId);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            throw new NotFoundException('User profile not found');
        }

        // Extract user data from the snapshot (non-null assertion used since existence was already checked)
        const userData = userSnap.data()!;

        // Read the user's current average rating and total number of ratings
        const currentRating = userData.averageRating;
        const currentRatingCount = userData.ratingcount;

        // Compute the updated total rating count
        const updatedRatingCount = currentRatingCount + 1;

        // Calculate the new average rating using a running average formula
        const updatedRating = ((currentRating * currentRatingCount) + rating) / updatedRatingCount;

        // Update the user document in Firestore with the new average rating and rating count
        await userRef.update({
            averageRating: updatedRating,
            ratingCount: updatedRatingCount
        })
    }

    async getReviews(firebaseUid: string) {
        // Query the 'reviews' collection for documents where revieweeId matches the Firebase UID
        const reviewSnapshot = await this.firebase.firestore.collection('reviews').where('revieweeId', '==', firebaseUid).get();

        const reviews: any [] = [];

        // Iterate over each review document
        for (const doc of reviewSnapshot.docs) {
            const data = doc.data();

            // Push details of each review into the array
            reviews.push({
                rating: data.rating,
                comment: data?.comment,
            });
        }

        // Return the compiled list of reviews
        return reviews;
    }

}
