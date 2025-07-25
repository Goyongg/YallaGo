import { Body, Controller, Get, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/firebase/firebase-auth.guard';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class ReviewsController {

    constructor(private readonly reviewsService: ReviewsService) {}

    @UseGuards(FirebaseAuthGuard)
    @Get()
    async getReviews(@Req() req) {
        const firebaseUid = req.user.uid;

        return this.reviewsService.getReviews(firebaseUid)
    }

    @UseGuards(FirebaseAuthGuard)
    @Post()
    async addReview(@Body(ValidationPipe) createReviewDto: CreateReviewDto, @Req() req) {
        const firebaseUid = req.user.uid; // extract user id from the request

        return this.reviewsService.createReview(createReviewDto, firebaseUid)
    }
}
