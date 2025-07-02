import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { getUserDefaults } from './dto/user-defaults.dto';

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
    constructor(private readonly firebase: FirebaseService) {}

    // fetch homepage user data based on role
    async getHomePageInfo(firebaseUid: string) {
        const userDoc = await this.firebase.firestore.collection('users').doc(firebaseUid).get();
        if (!userDoc.exists) {
            throw new NotFoundException('User not found');
        };

        const userData = userDoc.data();
        if (!userData) {
            throw new NotFoundException('User data is undefined');
        }

        const response: any = {
            uid: userData.userId,
            name: userData.name,
            role: userData.role,
            averageRating: userData.averageRating,
            ecoPoints: userData.ecoPoints
        };

        // return user info
        return response; 
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