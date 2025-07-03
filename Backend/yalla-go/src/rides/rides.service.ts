import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { RideStatus } from './enums/ride-status.enum';

// clean any undefined fields for ride data
function cleanRideData(data: Record<string, any>) {
    const result: Record<string, any> = {}

    // go through each key value pairs and check undefined values
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || (typeof value === "string" && value.trim() === "")) { // check undefined/empty values
            if (key === 'femaleOnly') { // set femaleOnly to false
                result[key] = false;
            }
            continue; // omit undefined fields
        }

        // Omit empty arrays
        if (Array.isArray(value) && value.length === 0) {
            continue;
        }

        result[key] = value;
    }

    return result; // return cleaned ride data
}

@Injectable()
export class RidesService {
    constructor(private readonly firebase: FirebaseService) {}

    // Check if user role is driver, then check if kyc is verified and if vehicle exists for driver
    private async validateDriver(firebaseUid: string) {
        const userSnap = await this.firebase.firestore.collection('users').doc(firebaseUid).get();
        if (!userSnap.exists) {
            throw new NotFoundException('User profile not found');
        }

        const user = userSnap.data()!; // assert non-null as already checked if exists

        if (user.role !== 'driver') { // check role
            throw new ForbiddenException('Only Drivers can create rides.');
        }
        if (user.kycStatus !== 'verified') { // check kycStatus
            throw new ForbiddenException('Driver account is not verified');
        }
        if (!user.vehicleId) { // check if driver has a vehicle
            throw new ForbiddenException('Driver must have a registered vehicle.');
        }
    }

    // parse date and time from dto and convert to Timestamp
    private parseUaeDateTime(date: string, time: string) {
        const isoString = `${date}T${time}:00+04:00`; // set UAE timezone
        const jsDate = new Date(isoString);

        if (isNaN(jsDate.getTime())) {
        throw new BadRequestException('Invalid departureTime format');
        }
        if (jsDate.getTime() < Date.now()) { // check if deptature is in future
        throw new BadRequestException('Departure time must be in the future.');
        }

        return this.firebase.Timestamp.fromDate(jsDate); // return firestore Timestamp
    }

    // create ride service
    async createRide(createRideDto: CreateRideDto, firebaseUid: string) {

        // verify driver
        await this.validateDriver(firebaseUid);

        // Convert coordinates into GeoPoint
        const startGeoPoint = new this.firebase.GeoPoint(
            createRideDto.startPoint.lat, 
            createRideDto.startPoint.lng
        );
        const endGeoPoint = new this.firebase.GeoPoint(
            createRideDto.endPoint.lat, 
            createRideDto.endPoint.lng
        );

        // combine date and time (convert to UAE timezone)
        const departureTime = this.parseUaeDateTime(createRideDto.date, createRideDto.time);

        // destructure to pull out date, time, start/end coordinates
        const {date, time, startPoint, endPoint, ...rest } = createRideDto; 

        // create the ride doc
        const rideRef = this.firebase.firestore.collection('rides').doc();
        const rawRideData = {
            rideId: rideRef.id, // set rideId
            driverId: firebaseUid, // link driverId
            startGeo: startGeoPoint,
            endGeo: endGeoPoint,
            departureTime: departureTime,
            ...rest, // spread out ride fields 
            status: RideStatus.IN_PROGRESS
        };

        const rideData = cleanRideData(rawRideData);

        await rideRef.set(rideData); // set ride data
        return { message: "Ride created successfull", rideId: rideData.rideId }
    };
}
