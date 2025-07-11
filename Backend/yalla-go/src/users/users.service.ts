import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { getUserDefaults } from './dto/user-defaults.dto';
import { omitFields, pickFields } from 'src/common/helpers/object.helpers';
import { FirebaseUserService } from 'src/firebase/firebase-user.service';
import { FirebaseDriverService } from 'src/firebase/firebase-driver.service';

// clean any undefined fields for userData
function cleanUserData(data: Record<string, any>) {
    const result: Record<string, any> = {}

    // go through each key value pairs and check undefined values
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || (typeof value === "string" && value.trim() === "")) { // check undefined/empty values
            if (key === 'gender') { // set default gender
                result[key] = 'prefer_not_to_say'
            }
            continue; //omit undefined fields
        }
        result[key] = value;
    }

    return result; // return cleaned user data
}

@Injectable()
export class UsersService {
    constructor(
        private readonly firebase: FirebaseService,
        private readonly firebaseUserService: FirebaseUserService,
        private readonly firebaseDriverService: FirebaseDriverService
    ) {}

    // fetch homepage user data based on role
    async getHomePageInfo(firebaseUid: string) {
        const userData = await this.firebaseUserService.fetchUserData(firebaseUid);

        const homepageFields = ['userId', 'name', 'gender', 'role', 'averageRating', 'ecoPoints'];

        const response = pickFields(userData, homepageFields);

        // return user info
        return response; 
    }

    async getUserProfile(firebaseUid: string) {
        const userData = await this.firebaseUserService.fetchUserData(firebaseUid);

        // retrive vehicle info if driver
        if (userData.role === 'driver') { 
            const vehichleData = await this.firebaseDriverService.fetchVehicleData(firebaseUid);

            // return user w/ vehicle data
            return { 
                user: omitFields(userData, ['ratingCount', 'vehicleId']),
                vehicle: omitFields(vehichleData, ['vehicleId', 'driverId'])
            };
        };

        return omitFields(userData, ['ratingCount']);
    }

    // create the user in firestore
    async createUser(createUserDto: CreateUserDto | CreateDriverDto, firebaseUid: string) {
        const userRef = this.firebase.firestore.collection('users').doc(firebaseUid);
        const rawUserData = {
            userId: firebaseUid, // set userid
            // spread out fields of the new user
            ...createUserDto,
            ...getUserDefaults(createUserDto.role)
        };

        const userData = cleanUserData(rawUserData);

        await userRef.set(userData); // set data to the user
        return { message: "User created successfully", userId: firebaseUid }
    };
}