import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateReviewDto {
    @IsNotEmpty()
    @IsString()
    rideId: string;

    @IsNumber()
    rating: number;

    @IsOptional()
    comment?: string;
}