import { Body, Controller, Delete, Get, Patch, Post, Query, Req, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole, CreateUserDto } from './dto/create-user.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { FirebaseAuthGuard } from 'src/firebase/firebase-auth.guard';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { PatchUserDto } from './dto/patch-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    // GET /users/home
    @UseGuards(FirebaseAuthGuard)
    @Get('home')
    async getHomePageInfo(@Req() req) {
        const firebaseUid = req.user.uid; // get uid from request
        console.log(firebaseUid);

        // await this.userService.saveDeviceToken(firebaseUid, fcmToken)
        // console.log(`Device Token: ${fcmToken}`);
        console.log(`[${new Date().toISOString()}] /users/home hit`);

        return await this.userService.getHomePageInfo(firebaseUid);
    }

    @UseGuards(FirebaseAuthGuard)
    @Post('save-device-token')
    async saveDeviceToken(@Req() req, @Body('fcmToken') fcmToken: string) {
        const firebaseUid = req.user.uid;

        return await this.userService.saveDeviceToken(firebaseUid, fcmToken)
    }

    // GET /users/profile
    @UseGuards(FirebaseAuthGuard)
    @Get('profile')
    async getUserProfile(@Req() req) {
        const firebaseUid = req.user.uid;
        console.log(firebaseUid);

        return await this.userService.getUserProfile(firebaseUid);
    }

    @UseGuards(FirebaseAuthGuard)
    @Get('booking-requests')
    async getBookingRequests(@Req() req) {
        const firebaseUid = req.user.uid;
        console.log(firebaseUid);

        return await this.userService.getBookingRequests(firebaseUid)
    }

    // POST /users/register
    @UseGuards(FirebaseAuthGuard)
    @Post('register')
    async registerUser(@Body(ValidationPipe) body: any, @Req() req) {

        const { role } = body; // extract role from body
        const firebaseUid = req.user.uid; // get uid from request

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

    @UseGuards(FirebaseAuthGuard)
    @Patch()
    async updateUser(@Body(ValidationPipe) patchUserDto: PatchUserDto, @Req() req) {
        const firebaseUid = req.user.uid; // get uid from request
        console.log(firebaseUid);

        return await this.userService.updateUser(patchUserDto, firebaseUid);
    }

    @UseGuards(FirebaseAuthGuard)
    @Patch('accept-booking')
    async acceptBookingRequest(@Query('bookingId') bookingId: string) {
        return this.userService.acceptBookingRequest(bookingId);
    }

    @UseGuards(FirebaseAuthGuard)
    @Patch('decline-booking')
    async declineBookingRequest(@Query('bookingId') bookingId: string) {
        return this.userService.declineBookingRequest(bookingId)
    }

    @UseGuards(FirebaseAuthGuard)
    @Delete()
    async deleteUser(@Req() req) {
        const firebaseUid = req.user.uid; // get uid from request
        console.log(firebaseUid);

        return await this.userService.deleteUser(firebaseUid);
    }
}