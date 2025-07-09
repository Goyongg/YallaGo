import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";
import { Coordinates } from "src/common/coordinates.dto";

export class CreateRidePassengerDto {
    @IsNotEmpty()
    @IsString()
    rideId: string;

    @IsNotEmpty()
    @IsString()
    pickupPoint: string;

    @ValidateNested()
    @Type(() => Coordinates)
    startPoint: Coordinates;

    @IsNotEmpty()
    @IsString()
    dropOffPoint: string;

    @ValidateNested()
    @Type(() => Coordinates)
    endPoint: Coordinates;

    @IsNotEmpty()
    @IsNumber()
    seatsBooked: number;
}