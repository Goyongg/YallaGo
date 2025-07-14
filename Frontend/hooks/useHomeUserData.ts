// hooks/useHomeUserData.ts - Fixed to match backend changes
import { useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { Platform } from 'react-native';

// This should be checked to match the current IP address
// Uni: 10.45.49.69
// Home: 10.128.24.33
const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

// Updated interface to match new backend response structure
interface UserData {
  userId: string;
  name: string;
  gender: string;
  role: 'driver' | 'passenger';
  averageRating: number;
  ecoPoints: number;
}

interface UpcomingDriverRide {
  rideId: string;
  startLocation: string;
  endLocation: string;
  coordinates?: any;
  endGeo?: any;
  departureTime?: any; // Firestore Timestamp
  status?: string;
  bookings?: Array<{
    passengerName: string;
    seatsBooked: number;
    phoneNumber: string;
  }>;
}

interface UpcomingPassengerBooking {
  bookingId: string;
  seatsBooked: number;
  status: string;
  pickupPoint: string;
  bookingStart: any; // GeoPoint
  dropOffPoint: string;
  bookingEnd: any; // GeoPoint
  ride: {
    coordinates?: any;
    departureTime?: any; // Firestore Timestamp
    endGeo?: any;
  };
  driver: {
    driverId: string;
    name: string;
    phoneNumber: string;
    averageRating: number;
  };
  vehicle: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  };
}

type UpcomingData = UpcomingDriverRide | UpcomingPassengerBooking;

interface HomePageResponse {
  response: UserData;
  upcomingInfo: UpcomingData[];
}

// For backward compatibility with existing components that use HomeUserData
export interface HomeUserData {
  id: string;
  name: string;
  role: string;
  ecoPoints: number;
  averageRating: number;
}

const useHomeUserData = () => {
  const [userData, setUserData] = useState<HomeUserData | null>(null);
  const [upcomingData, setUpcomingData] = useState<UpcomingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHomePageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = auth().currentUser;
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const idToken = await user.getIdToken();
      
      console.log('🔍 Fetching homepage data from:', `${BASE_URL}/users/home`);

      // Updated endpoint from /users/home to /users/homepage
      const response = await axios.get<HomePageResponse>(`${BASE_URL}/users/home`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        timeout: 10000, // 10 second timeout
      });

      console.log('🔍 Raw homepage response:', response.data);

      // Extract and transform user data to maintain backward compatibility
      if (response.data.response) {
        const backendUserData = response.data.response;
        
        // Transform to HomeUserData format for backward compatibility
        const compatibleUserData: HomeUserData = {
          id: backendUserData.userId,
          name: backendUserData.name,
          role: backendUserData.role,
          ecoPoints: backendUserData.ecoPoints || 0,
          averageRating: backendUserData.averageRating || 0,
        };
        
        setUserData(compatibleUserData);
        console.log('✅ User data set:', compatibleUserData);
      } else {
        console.error('❌ No user data in response:', response.data);
        setError('Invalid user data received from server');
      }

      // Extract upcoming info
      if (response.data.upcomingInfo && Array.isArray(response.data.upcomingInfo)) {
        setUpcomingData(response.data.upcomingInfo);
        console.log('✅ Upcoming data set:', response.data.upcomingInfo.length, 'items');
      } else {
        console.log('ℹ️ No upcoming data or not an array:', response.data.upcomingInfo);
        setUpcomingData([]);
      }

    } catch (err: any) {
      console.error('❌ Error fetching homepage data:', err);
      
      let errorMessage = 'Failed to fetch user data';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Homepage endpoint not found. Please update the app.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setUserData(null);
      setUpcomingData([]);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchHomePageData();
  };

  useEffect(() => {
    fetchHomePageData();
  }, []);

  return { 
    userData, 
    upcomingData, 
    loading, 
    error,
    refetch
  };
};

export default useHomeUserData;