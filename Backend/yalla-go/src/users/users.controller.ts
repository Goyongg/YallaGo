import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateDriverDto } from './dto/create-driver.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    @Post('passenger')
    async createUser(@Body(ValidationPipe) createUserDto: CreateUserDto) {
        return this.userService.createUser(createUserDto);
    }

    @Post('driver')
    async Driver(@Body(ValidationPipe) CreateDriverDto: CreateDriverDto) {
        return this.userService.createDriver(CreateDriverDto);
    }
}
