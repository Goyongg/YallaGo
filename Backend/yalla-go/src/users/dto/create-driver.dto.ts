import { IsNotEmpty, IsNumber } from "class-validator";
import { CreateUserDto } from "./create-user.dto";

export class CreateDriverDto extends CreateUserDto {
    @IsNotEmpty()
    @IsNumber()
    licenseNumber: number;
}