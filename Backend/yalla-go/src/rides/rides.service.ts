import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { RideStatus } from './enums/ride-status.enum';

// clean any undefined fields for userData
function cleanRideData(data: Record<string, any>) {
    const result: Record<string, any> = {}

    // go through each key value pairs and check undefined values
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined) { // check undefined values
            if (key === 'femaleOnly') { // set femaleOnly to false
                result[key] = false;
            }
            continue; // omit undefined fields
        }
        result[key] = value;
        
    }

    return result; // return cleand ride data
}

@Injectable()
export class RidesService {
    constructor(private readonly firebase: FirebaseService) {}

    async createRide(createRideDto: CreateRideDto, firebaseUid: string) {
        const rideRef = this.firebase.firestore.collection('rides').doc();
        const rawRideData = {
            rideId: rideRef.id, // set rideId
            driverId: firebaseUid, // link driverId
            // spread out ride fields
            ...createRideDto,
            status: RideStatus.IN_PROGRESS
        };

        const rideData = cleanRideData(rawRideData);

        await rideRef.set(rideData); // set ride data
        return { message: "Ride created successfull", rideId: rideData.rideId }
    };
}
