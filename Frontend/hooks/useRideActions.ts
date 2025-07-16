import { useState } from 'react';
import auth from '@react-native-firebase/auth';
import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';

const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

interface RideActionResponse {
  message: string;
}

interface UseRideActionsReturn {
  startRide: (rideId: string) => Promise<{ success: boolean; message: string }>;
  endRide: (rideId: string) => Promise<{ success: boolean; message: string }>;
  deleteRide: (rideId: string) => Promise<{ success: boolean; message: string }>;
  loading: boolean;
}

const useRideActions = (): UseRideActionsReturn => {
  const [loading, setLoading] = useState(false);

  const performRideAction = async (
    rideId: string, 
    action: 'start-ride' | 'end-ride',
    method: 'PATCH' = 'PATCH'
  ): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      
      const user = auth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const idToken = await user.getIdToken();
      const response = await axios.patch<RideActionResponse>(
        `${BASE_URL}/rides/${action}?rideId=${rideId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          timeout: 10000,
        }
      );

      return {
        success: true,
        message: response.data.message
      };
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      
      let errorMessage = `Failed to ${action.replace('-', ' ')}`;
      
      if (err instanceof AxiosError) {
        if (err.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please check your connection.';
        } else if (err.response?.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (err.response?.status === 403) {
          errorMessage = 'Access denied. You can only control your own rides.';
        } else if (err.response?.status === 404) {
          errorMessage = 'Ride not found.';
        // } else if (err.response?.status >= 500) {
        //   errorMessage = 'Server error. Please try again later.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const deleteRide = async (rideId: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      
      const user = auth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const idToken = await user.getIdToken();
      
      // Since you mentioned not to change the backend, we'll use a generic endpoint
      // You may need to add a DELETE /rides/:rideId endpoint in your backend
      const response = await axios.delete<RideActionResponse>(
        `${BASE_URL}/rides?rideId=${rideId}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          timeout: 10000,
        }
      );

      return {
        success: true,
        message: response.data.message || 'Ride deleted successfully'
      };
    } catch (err) {
      console.error('Error deleting ride:', err);
      
      let errorMessage = 'Failed to delete ride';
      
      if (err instanceof AxiosError) {
        if (err.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please check your connection.';
        } else if (err.response?.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (err.response?.status === 403) {
          errorMessage = 'Access denied. You can only delete your own rides.';
        } else if (err.response?.status === 404) {
          errorMessage = 'Ride not found.';
        } else if (err.response?.status === 400) {
          errorMessage = 'Cannot delete ride with existing bookings.';
        // } else if (err.response?.status >= 500) {
        //   errorMessage = 'Server error. Please try again later.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const startRide = async (rideId: string) => {
    return performRideAction(rideId, 'start-ride');
  };

  const endRide = async (rideId: string) => {
    return performRideAction(rideId, 'end-ride');
  };

  return {
    startRide,
    endRide,
    deleteRide,
    loading
  };
};

export default useRideActions;