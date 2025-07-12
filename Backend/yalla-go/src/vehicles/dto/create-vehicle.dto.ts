import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateVehicleDto {
    @IsNotEmpty()
    @IsString()
    make: string;
    
    @IsNotEmpty()
    @IsString()
    model: string;

    @IsNotEmpty()
    @IsString()
    plateNumber: string;

    @IsNotEmpty()
    @IsString()
    color: string;

    @IsNumber()
    @Min(1)
    @Max(7)
    seats: number;
}