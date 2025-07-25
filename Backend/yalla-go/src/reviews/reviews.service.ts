import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { FirebaseUserService } from 'src/firebase/firebase-user.service';
import { FirebaseDriverService } from 'src/firebase/firebase-driver.service';

@Injectable()
export class ReviewsService {

    constructor(
        private readonly firebase: FirebaseService,
        private readonly firebaseUserService: FirebaseUserService,
        private readonly firebaseDriverService: FirebaseDriverService
    ) {}

    private async fetchReviewerRole(firebaseUid: string) {
        const userData = await this.firebaseUserService.fetchUserData(firebaseUid);

        // Get the user's role from the data (e.g., 'driver' or 'passenger')
        const role = userData.role;

        if (role !== 'driver' && role !== 'passenger') {
            throw new BadRequestException(`Invalid or missing role for user ${firebaseUid}`);
        }

        return role;
    }

    private async fetchRevieweeId(rideId: string) {
        const rideData = await this.firebaseDriverService.fetchRideData(rideId);

        return rideData.driverId;
    }

    private async updateRevieweeRating(revieweeId: string, rating: number) {
        const userRef = await this.firebaseUserService.getUserRef(revieweeId);

        const userData = await this.firebaseUserService.fetchUserData(revieweeId);

        // Read the user's current average rating and total number of ratings
        const currentRating = userData.averageRating;
        const currentRatingCount = userData.ratingCount;

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

    //create a review in firestore
    async createReview(createReviewDto: CreateReviewDto, firebaseUid: string) {
        // Get the user's role (driver or passenger) from their profile
        const role = await this.fetchReviewerRole(firebaseUid);
        
        // Determine the revieweeId based on the role
        let revieweeId: string;

        if (role === 'driver') {
                if (!createReviewDto.passengerId) {
                    throw new BadRequestException('Passenger ID must be provided when reviewer is a driver');
                }
                revieweeId = createReviewDto.passengerId;
        } else if (role === 'passenger') {
                revieweeId = await this.fetchRevieweeId(createReviewDto.rideId);
        } else {
                throw new BadRequestException(`Invalid reviewer role: ${role}`);
        }
        
        const revRef = this.firebase.firestore.collection('reviews').doc();
        // Construct the review data object
        const reviewData = {
            reviewId: revRef.id,
            reviewerId: firebaseUid,
            revieweeId: revieweeId,
            //spread out the fields of the review
            ...createReviewDto,
            timeStamp: this.firebase.Timestamp.now()
        }

        // Update the reviewee's average rating and rating count
        await this.updateRevieweeRating(revieweeId, createReviewDto.rating);

        await revRef.set(reviewData); // set data to review
        return { message: "Review added successfully", reviewId: revRef.id }
    };

    async getReviews(firebaseUid: string) {
        // Query the 'reviews' collection for documents where revieweeId matches the Firebase UID
        const reviewSnapshot = await this.firebase.firestore.collection('reviews').where('revieweeId', '==', firebaseUid).get();

        const reviews: any [] = [];

        // Iterate over each review document
        for (const doc of reviewSnapshot.docs) {
            const reviewData = doc.data();

            // Push details of each review into the array
            reviews.push({
                rating: reviewData.rating,
                comment: reviewData?.comment,
            });
        }

        // Return the compiled list of reviews
        return reviews;
    }

}
