import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateRideDto {
    @IsNotEmpty()
    @IsString()
    startLocation: string;

    @IsNotEmpty()
    @IsString()
    endLocation: string;

    @IsNotEmpty()
    @IsString()
    departureTime: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    pricePerSeat: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    availableseats: number;

    @IsOptional()
    @IsBoolean()
    femaleOnly: boolean;

    @IsArray()
    waypoints: string[]
}