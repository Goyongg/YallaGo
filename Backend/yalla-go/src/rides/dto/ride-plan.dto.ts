import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { Coordinates } from "src/common/coordinates.dto";
import { Waypoint } from "./waypoint.dto";

export class RidePlanDto {
    @ValidateNested()
    @Type(() => Coordinates)
    startPoint: Coordinates;

    @ValidateNested()
    @Type(() => Coordinates)
    endPoint: Coordinates;

    @IsNotEmpty()
    @IsString()
    date: string;

    @IsNotEmpty()
    @IsString()
    time: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true})
    @Type(() => Waypoint)
    waypoints?: Waypoint[];
}