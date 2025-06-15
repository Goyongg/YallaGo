import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateRidePassengerDto {
    @IsNotEmpty()
    @IsString()
    pickupPoint: string;

    @IsNotEmpty()
    @IsString()
    dropOffPoint: string;

    @IsNotEmpty()
    @IsNumber()
    seatsBooked: number;
}