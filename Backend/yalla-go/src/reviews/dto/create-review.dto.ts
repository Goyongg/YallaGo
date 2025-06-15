import { IsNumber, IsOptional } from "class-validator";

export class CreateReviewDto {
    @IsNumber()
    rating: number;

    @IsOptional()
    comment?: string;
}