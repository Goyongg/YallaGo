import { Body, Controller, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole, CreateUserDto } from './dto/create-user.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { FirebaseAuthGuard } from 'src/firebase/firebase-auth.guard';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    @UseGuards(FirebaseAuthGuard)
    @Post('register')
    async registerUser(@Body(ValidationPipe) body: any, @Req() req) {

        const { role } = body; // extract role from body
        const firebaseUid = req.user.uid; // extract user id from the request

        // validate role against the correct DTO
        if (role === UserRole.DRIVER) { // if driver
            // convert JSON payload (body) into class instance
            const driverDto = plainToInstance(CreateDriverDto, body);
            await validateOrReject(driverDto);
            return this.userService.createUser(driverDto, firebaseUid);
        }
        else { // if passenger
            const userDto = plainToInstance(CreateUserDto, body);
            await validateOrReject(userDto);
            return this.userService.createUser(userDto, firebaseUid);
        }
    }
}
