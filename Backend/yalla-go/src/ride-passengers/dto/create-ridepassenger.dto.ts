import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";
import { Coordinates } from "src/common/coordinates.dto";

export class CreateRidePassengerDto {
    @IsNotEmpty()
    @IsString()
    rideId: string;

    @IsNotEmpty()
    @IsNumber()
    seatsBooked: number;

    @IsNotEmpty()
    @IsNumber()
    bookingPrice: number;

    @IsNotEmpty()
    @IsString()
    paymentIntentId: string;
}