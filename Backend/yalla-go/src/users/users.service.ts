import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { getUserDefaults } from './dto/user-defaults.dto';

@Injectable()
export class UsersService {
    constructor(private readonly firebase: FirebaseService) {}

    // create the user in firestore
    async createUser(createUserDto: CreateUserDto | CreateDriverDto, firebaseUid: string) {
        const userRef = this.firebase.firestore.collection('users').doc();
        const userData = {
            userId: firebaseUid, // set userid
            // spread out fields of the new user
            ...createUserDto,
            ...getUserDefaults(createUserDto.role)
        };

        await userRef.set(userData); // set data to the user
        return { message: "User created successfully", userId: firebaseUid}
    };
}
