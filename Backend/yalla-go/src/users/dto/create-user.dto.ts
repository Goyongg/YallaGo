import { IsEmail, IsEnum, IsMobilePhone, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum UserRole {
    DRIVER = "driver",
    PASSENGER = "passenger"
}

export enum UserGender {
    MALE = "male",
    FEMALE = "female"
}

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsMobilePhone()
    phoneNumber: string;

    @IsOptional()
    @IsEnum(UserGender)
    gender?: string;

    @IsEnum(UserRole)
    role: UserRole;

    @IsOptional()
    @IsString()
    emergencyContactName?: string;

    @IsOptional()
    @IsMobilePhone()
    emergencyContactPhone?: string;
}