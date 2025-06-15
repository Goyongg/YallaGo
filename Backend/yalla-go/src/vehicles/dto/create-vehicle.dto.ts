import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

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

    @IsOptional()
    @IsString()
    color: string;

    @IsNumber()
    @Min(1)
    seats: number;
}