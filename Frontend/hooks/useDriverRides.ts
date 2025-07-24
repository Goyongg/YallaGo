// COMPLETE REPLACEMENT for useDriverRides.ts
import { useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import { DriverRideResponse, ProcessedDriverRide, UseDriverRidesReturn } from '../interfaces/interfaces';
import { BASE_URL } from '@/config';

const useDriverRides = (): UseDriverRidesReturn => {
  const [rides, setRides] = useState<ProcessedDriverRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CRITICAL: Add safety functions
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    return String(value);
  };

  const safeNumber = (value: any): number => {
    if (value === null || value === undefined || isNaN(Number(value))) return 0;
    return Number(value);
  };

  // Function to format time from seconds - FIXED with safety
  const formatDuration = (seconds: number): string => {
    try {
      const safeSeconds = safeNumber(seconds);
      const hours = Math.floor(safeSeconds / 3600);
      const minutes = Math.floor((safeSeconds % 3600) / 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    } catch (error) {
      console.error('🚗 Error formatting duration:', error);
      return '0m';
    }
  };

  // Function to format Firestore timestamp to time string - FIXED with safety
  const formatTime = (timestamp: any): string => {
    try {
      if (!timestamp) {
        console.log('🚗 No timestamp provided');
        return '00:00';
      }
      
      // Handle Firestore timestamp
      let date: Date;
      if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp && typeof timestamp._seconds === 'number') {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp && typeof timestamp.seconds === 'number') {
        date = new Date(timestamp.seconds * 1000);
      } else {
        // Try to parse as regular date
        date = new Date(timestamp);
      }
      
      // Validate the date
      if (!date || isNaN(date.getTime())) {
        console.log('🚗 Invalid date object:', date);
        return '00:00';
      }
      
      const timeString = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      console.log('🚗 Formatted time:', timeString);
      return safeString(timeString) || '00:00';
    } catch (error) {
      console.error('🚗 Error formatting time:', error);
      return '00:00';
    }
  };

  // Function to calculate arrival time - FIXED with safety
  const calculateArrivalTime = (departureTimestamp: any, durationSeconds: number): string => {
    try {
      if (!departureTimestamp) {
        console.log('🚗 No departure timestamp for arrival calculation');
        return '00:00';
      }
      
      const safeDurationSeconds = safeNumber(durationSeconds);
      
      let departureDate: Date;
      if (departureTimestamp && typeof departureTimestamp.toDate === 'function') {
        departureDate = departureTimestamp.toDate();
      } else if (departureTimestamp && typeof departureTimestamp._seconds === 'number') {
        departureDate = new Date(departureTimestamp._seconds * 1000);
      } else if (departureTimestamp && typeof departureTimestamp.seconds === 'number') {
        departureDate = new Date(departureTimestamp.seconds * 1000);
      } else {
        departureDate = new Date(departureTimestamp);
      }
      
      // Validate the departure date
      if (!departureDate || isNaN(departureDate.getTime())) {
        console.log('🚗 Invalid departure date for arrival calculation');
        return '00:00';
      }
      
      const arrivalDate = new Date(departureDate.getTime() + (safeDurationSeconds * 1000));
      
      if (isNaN(arrivalDate.getTime())) {
        console.log('🚗 Invalid arrival date calculation');
        return '00:00';
      }
      
      const timeString = arrivalDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      return safeString(timeString) || '00:00';
    } catch (error) {
      console.error('🚗 Error calculating arrival time:', error);
      return '00:00';
    }
  };

  // Function to get date string for grouping - FIXED with safety
  const getDateString = (timestamp: any): string => {
    try {
      if (!timestamp) {
        console.log('🚗 No timestamp for date string');
        return new Date().toISOString().split('T')[0];
      }
      
      let date: Date;
      if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp && typeof timestamp._seconds === 'number') {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp && typeof timestamp.seconds === 'number') {
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }
      
      // Validate the date
      if (!date || isNaN(date.getTime())) {
        console.log('🚗 Invalid date for date string');
        return new Date().toISOString().split('T')[0];
      }
      
      const dateString = date.toISOString().split('T')[0];
      return safeString(dateString) || new Date().toISOString().split('T')[0];
    } catch (error) {
      console.error('🚗 Error getting date string:', error);
      return new Date().toISOString().split('T')[0];
    }
  };

  // Function to process raw ride data from backend - COMPLETELY REWRITTEN for safety
  const processRideData = (rawRides: DriverRideResponse[]): ProcessedDriverRide[] => {
    console.log('🚗 Processing rides from backend:', rawRides.length);
    
    // Add safety check
    if (!Array.isArray(rawRides)) {
      console.error('🚗 Invalid rides data - not an array');
      return [];
    }
    
    const processedRides = rawRides.map((ride, index) => {
      console.log(`🚗 Processing ride ${index}:`, ride);
      
      // Add comprehensive null checks
      if (!ride || typeof ride !== 'object') {
        console.error('🚗 Invalid ride object at index', index, ride);
        return null;
      }

      try {
        // CRITICAL: Ensure ALL values are safe
        const safeRideId = safeString(ride.rideId);
        const safeStartLocation = safeString(ride.startLocation) || 'Unknown';
        const safeEndLocation = safeString(ride.endLocation) || 'Unknown';
        const safePricePerSeat = safeNumber(ride.pricePerSeat);
        const safeAvailableSeats = safeNumber(ride.availableSeats);
        const safeDurationSeconds = safeNumber(ride.durationSeconds);
        const safeStatus = safeString(ride.status) || 'unknown';

        console.log(`🚗 Safe values for ride ${safeRideId}:`, {
          safeRideId,
          safeStartLocation,
          safeEndLocation,
          safePricePerSeat,
          safeAvailableSeats,
          safeDurationSeconds,
          safeStatus
        });

        // Calculate booking information more robustly
        let totalSeats = 4; // Default fallback
        let bookedSeats = 0;

        // Try to get total seats from various possible sources
        if (ride.totalSeats && typeof ride.totalSeats === 'number') {
          totalSeats = ride.totalSeats;
        } else if (ride.vehicleSeats && typeof ride.vehicleSeats === 'number') {
          totalSeats = ride.vehicleSeats;
        }

        // Calculate booked seats
        if (ride.bookings && Array.isArray(ride.bookings)) {
          // If we have booking data, calculate from that
          bookedSeats = ride.bookings.reduce((total, booking) => {
            if (!booking || typeof booking !== 'object') return total;
            const seats = safeNumber(booking.seatsBooked);
            return total + seats;
          }, 0);
          // Also update totalSeats if we can infer it
          if (!ride.totalSeats && !ride.vehicleSeats) {
            totalSeats = safeAvailableSeats + bookedSeats;
          }
        } else {
          // If no booking data, estimate from available seats
          if (ride.totalSeats || ride.vehicleSeats) {
            bookedSeats = Math.max(0, totalSeats - safeAvailableSeats);
          } else {
            bookedSeats = 0;
            totalSeats = safeAvailableSeats;
          }
        }

        // Ensure non-negative values
        bookedSeats = Math.max(0, bookedSeats);
        totalSeats = Math.max(safeAvailableSeats, totalSeats);
        
        const hasBookings = bookedSeats > 0;

        // CRITICAL: Format time values with safety
        const safeDepartureTime = formatTime(ride.departureTime);
        const safeArrivalTime = calculateArrivalTime(ride.departureTime, safeDurationSeconds);
        const safeDuration = formatDuration(safeDurationSeconds);
        const safeDateString = getDateString(ride.departureTime);

        console.log(`🚗 Formatted times for ride ${safeRideId}:`, {
          safeDepartureTime,
          safeArrivalTime,
          safeDuration,
          safeDateString
        });

        // Preserve coordinate data from backend
        console.log(`🗺️ Preserving coordinate data for ride ${safeRideId}:`, {
          coordinates: ride.coordinates,
          endGeo: ride.endGeo,
          polyline: ride.polyline ? 'Present' : 'Missing'
        });

        const processedRide: ProcessedDriverRide = {
          id: safeRideId,
          from: safeStartLocation,
          to: safeEndLocation,
          departureTime: safeDepartureTime,
          arrivalTime: safeArrivalTime,
          duration: safeDuration,
          price: safeString(safePricePerSeat), // Always ensure it's a string
          availableSeats: safeAvailableSeats,
          totalSeats,
          bookedSeats,
          hasBookings,
          status: safeStatus,
          date: safeDateString,
          // Preserve location data from backend
          coordinates: ride.coordinates,
          endGeo: ride.endGeo,
          polyline: ride.polyline,
          bookings: ride.bookings
        };

        console.log(`🚗 Final processed ride ${safeRideId}:`, processedRide);
        
        // CRITICAL: Validate the final object
        const isValid = processedRide.id && 
                       processedRide.from && 
                       processedRide.to && 
                       processedRide.departureTime && 
                       processedRide.arrivalTime && 
                       processedRide.duration && 
                       processedRide.price !== undefined &&
                       processedRide.status &&
                       processedRide.date;

        if (!isValid) {
          console.error('🚗 Invalid processed ride:', processedRide);
          return null;
        }

        return processedRide;
      } catch (error) {
        console.error(`🚗 Error processing ride at index ${index}:`, error);
        return null;
      }
    });

    // Filter out null entries and log final result
    const validRides = processedRides.filter(Boolean) as ProcessedDriverRide[];
    console.log('🚗 Valid processed rides:', validRides.length);
    
    return validRides;
  };

  // Fetch rides from backend
  const fetchDriverRides = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = auth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const idToken = await user.getIdToken();
      const response = await axios.get<DriverRideResponse[]>(`${BASE_URL}/rides`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        timeout: 10000, // 10 second timeout
      });

      console.log('🚗 Raw rides from backend:', response.data);
      
      // CRITICAL: Validate response data
      if (!response.data || !Array.isArray(response.data)) {
        console.error('🚗 Invalid response data format');
        setRides([]);
        return;
      }

      const processedRides = processRideData(response.data);
      console.log('🚗 All processed rides:', processedRides);
      setRides(processedRides);
    } catch (err) {
      console.error('Error fetching driver rides:', err);
      
      let errorMessage = 'Failed to fetch rides';
      
      if (err instanceof AxiosError) {
        if (err.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please check your connection.';
        } else if (err.response?.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (err.response?.status === 403) {
          errorMessage = 'Access denied. Only drivers can view rides.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setRides([]); // CRITICAL: Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // FIXED FILTERING LOGIC - Include 'booked' status as upcoming
  const upcomingRides = rides.filter(ride => {
    const isUpcoming = ride.status === 'in-progress' || 
                      ride.status === 'departed' || 
                      ride.status === 'booked';
    console.log(`🚗 Ride ${ride.id} (${ride.status}): isUpcoming = ${isUpcoming}`);
    return isUpcoming;
  });

  const historyRides = rides.filter(ride => {
    const isHistory = ride.status === 'completed' || ride.status === 'cancelled';
    console.log(`🚗 Ride ${ride.id} (${ride.status}): isHistory = ${isHistory}`);
    return isHistory;
  });

  console.log('🚗 Final filtering results:');
  console.log('🚗 - Total rides:', rides.length);
  console.log('🚗 - Upcoming rides:', upcomingRides.length);
  console.log('🚗 - History rides:', historyRides.length);
  console.log('🚗 - All ride statuses:', rides.map(r => `${r.id}: ${r.status}`));

  return {
    rides,
    upcomingRides,
    historyRides,
    loading,
    error,
    refetch: fetchDriverRides,
  };
};

export default useDriverRides;