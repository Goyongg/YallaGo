import { Client, TrafficModel, TravelMode } from '@googlemaps/google-maps-services-js';
import { Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class GoogleMapsService {
    private client: Client

    constructor() {
        this.client = new Client({});
    }

    // get distance and duration of the origin and destination points
    async getDistanceAndDuration(
        startLat: number,
        startLng: number,
        endLat: number,
        endLng: number,
        date: string,
        time: string
    ) {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) { // check if API key exist
            throw new InternalServerErrorException('Missing GOOGLE_MAPS_API_KEY');
        }

        // convert date and time into a Date object in seconds
        // used to check for distance and duration incase of traffic (during peak hours with congestion)
        const departureTimestamp = Math.floor(
            new Date(`${date}T${time}:00+04:00`).getTime() / 1000
        );

        // call distance matrix API
        const response = await this.client.distancematrix({
            params: {
                origins: [`${startLat},${startLng}`],
                destinations: [`${endLat},${endLng}`],
                mode: TravelMode.driving, // travel mode to driving
                departure_time: departureTimestamp, // date in seconds
                traffic_model: TrafficModel.best_guess, // buest guess model for traffic
                key: apiKey,
            },
        });

        const element = response.data.rows[0].elements[0];

        if (element.status !== 'OK') { // check if the API call was successful
            throw new ServiceUnavailableException(`Distance Matrix API error: ${element.status}`);
        }

        return { // return distance and duration
            distanceMeters: element.distance.value,
            durationSeconds: element.duration.value
        };
    }
}
