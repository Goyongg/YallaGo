import { IsNotEmpty, IsString } from "class-validator";


export class UpdateVehicleColorDto {
    @IsNotEmpty()
    @IsString()
    color: string;
}