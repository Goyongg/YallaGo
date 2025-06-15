import { Type } from "class-transformer";
import { IsNumber, ValidateNested } from "class-validator";

class LocationDto {
    @IsNumber()
    latitude: number;

    @IsNumber()
    longtitude: number;
}
export class CreateSOSAlertDto {
    @ValidateNested()
    @Type(() => LocationDto)
    location: string;
}