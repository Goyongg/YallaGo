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
        time: string,
        waypoints: { lat: number; lng: number}[] = [] //default empty array
    ) {
        // Fetch Google Maps API key from environment
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) { // check if API key exist
            throw new InternalServerErrorException('Missing GOOGLE_MAPS_API_KEY');
        }

        // convert date and time into a Date object in seconds
        // used to check for distance and duration incase of traffic (during peak hours with congestion)
        const departureTimestamp = Math.floor(
            new Date(`${date}T${time}:00+04:00`).getTime() / 1000
        );

        console.log(`Date: ${date}, Time: ${time}`);

        // Prepare paramters for Directions API call
        const params: any = {
            origin: `${startLat},${startLng}`,
            destination: `${endLat},${endLng}`,
            mode: TravelMode.driving,
            departure_time: departureTimestamp,
            traffic_model: TrafficModel.best_guess,
            key: apiKey,
        };

        // If waypoints given, add waypoints into parameters
        if (waypoints && waypoints.length > 0) {
            // Filter out any invalid or incomplete waypoint objects
            // and map them to the "lat,lng" format required by the Directions API
            params.waypoints = waypoints
                .filter((wp) => wp && typeof wp.lat === 'number' && typeof wp.lng === 'number')
                .map((wp) => `${wp.lat},${wp.lng}`);
        }

        // Call Directions API with prepared parameters
        let response;

        try {
        response = await this.client.directions({ params });
        } catch (error: any) {
        const message =
            error?.response?.data?.error_message ||
            error?.message ||
            'Unknown error from Google Maps API';

        console.error(`Google Maps API error: ${message}`);
        console.error(`For request with Date: ${date}, Time: ${time}`);

        throw new InternalServerErrorException(`Google Maps API failed: ${message}`);
        }

        if (response.data.status !== 'OK') { // Return error if API status is not OK
            throw new ServiceUnavailableException(`Directions API error: ${response.data.status}`);
        }

        // Get the first route returned by the API
        const route = response.data.routes[0];
        // Each leg represents a segment between origin, waypoints, and destination
        const legs = route.legs;

        let totalDistance = 0;
        let totalDuration = 0;

        // Sum distance and duration across all legs
        for (const leg of legs) {
            // Add distance for this leg
            totalDistance += leg.distance.value;

            // Add duration considering if traffic avaiable
            // if not fallback to normal duration of leg
            totalDuration += leg.duration_in_traffic?.value ?? leg.duration.value;
        }

        // Return accumulated distance and duration
        return {
            distanceMeters: totalDistance,
            durationSeconds: totalDuration
        };
    }
}
