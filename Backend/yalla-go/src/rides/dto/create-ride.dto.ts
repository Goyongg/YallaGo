import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { RidePlanDto } from "./ride-plan.dto";
import { Type } from "class-transformer";
import { Waypoint } from "./waypoint.dto";

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
    @IsArray()
    @ValidateNested({ each: true})
    @Type(() => Waypoint)
    waypoints?: Waypoint[];
}