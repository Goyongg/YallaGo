import { useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { Platform } from 'react-native';

// This should be checked to match the current IP address
// Uni: 10.45.49.69
// Home: 10.128.24.33
const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

interface Vehicle {
  vehicleId: string;
  make: string;
  model: string;
  plateNumber: string;
  color?: string;
  seats: number;
}

interface CreateVehicleData {
  make: string;
  model: string;
  plateNumber: string;
  color?: string;
  seats: number;
}

interface UpdateVehicleData {
  color?: string;
}

interface VehicleResponse {
  message: string;
  vehicleId?: string;
}

interface MaxSeatsResponse {
  maxSeats: number;
}

const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [maxSeats, setMaxSeats] = useState<number | null>(null);

  const getAuthHeaders = async () => {
    const user = auth().currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const idToken = await user.getIdToken();
    return {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = await getAuthHeaders();
      
      // Try to get the full vehicle data using GET /vehicles endpoint
      try {
        const response = await axios.get(`${BASE_URL}/vehicles`, { headers });
        
        // If successful, user has a vehicle
        if (response.data) {
          const vehicleData: Vehicle = {
            vehicleId: response.data.vehicleId,
            make: response.data.make,
            model: response.data.model,
            plateNumber: response.data.plateNumber,
            color: response.data.color,
            seats: response.data.seats,
          };
          
          setHasVehicle(true);
          setVehicles([vehicleData]);
          setMaxSeats(vehicleData.seats);
        } else {
          setHasVehicle(false);
          setVehicles([]);
          setMaxSeats(null);
        }
      } catch (vehicleError: any) {
        // If 404 or similar, user probably doesn't have a vehicle
        if (vehicleError.response?.status === 404 || 
            vehicleError.response?.status === 400) {
          setHasVehicle(false);
          setVehicles([]);
          setMaxSeats(null);
        } else {
          throw vehicleError;
        }
      }
      
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      setError(error.response?.data?.message || 'Failed to fetch vehicles');
      setVehicles([]);
      setHasVehicle(false);
      setMaxSeats(null);
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = async (vehicleData: CreateVehicleData): Promise<VehicleResponse> => {
    try {
      setError(null);
      
      // Check if user already has a vehicle (current backend limitation)
      if (hasVehicle) {
        throw new Error('You can only have one vehicle at a time with the current system');
      }
      
      const headers = await getAuthHeaders();
      
      // Updated endpoint to match backend
      const response = await axios.post(
        `${BASE_URL}/vehicles`, 
        vehicleData, 
        { headers }
      );
      
      // Refresh vehicles list after adding
      await fetchVehicles();
      
      return response.data;
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add vehicle';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateVehicle = async (updateData: UpdateVehicleData): Promise<VehicleResponse> => {
    try {
      setError(null);
      
      if (!hasVehicle) {
        throw new Error('No vehicle to update');
      }
      
      const headers = await getAuthHeaders();
      
      // Updated to use PATCH method as per backend
      const response = await axios.patch(
        `${BASE_URL}/vehicles`, 
        updateData, 
        { headers }
      );
      
      // Refresh vehicles list after updating to get the latest data
      await fetchVehicles();
      
      return response.data;
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update vehicle';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteVehicle = async (): Promise<VehicleResponse> => {
    try {
      setError(null);
      
      if (!hasVehicle) {
        throw new Error('No vehicle to delete');
      }
      
      const headers = await getAuthHeaders();
      
      const response = await axios.delete(`${BASE_URL}/vehicles`, { headers });
      
      // Clear vehicles list after deleting
      setVehicles([]);
      setHasVehicle(false);
      setMaxSeats(null);
      
      return response.data;
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete vehicle';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getMaxSeats = async (): Promise<MaxSeatsResponse> => {
    try {
      setError(null);
      const headers = await getAuthHeaders();
      
      const response = await axios.get(`${BASE_URL}/vehicles/maxseats`, { headers });
      return response.data;
    } catch (error: any) {
      console.error('Error getting max seats:', error);
      const errorMessage = error.response?.data?.message || 'Failed to get max seats';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refetch = () => {
    fetchVehicles();
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  return {
    vehicles,
    loading,
    error,
    hasVehicle,
    maxSeats,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getMaxSeats,
    refetch,
  };
};

export default useVehicles;