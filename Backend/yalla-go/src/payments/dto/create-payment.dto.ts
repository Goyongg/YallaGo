import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreatePaymentDto {
    @IsNotEmpty()
    @IsString()
    rideId:string;
    
    @IsNotEmpty()
    @IsNumber()
    amount: number;
}