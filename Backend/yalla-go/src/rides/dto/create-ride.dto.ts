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
    date: string;

    @IsNotEmpty()
    @IsString()
    time: string;

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
    @IsArray()
    waypoints: string[]
}