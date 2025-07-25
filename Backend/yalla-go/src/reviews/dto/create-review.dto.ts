import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateReviewDto {
    @IsNotEmpty()
    @IsString()
    rideId: string;

    @IsString()
    @IsOptional()
    passengerId?: string;

    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @IsOptional()
    comment?: string;
}