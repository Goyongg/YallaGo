import { Type } from "class-transformer";
import { IsOptional, IsString, ValidateNested } from "class-validator";
import { Coordinates } from "src/common/coordinates.dto";

export class Waypoint {
    @ValidateNested()
    @Type(() => Coordinates)
    coordinates: Coordinates;

    @IsOptional()
    @IsString()
    label?: string;
}