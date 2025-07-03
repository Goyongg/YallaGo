import { IsNotEmpty, IsNumber } from "class-validator";

export class Coordinates {
    @IsNotEmpty()
    @IsNumber()
    lat: number;

    @IsNotEmpty()
    @IsNumber()
    lng: number;
}