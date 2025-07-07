import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, Min } from "class-validator";
import { RidePlanDto } from "./ride-plan.dto";

export class SearchRidesDto extends RidePlanDto {
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    requestedSeats: number;

    @IsOptional()
    @IsBoolean()
    femaleOnly?: boolean;
}