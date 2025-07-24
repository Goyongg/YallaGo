// hooks/useBookingHistory.ts - Fixed to match actual backend response structure
import { useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import { BASE_URL } from '@/config';

// Updated backend response interface to match ACTUAL data structure with Firebase IDs
export interface BookingHistoryResponse {
  // ✅ Real Firebase document IDs (now provided by backend!)
  bookingId: string;  // Real Firebase booking document ID like "7g1JWeBKCDsQhQPYwvme"
  rideId: string;     // Real Firebase ride document ID like "jKynghthNnYVeUL5a9fJ"
  
  // Core booking fields (always present)
  startLocation: string;
  endLocation: string;
  departureTime: {
    _seconds: number;
    _nanoseconds: number;
  };
  durationSeconds: number;
  pricePerSeat: number;
  seatsBooked: number;
  status: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled' | 'no-show';
  
  // Booking-specific pricing (in upcoming bookings)
  bookingPrice?: number;
  
  // Driver info (only in upcoming bookings - pending/confirmed)
  name?: string;
  phoneNumber?: string;
  averageRating?: number;
  
  // Vehicle info (only in upcoming bookings - pending/confirmed)
  make?: string;
  model?: string;
  color?: string;
  plateNumber?: string;
  
  // Location coordinates (only in upcoming bookings)
  coordinates?: {
    _latitude: number;
    _longitude: number;
  };
  endGeo?: {
    _latitude: number;
    _longitude: number;
  };
  
  // Additional fields (only in upcoming bookings)
  distanceMeters?: number;
  comments?: string;
  waypoints?: any[];
  polyline?: string;
}

// Processed booking data for frontend components
export interface ProcessedBooking {
  id: string;
  rideId: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  totalCost: string;
  seatsBooked: number;
  status: string;
  date: string; // For grouping (YYYY-MM-DD format)
  driver: {
    name: string;
    rating: number;
    phoneNumber: string;
  };
  vehicle?: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  };
}

export interface UseBookingHistoryReturn {
  bookings: ProcessedBooking[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useBookingHistory = (): UseBookingHistoryReturn => {
  const [bookings, setBookings] = useState<ProcessedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Safety functions
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    return String(value);
  };

  const safeNumber = (value: any): number => {
    if (value === null || value === undefined || isNaN(Number(value))) return 0;
    return Number(value);
  };

  // Function to format time from Firestore timestamp
  const formatTime = (timestamp: any): string => {
    try {
      if (!timestamp) {
        return '00:00';
      }
      
      let date: Date;
      if (timestamp && typeof timestamp._seconds === 'number') {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp && typeof timestamp.seconds === 'number') {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp);
      }
      
      if (!date || isNaN(date.getTime())) {
        return '00:00';
      }
      
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('📅 Error formatting time:', error);
      return '00:00';
    }
  };

  // Function to format duration from seconds
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
      console.error('📅 Error formatting duration:', error);
      return '0m';
    }
  };

  // Function to calculate arrival time
  const calculateArrivalTime = (departureTimestamp: any, durationSeconds: number): string => {
    try {
      if (!departureTimestamp) {
        return '00:00';
      }
      
      const safeDurationSeconds = safeNumber(durationSeconds);
      
      let departureDate: Date;
      if (departureTimestamp && typeof departureTimestamp._seconds === 'number') {
        departureDate = new Date(departureTimestamp._seconds * 1000);
      } else if (departureTimestamp && typeof departureTimestamp.seconds === 'number') {
        departureDate = new Date(departureTimestamp.seconds * 1000);
      } else if (departureTimestamp && typeof departureTimestamp.toDate === 'function') {
        departureDate = departureTimestamp.toDate();
      } else {
        departureDate = new Date(departureTimestamp);
      }
      
      if (!departureDate || isNaN(departureDate.getTime())) {
        return '00:00';
      }
      
      const arrivalDate = new Date(departureDate.getTime() + (safeDurationSeconds * 1000));
      
      if (isNaN(arrivalDate.getTime())) {
        return '00:00';
      }
      
      return arrivalDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('📅 Error calculating arrival time:', error);
      return '00:00';
    }
  };

  // Function to get date string for grouping
  const getDateString = (timestamp: any): string => {
    try {
      if (!timestamp) {
        return new Date().toISOString().split('T')[0];
      }
      
      let date: Date;
      if (timestamp && typeof timestamp._seconds === 'number') {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp && typeof timestamp.seconds === 'number') {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp);
      }
      
      if (!date || isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('📅 Error getting date string:', error);
      return new Date().toISOString().split('T')[0];
    }
  };

  // Function to process raw booking data from backend - Fixed for actual backend structure
  const processBookingData = (rawBookings: BookingHistoryResponse[]): ProcessedBooking[] => {
    console.log('📅 Processing bookings from backend:', rawBookings.length);
    
    if (!Array.isArray(rawBookings)) {
      console.error('📅 Invalid bookings data - not an array');
      return [];
    }
    
    const processedBookings = rawBookings.map((booking, index) => {
      console.log(`📅 Processing booking ${index}:`, booking);
      
      if (!booking || typeof booking !== 'object') {
        console.error('📅 Invalid booking object at index', index, booking);
        return null;
      }

      try {
        // ✅ Backend now provides real Firebase IDs!
        const realBookingId = safeString(booking.bookingId);
        const realRideId = safeString(booking.rideId);
        
        // Use the real Firebase IDs from backend
        const displayId = realBookingId;
        const navigationRideId = realRideId;
        
        console.log(`📅 Using real Firebase IDs for booking ${index}:`, {
          bookingId: realBookingId,
          rideId: realRideId,
          navigationEnabled: !!(realBookingId && realRideId)
        });
        
        // Extract location data - using actual field names from backend
        const safeFromLocation = safeString(booking.startLocation) || 'Unknown pickup';
        const safeToLocation = safeString(booking.endLocation) || 'Unknown destination';
        
        // Extract numerical data with proper defaults
        const safeSeatsBooked = safeNumber(booking.seatsBooked) || 1;
        const safePricePerSeat = safeNumber(booking.pricePerSeat) || 0;
        const safeDurationSeconds = safeNumber(booking.durationSeconds) || 0;
        
        // Calculate pricing - use bookingPrice if available, otherwise calculate from pricePerSeat
        const actualPrice = booking.bookingPrice !== undefined ? 
          safeNumber(booking.bookingPrice) : 
          (safePricePerSeat * safeSeatsBooked);
        const safeTotalCost = actualPrice.toString();
        
        // Handle status
        const safeStatus = safeString(booking.status) || 'completed';
        
        // Extract time information
        const departureTimestamp = booking.departureTime;
        const safeDepartureTime = formatTime(departureTimestamp);
        const safeArrivalTime = calculateArrivalTime(departureTimestamp, safeDurationSeconds);
        const safeDuration = formatDuration(safeDurationSeconds);
        const safeDateString = getDateString(departureTimestamp);

        // Extract driver information - only available in upcoming bookings
        const driverName = safeString(booking.name) || 'Driver';
        const driverRating = safeNumber(booking.averageRating) || 5.0;
        const driverPhone = safeString(booking.phoneNumber) || 'N/A';

        // Extract vehicle information - only available in upcoming bookings
        let vehicleInfo: ProcessedBooking['vehicle'] = undefined;
        if (booking.make && booking.model) {
          vehicleInfo = {
            make: safeString(booking.make),
            model: safeString(booking.model),
            color: safeString(booking.color) || 'Unknown',
            plateNumber: safeString(booking.plateNumber) || 'N/A',
          };
        }

        const processedBooking: ProcessedBooking = {
          id: displayId,
          rideId: navigationRideId, // Now using real Firebase ride ID!
          from: safeFromLocation,
          to: safeToLocation,
          departureTime: safeDepartureTime,
          arrivalTime: safeArrivalTime,
          duration: safeDuration,
          totalCost: safeTotalCost,
          seatsBooked: safeSeatsBooked,
          status: safeStatus,
          date: safeDateString,
          driver: {
            name: driverName,
            rating: driverRating,
            phoneNumber: driverPhone,
          },
          vehicle: vehicleInfo,
        };

        console.log(`📅 ✅ Processed booking ${displayId}:`, {
          from: processedBooking.from,
          to: processedBooking.to,
          cost: processedBooking.totalCost,
          status: processedBooking.status,
          rideId: navigationRideId,
          navigationEnabled: true
        });
        
        // Validation - ensure we have the essential fields
        const isValid = processedBooking.id && 
                       processedBooking.from && 
                       processedBooking.to && 
                       processedBooking.status &&
                       processedBooking.date;

        if (!isValid) {
          console.error('📅 Invalid processed booking (missing required fields):', processedBooking);
          return null;
        }

        return processedBooking;
      } catch (error) {
        console.error(`📅 Error processing booking at index ${index}:`, error);
        return null;
      }
    });

    // Filter out null entries
    const validBookings = processedBookings.filter(Boolean) as ProcessedBooking[];
    console.log('📅 Valid processed bookings:', validBookings.length);
    
    return validBookings;
  };

  // Fetch booking history from backend
  const fetchBookingHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = auth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const idToken = await user.getIdToken();
      const response = await axios.get<BookingHistoryResponse[]>(`${BASE_URL}/bookings`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        timeout: 10000,
      });

      console.log('📅 Raw bookings from backend:', response.data);
      
      // Validate response data
      if (!response.data || !Array.isArray(response.data)) {
        console.error('📅 Invalid response data format');
        setBookings([]);
        return;
      }

      const processedBookings = processBookingData(response.data);
      console.log('📅 All processed bookings:', processedBookings);
      setBookings(processedBookings);
    } catch (err) {
      console.error('Error fetching booking history:', err);
      
      let errorMessage = 'Failed to fetch booking history';
      
      if (err instanceof AxiosError) {
        if (err.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please check your connection.';
        } else if (err.response?.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (err.response?.status === 404) {
          errorMessage = 'No booking history found.';
          setBookings([]); // Set empty array for 404, not an error state
          setError(null);
          return;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookingHistory,
  };
};

export default useBookingHistory;