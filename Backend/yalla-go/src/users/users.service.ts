import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { getUserDefaults } from './dto/user-defaults.dto';

@Injectable()
export class UsersService {
    constructor(private readonly firebase: FirebaseService) {}

    async createUser(createUserDto: CreateUserDto) {
        const userRef = this.firebase.firestore.collection('users').doc();
        const userData = {
            userId: userRef.id,
            ...createUserDto,
            ...getUserDefaults(createUserDto.role)
        };

        await userRef.set(userData);
        return { message: "User created successfully", userId: userRef.id}
    };

    async createDriver(CreateDriverDto: CreateDriverDto) {
        const userRef = this.firebase.firestore.collection('users').doc();
        const userData = {
            userId: userRef.id,
            ...CreateDriverDto,
            ...getUserDefaults(CreateDriverDto.role)
        };

        await userRef.set(userData);
        return { message: "User created successfully", userId: userRef.id}
    };
}
