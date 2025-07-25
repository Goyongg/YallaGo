import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { RidePlanDto } from "./ride-plan.dto";

export class CreateRideDto extends RidePlanDto {
    @IsNotEmpty()
    @IsString()
    startLocation: string;

    @IsNotEmpty()
    @IsString()
    endLocation: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    pricePerSeat: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    availableSeats: number;

    @IsOptional()
    @IsBoolean()
    femaleOnly: boolean;

    @IsOptional()
    @MaxLength(200, { message: "Comments can be at most 200 characters long" })
    comments?: string
}