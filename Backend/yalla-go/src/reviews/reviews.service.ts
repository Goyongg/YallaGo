import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Timestamp } from 'firebase-admin/firestore';


@Injectable()
export class ReviewsService {

    constructor(private readonly firebase: FirebaseService) {}

    //create a review in firestore
    async createReview(createReviewDto: CreateReviewDto, firebaseUid: string) {
        const revRef = this.firebase.firestore.collection('review').doc();
        const reviewData = {
            reviewId: revRef.id,
            reviewerId: firebaseUid,
            //revieweeId:,
            //rideId:,
            //spread out the fields of the review
            ...createReviewDto,
            timeStamp: Timestamp.now().toDate
        }

        await revRef.set(reviewData); // set data to vehicle
        return { message: "Review added successfully", reviewId: revRef.id }
    };

}
