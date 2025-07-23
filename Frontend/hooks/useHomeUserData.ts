// Enhanced useHomeUserData.ts with comprehensive error handling for new drivers
import { useEffect, useState, useRef } from 'react';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { Platform } from 'react-native';
import { BASE_URL } from '@/config';
import { getDeviceToken } from '@/services/firebaseMessagingService';
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

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
  gender: string;
  ecoPoints: number;
  averageRating: number;
}

const useHomeUserData = () => {
  const [userData, setUserData] = useState<HomeUserData | null>(null);
  const [upcomingData, setUpcomingData] = useState<UpcomingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Helper function to create fallback user data from Firebase Auth
  const createFallbackUserData = (user: any, role: 'driver' | 'passenger' = 'driver'): HomeUserData => {
    const userName = user.displayName || user.email?.split('@')[0] || 'User';
    
    return {
      id: user.uid,
      name: userName,
      role: role,
      ecoPoints: 0,
      averageRating: 0,
      gender: 'prefer_not_to_say',
    };
  };

  // Enhanced function to fetch user profile as fallback
  const fetchUserProfileFallback = async (user: any): Promise<HomeUserData | null> => {
    try {
      console.log('🔄 Attempting fallback: fetching user profile...');
      
      const idToken = await user.getIdToken();
      const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        timeout: 10000,
      });
      
      console.log('✅ Got user profile from fallback:', profileResponse.data);
      
      // Handle different response structures from /users/profile
      let profileData = profileResponse.data;
      
      // If response has 'user' wrapper (based on your backend code)
      if (profileData.user) {
        profileData = profileData.user;
      }
      
      // Transform the profile data to match our interface
      if (profileData && profileData.userId) {
        const compatibleUserData: HomeUserData = {
          id: profileData.userId,
          name: profileData.name,
          role: profileData.role,
          ecoPoints: profileData.ecoPoints || 0,
          averageRating: profileData.averageRating || 0,
          gender: profileData.gender || 'prefer_not_to_say',
        };
        
        console.log('✅ Successfully created user profile from fallback:', compatibleUserData);
        return compatibleUserData;
      }
      
      return null;
      
    } catch (profileErr: any) {
      console.log('⚠️ Profile fallback failed:', profileErr.response?.data || profileErr.message);
      return null;
    }
  };

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

      const response = await axios.get<HomePageResponse>(`${BASE_URL}/users/home`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        timeout: 10000,
      });

      console.log('🔍 Raw homepage response:', response.data);
      
      // Handle successful response
      let userData: UserData | null = null;
      let upcomingInfo: UpcomingData[] = [];

      if (response.data && typeof response.data === 'object') {
        if ('response' in response.data && response.data.response) {
          userData = response.data.response;
          upcomingInfo = Array.isArray(response.data.upcomingInfo) ? response.data.upcomingInfo : [];
        } else if ('userId' in response.data) {
          // Cast to unknown first, then to UserData to avoid TypeScript error
          userData = response.data as unknown as UserData;
          upcomingInfo = [];
        } else {
          console.warn('⚠️ Unexpected response structure:', response.data);
          throw new Error('Unexpected response format from server');
        }
      } else {
        throw new Error('Invalid response data from server');
      }

      // Transform user data for compatibility
      if (userData) {
        const compatibleUserData: HomeUserData = {
          id: userData.userId,
          name: userData.name,
          role: userData.role,
          ecoPoints: userData.ecoPoints || 0,
          averageRating: userData.averageRating || 0,
          gender: userData.gender,
        };
        
        setUserData(compatibleUserData);
        setUpcomingData(upcomingInfo);
        console.log('✅ Successfully loaded homepage data');
        return;
      } else {
        throw new Error('No user data received from server');
      }

    } catch (err: any) {
      console.error('❌ Error fetching homepage data:', err);
      console.error('❌ Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      
      const user = auth().currentUser;
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Enhanced error handling based on status codes and messages
      if (err.response?.status === 404) {
        const errorMessage = err.response?.data?.message || '';
        
        // Case 1: Driver with no rides (most common for new drivers)
        if (errorMessage.includes('Rides not found for this driver') || 
            errorMessage.includes('Rides not found')) {
          
          console.log('🆕 New driver detected - no rides found, using fallback...');
          
          // Try to get complete user profile
          const fallbackUserData = await fetchUserProfileFallback(user);
          
          if (fallbackUserData) {
            setUserData(fallbackUserData);
            setUpcomingData([]); // Empty upcoming rides for new driver
            setError(null); // Clear error since we handled it
            console.log('✅ Successfully handled new driver with no rides');
            return;
          } else {
            // If profile fetch also fails, create minimal fallback
            console.log('🔄 Profile fallback failed, creating minimal user data...');
            const minimalUserData = createFallbackUserData(user, 'driver');
            setUserData(minimalUserData);
            setUpcomingData([]);
            setError('Profile incomplete - some features may be limited');
            console.log('⚠️ Using minimal fallback user data');
            return;
          }
        }
        
        // Case 2: User profile not found (needs onboarding)
        else if (errorMessage.includes('User profile not found') || 
                 err.response?.data?.error === 'Not Found') {
          
          console.log('🔄 User profile not found, redirecting to onboarding...');
          setUserData(null);
          setUpcomingData([]);
          setError(null);
          router.replace('/onboarding/greeting');
          return;
        }
        
        // Case 3: Generic 404 - endpoint or server issue
        else {
          setError(`Service unavailable. Please ensure the app is up to date.`);
        }
      }
      
      // Handle other error types
      else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please check your connection and try again.');
      } else if (err.code === 'ECONNREFUSED' || err.code === 'NETWORK_ERROR') {
        setError('Cannot connect to server. Please check your internet connection.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Please check your account permissions.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      // For any unhandled errors, try to at least create basic user data
      if (!userData) {
        console.log('🔄 Creating emergency fallback user data...');
        try {
          const emergencyUserData = createFallbackUserData(user, 'driver');
          setUserData(emergencyUserData);
          setUpcomingData([]);
          console.log('⚠️ Using emergency fallback - app will have limited functionality');
        } catch (fallbackError) {
          console.error('❌ Emergency fallback also failed:', fallbackError);
          setUserData(null);
          setUpcomingData([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return { 
    userData, 
    upcomingData, 
    loading, 
    error,
    refetch: fetchHomePageData,
  };
};

export default useHomeUserData;