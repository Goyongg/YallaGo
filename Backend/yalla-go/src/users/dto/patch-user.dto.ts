import { IsEmail, IsEnum, IsMobilePhone, IsNumber, IsOptional, IsString } from "class-validator";
import { UserGender } from "./create-user.dto";

export class PatchUserDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsMobilePhone()
    phoneNumber?: string;

    @IsOptional()
    @IsEnum(UserGender)
    gender?: UserGender;

    @IsOptional()
    @IsString()
    emergencyContactName?: string;

    @IsOptional()
    @IsMobilePhone()
    emergcencyContactPhone?: string;

    @IsOptional()
    @IsNumber()
    licenseNumber?: number;
}