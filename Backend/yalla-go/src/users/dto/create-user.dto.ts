import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

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
    @IsString()
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
    @IsString()
    emergencyContactPhone?: string;
}