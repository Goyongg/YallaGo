import { Type } from "class-transformer";
import { IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { Coordinates } from "src/common/coordinates.dto";

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
}