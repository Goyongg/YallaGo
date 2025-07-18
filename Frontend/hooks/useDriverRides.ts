import { useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import { DriverRideResponse, ProcessedDriverRide, UseDriverRidesReturn } from '../interfaces/interfaces';

// This should be checked to match the current IP address
// Uni: 10.45.49.69
// Home: 10.128.24.33
// const BASE_URL =
//   Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const BASE_URL = 'https://api-ro33x5lzbq-uc.a.run.app';

const useDriverRides = (): UseDriverRidesReturn => {
  const [rides, setRides] = useState<ProcessedDriverRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to format time from seconds
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Function to format Firestore timestamp to time string
  const formatTime = (timestamp: any): string => {
    if (!timestamp) return '';
    
    // Handle Firestore timestamp
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp._seconds) {
      date = new Date(timestamp._seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Function to calculate arrival time
  const calculateArrivalTime = (departureTimestamp: any, durationSeconds: number): string => {
    if (!departureTimestamp) return '';
    
    let departureDate: Date;
    if (departureTimestamp.toDate) {
      departureDate = departureTimestamp.toDate();
    } else if (departureTimestamp._seconds) {
      departureDate = new Date(departureTimestamp._seconds * 1000);
    } else {
      departureDate = new Date(departureTimestamp);
    }
    
    const arrivalDate = new Date(departureDate.getTime() + (durationSeconds * 1000));
    return arrivalDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Function to get date string for grouping
  const getDateString = (timestamp: any): string => {
    if (!timestamp) return '';
    
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp._seconds) {
      date = new Date(timestamp._seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Function to process raw ride data from backend
  const processRideData = (rawRides: DriverRideResponse[]): ProcessedDriverRide[] => {
    return rawRides.map(ride => {
      // Calculate booking information more robustly
      let totalSeats = 4; // Default fallback
      let bookedSeats = 0;

      // Try to get total seats from various possible sources
      if (ride.totalSeats) {
        totalSeats = ride.totalSeats;
      } else if (ride.vehicleSeats) {
        totalSeats = ride.vehicleSeats;
      }

      // Calculate booked seats
      if (ride.bookings && Array.isArray(ride.bookings)) {
        // If we have booking data, calculate from that
        bookedSeats = ride.bookings.reduce((total, booking) => total + (booking.seatsBooked || 0), 0);
        // Also update totalSeats if we can infer it
        if (!ride.totalSeats && !ride.vehicleSeats) {
          totalSeats = ride.availableSeats + bookedSeats;
        }
      } else {
        // If no booking data, estimate from available seats
        // This is a fallback calculation
        if (ride.totalSeats || ride.vehicleSeats) {
          bookedSeats = totalSeats - ride.availableSeats;
        } else {
          // Can't determine booked seats without more info
          bookedSeats = 0;
          totalSeats = ride.availableSeats; // At least we know available seats
        }
      }

      // Ensure non-negative values
      bookedSeats = Math.max(0, bookedSeats);
      totalSeats = Math.max(ride.availableSeats, totalSeats);
      
      const hasBookings = bookedSeats > 0;

      return {
        id: ride.rideId,
        from: ride.startLocation,
        to: ride.endLocation,
        departureTime: formatTime(ride.departureTime),
        arrivalTime: calculateArrivalTime(ride.departureTime, ride.durationSeconds),
        duration: formatDuration(ride.durationSeconds),
        price: ride.pricePerSeat.toString(),
        availableSeats: ride.availableSeats,
        totalSeats,
        bookedSeats,
        hasBookings,
        status: ride.status,
        date: getDateString(ride.departureTime)
      };
    });
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

      const processedRides = processRideData(response.data);
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
        // } else if (err.response?.status >= 500) {
        //   errorMessage = 'Server error. Please try again later.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Refetch function for manual refresh
  const refetch = () => {
    fetchDriverRides();
  };

  useEffect(() => {
    fetchDriverRides();
  }, []);

  // Separate rides into upcoming and history based on status and date
  const upcomingRides = rides.filter(ride => 
    ride.status === 'in-progress' || ride.status === 'departed'
  );

  const historyRides = rides.filter(ride => 
    ride.status === 'completed' || ride.status === 'cancelled'
  );

  return {
    rides,
    upcomingRides,
    historyRides,
    loading,
    error,
    refetch
  };
};

export default useDriverRides;