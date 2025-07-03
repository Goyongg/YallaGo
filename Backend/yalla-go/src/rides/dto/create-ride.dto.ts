import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { Coordinates } from "src/common/coordinates.dto";

export class CreateRideDto {
    @IsNotEmpty()
    @IsString()
    startLocation: string;

    @ValidateNested()
    @Type(() => Coordinates)
    startPoint: Coordinates

    @IsNotEmpty()
    @IsString()
    endLocation: string;

    @ValidateNested()
    @Type(() => Coordinates)
    endPoint: Coordinates

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