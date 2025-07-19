// hooks/useHomeUserData.ts - Fixed to handle errors and empty responses properly
import { useEffect, useState, useRef } from 'react';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { Platform } from 'react-native';
import { BASE_URL } from '@/config';
import { getDeviceToken } from '@/services/firebaseMessagingService';
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

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
      
      // const fcmToken = await getDeviceToken();
      const user = auth().currentUser;
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const idToken = await user.getIdToken();
      
      // console.log('🔍 Fetching homepage data from:', `${BASE_URL}/users/home`);
      // console.log('🔍 BASE_URL:', BASE_URL);
      // console.log('🔍 Platform:', Platform.OS);

      const response = await axios.get<HomePageResponse>(`${BASE_URL}/users/home`,
        {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        timeout: 10000, // 10 second timeout
      });

      // console.log('🔍 Raw homepage response:', response.data);
      // console.log('🔍 Response type:', typeof response.data);
      // console.log('🔍 Response keys:', Object.keys(response.data || {}));

      // Handle case where backend might return unexpected structure
      let userData: UserData | null = null;
      let upcomingInfo: UpcomingData[] = [];

      // Check if response has the expected structure
      if (response.data && typeof response.data === 'object') {
        // Case 1: Expected structure with response and upcomingInfo
        if ('response' in response.data && response.data.response) {
          userData = response.data.response;
          upcomingInfo = Array.isArray(response.data.upcomingInfo) ? response.data.upcomingInfo : [];
        }
        // Case 2: Direct user data (fallback) - check if response.data has user properties
        else if ('userId' in response.data || 'name' in response.data) {
          // Type assertion with proper check
          const responseAsAny = response.data as any;
          if (responseAsAny.userId && responseAsAny.name && responseAsAny.role) {
            userData = responseAsAny as UserData;
            upcomingInfo = [];
          } else {
            console.warn('⚠️ Incomplete user data in direct response:', response.data);
            setError('Incomplete user data from server');
            return;
          }
        }
        // Case 3: Empty response or unexpected structure
        else {
          console.warn('⚠️ Unexpected response structure:', response.data);
          setError('Unexpected response format from server');
          return;
        }
      } else {
        console.error('❌ Invalid response data:', response.data);
        setError('Invalid response data from server');
        return;
      }

      // Transform user data to maintain backward compatibility
      if (userData) {
        const compatibleUserData: HomeUserData = {
          id: userData.userId,
          name: userData.name,
          role: userData.role,
          ecoPoints: userData.ecoPoints || 0,
          averageRating: userData.averageRating || 0,
        };
        
        setUserData(compatibleUserData);
        // console.log('✅ User data set:', compatibleUserData);
      } else {
        console.error('❌ No valid user data found in response');
        setError('No user data received from server');
        return;
      }
      // Set upcoming info (empty array is valid)
      setUpcomingData(upcomingInfo);
      console.log('✅ Upcoming data set:', upcomingInfo.length, 'items');
      console.log('[fetchHomePageData] started');


    } catch (err: any) {
      console.error('❌ Error fetching homepage data:', err);
      console.error('❌ Error details:', {
        message: err.message,
        code: err.code,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url,
        baseURL: err.config?.baseURL,
      });
      
      let errorMessage = 'Failed to fetch user data';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection.';
      } else if (err.code === 'ECONNREFUSED' || err.code === 'NETWORK_ERROR') {
        errorMessage = `Cannot connect to server at ${BASE_URL}. Please ensure the backend server is running.`;
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.status === 404) {
        errorMessage = `Homepage endpoint not found at ${BASE_URL}/users/home. Please check if the backend server is running and the endpoint exists.`;
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

  // const refetch = () => {
  //   fetchHomePageData();
  // };


  // useEffect(() => {
  //   refetch(); // ✅ now YOU control the fetch
  // }, []);

  return { 
    userData, 
    upcomingData, 
    loading, 
    error,
    refetch: fetchHomePageData,
  };
};

export default useHomeUserData;