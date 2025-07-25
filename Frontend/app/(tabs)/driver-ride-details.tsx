// app/(tabs)/driver-ride-details.tsx - FIXED version
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  SafeAreaView, 
  ScrollView, 
  Alert,
  Linking,
  ActivityIndicator 
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import useDriverRides from '../../hooks/useDriverRides';
import useRideActions from '../../hooks/useRideActions';
import { BASE_URL } from '@/config';
import { ProcessedDriverRide } from '@/interfaces/interfaces';

interface PassengerInfo {
  name: string;
  phone: string;
  seatsBooked: number;
}

// Extended interface that might have additional fields from backend
interface ExtendedRideData extends ProcessedDriverRide {
  // Additional fields that might be available from the backend
  coordinates?: {
    latitude?: number;
    longitude?: number;
    _latitude?: number; // Firestore format
    _longitude?: number; // Firestore format
  };
  endGeo?: {
    latitude?: number;
    longitude?: number;
    _latitude?: number; // Firestore format
    _longitude?: number; // Firestore format
  };
  
  polyline?: string;
  bookings?: Array<{
    passengerName: string;
    phoneNumber: string;
    seatsBooked: number;
  }>;
}

// ADDED: Safety utility functions
const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const safeNumber = (value: any): number => {
  if (value === null || value === undefined || isNaN(Number(value))) return 0;
  return Number(value);
};

const DriverRideDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  
  const { rideId } = params;
  const { rides, loading: ridesLoading, refetch } = useDriverRides();
  const { startRide, endRide, loading: actionLoading } = useRideActions();
  
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [stopovers, setStopovers] = useState<
    { id: string; location: string; coordinates: { latitude: number; longitude: number } }[]
  >([]);
  const [polylineCoords, setPolylineCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  
  const [passengers, setPassengers] = useState<PassengerInfo[]>([]);
  const [rideData, setRideData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default coordinates for Dubai area
  const defaultCoordinates = [
    { latitude: 25.2048, longitude: 55.2708 }, // Start
    { latitude: 25.1972, longitude: 55.2744 }  // End
  ];
  
  // Fetch driver rides
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (!hasFetchedRef.current) {
      refetch();
      hasFetchedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!ridesLoading && rides.length > 0 && rideId) {
      loadRideDetails();
    }
  }, [ridesLoading, rides, rideId]);

  const loadRideDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚗 Loading driver ride details for ID:', rideId);
      console.log('🚗 Available rides:', rides.length);

      // Find the ride in the driver rides data
      const ride = rides.find((r: ProcessedDriverRide) => r.id === rideId);
      
      if (!ride) {
        throw new Error('Ride not found in driver dashboard data');
      }

      console.log('🚗 Found ride:', ride);
      
      // Cast to extended type for additional fields that might be available
      const extendedRide = ride as ExtendedRideData;
      setRideData(extendedRide);

      // Process the ride information
      processRideInfo(extendedRide);

    } catch (err: any) {
      console.error('🚗 Error loading driver ride details:', err);
      setError(err.message || 'Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  const processRideInfo = (rideInfo: ExtendedRideData) => {
    console.log('🗺️ Processing ride info for coordinates:', rideInfo);
    
    // Process ride start and end coordinates if available
    if (rideInfo.coordinates && rideInfo.endGeo) {
      // Extract coordinates with proper type checking
      const startLat = rideInfo.coordinates._latitude || rideInfo.coordinates.latitude;
      const startLng = rideInfo.coordinates._longitude || rideInfo.coordinates.longitude;
      const endLat = rideInfo.endGeo._latitude || rideInfo.endGeo.latitude;
      const endLng = rideInfo.endGeo._longitude || rideInfo.endGeo.longitude;
      
      // Only proceed if we have all required coordinates as numbers
      if (typeof startLat === 'number' && typeof startLng === 'number' && 
          typeof endLat === 'number' && typeof endLng === 'number') {
        
        const startCoords = { latitude: startLat, longitude: startLng };
        const endCoords = { latitude: endLat, longitude: endLng };
        
        console.log('📍 Route coordinates set from ride data:', [startCoords, endCoords]);
        setRouteCoordinates([startCoords, endCoords]);
        
        // If no polyline, use these coordinates for the line
        if (!rideInfo.polyline) {
          setPolylineCoords([startCoords, endCoords]);
        }
      } else {
        console.warn('🗺️ Invalid coordinates found, using defaults');
        setRouteCoordinates(defaultCoordinates);
        setPolylineCoords(defaultCoordinates);
      }
    } else {
      console.warn('🗺️ No coordinates found in ride data, using defaults');
      setRouteCoordinates(defaultCoordinates);
      setPolylineCoords(defaultCoordinates);
    }
    
    // Parse polyline if available
    if (rideInfo.polyline) {  
      try {
        const parsed = JSON.parse(rideInfo.polyline);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPolylineCoords(parsed);
          console.log('📍 Polyline coordinates set:', parsed.length, 'points');
        }
      } catch (err) {
        console.warn('Failed to parse polyline from string:', err);
      }
    }
    
    console.log('Ride waypoints:', rideInfo.waypoints);
    // 🛑 Parse stopovers (waypoints)
    if (Array.isArray(rideInfo.waypoints)) {
      const formattedStopovers = rideInfo.waypoints.map((wp: any, index: number) => ({
        id: `stopover-${index}`,
        location: wp.label || `Stopover ${index + 1}`,
        coordinates: {
          latitude: wp.coordinates?.lat ?? wp.coordinates?._latitude ?? 0,
          longitude: wp.coordinates?.lng ?? wp.coordinates?._longitude ?? 0,
        },
      }));
      setStopovers(formattedStopovers);
      console.log('🛑 Stopovers parsed:', formattedStopovers);
    }

    // Update passengers if available
    if (rideInfo.bookings && Array.isArray(rideInfo.bookings)) {
      const passengerList: PassengerInfo[] = rideInfo.bookings.map((booking: any) => ({
        name: safeString(booking.passengerName) || 'Unknown Passenger',
        phone: safeString(booking.phoneNumber) || '',
        seatsBooked: safeNumber(booking.seatsBooked),
      }));
      setPassengers(passengerList);
      console.log('🚗 Updated passengers:', passengerList.length);
    } else {
      // Clear passengers if no bookings
      setPassengers([]);
      console.log('🚗 No passengers found');
    }
  };

  const handleCallPress = (phoneNumber: string, name: string) => {
    // FIXED: Add safety checks
    const safeName = safeString(name) || 'Passenger';
    const safePhone = safeString(phoneNumber);
    
    if (!safePhone) {
      Alert.alert('Error', 'No phone number available');
      return;
    }

    Alert.alert(
      `Call ${safeName}`,
      `Do you want to call ${safePhone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            const url = `tel:${safePhone}`;
            Linking.openURL(url).catch(err => 
              Alert.alert('Error', 'Unable to make phone call')
            );
          }
        },
      ]
    );
  };

  const handleStartRide = async () => {
    if (!rideData) return;

    Alert.alert(
      'Start Ride',
      'Are you sure you want to start this ride? This will notify all passengers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Ride',
          onPress: async () => {
            const result = await startRide(rideData.id);
            
            if (result.success) {
              Alert.alert('Success', result.message);
              // Refresh the ride data
              refetch();
              // Reload details
              await loadRideDetails();
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const handleEndRide = async () => {
    if (!rideData) return;

    Alert.alert(
      'End Ride',
      'Are you sure you want to end this ride? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Ride',
          style: 'destructive',
          onPress: async () => {
            const result = await endRide(rideData.id);
            
            if (result.success) {
              Alert.alert('Success', result.message, [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate back to driver dashboard
                    router.back();
                  }
                }
              ]);
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  // Format time from string - FIXED with safety checks
  const formatTime = (timeString: string) => {
    try {
      const safeTimeString = safeString(timeString);
      if (!safeTimeString) return '00:00';
      
      // If it's already in HH:MM format, return as is
      if (/^\d{2}:\d{2}$/.test(safeTimeString)) {
        return safeTimeString;
      }
      
      const date = new Date(safeTimeString);
      if (isNaN(date.getTime())) return '00:00';
      
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '00:00';
    }
  };

  // Format date from ride data - FIXED with safety checks
  const formatDate = (ride: any) => {
    try {
      if (!ride || !ride.date) {
        return 'Date not available';
      }
      
      const safeDate = safeString(ride.date);
      if (!safeDate) return 'Date not available';
      
      const date = new Date(safeDate);
      if (isNaN(date.getTime())) return 'Date not available';
      
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return 'Date not available';
    }
  };

  // Loading state
  if (loading || ridesLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between px-4 py-3 bg-white shadow-sm pt-[60px]">
          <Pressable onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <Text className="text-xl font-bold font-[Afacad] text-black">
            Ride Details
          </Text>
          <View className="w-8" />
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00BD5F" />
          <Text className="mt-4 text-lg font-[Afacad] text-gray-600">
            Loading ride details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between px-4 py-3 bg-white shadow-sm pt-[60px]">
          <Pressable onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <Text className="text-xl font-bold font-[Afacad] text-black">
            Ride Details
          </Text>
          <View className="w-8" />
        </View>
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-lg font-bold text-gray-800 mt-4 text-center font-[Afacad]">
            Error Loading Ride
          </Text>
          <Text className="text-gray-600 mt-2 text-center font-[Afacad]">
            {safeString(error)}
          </Text>
          <Pressable 
            onPress={() => router.back()}
            className="bg-[#00BD5F] px-6 py-3 rounded-lg mt-6"
          >
            <Text className="text-white font-bold font-[Afacad]">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!rideData) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between px-4 py-3 bg-white shadow-sm pt-[60px]">
          <Pressable onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <Text className="text-xl font-bold font-[Afacad] text-black">
            Ride Details
          </Text>
          <View className="w-8" />
        </View>
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-lg font-bold text-gray-800 mt-4 text-center font-[Afacad]">
            Ride Not Found
          </Text>
          <Pressable 
            onPress={() => router.back()}
            className="bg-[#00BD5F] px-6 py-3 rounded-lg mt-6"
          >
            <Text className="text-white font-bold font-[Afacad]">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white shadow-sm pt-[60px]">
        <Pressable onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        <Text className="text-xl font-bold font-[Afacad] text-black">
          Ride Details
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1">
        {/* Map */}
        <View className="h-96 mx-4 mt-4 rounded-lg overflow-hidden shadow-sm">
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: routeCoordinates[0].latitude,
              longitude: routeCoordinates[0].longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            
            {/* Route Markers */}
            <Marker // start marker
              coordinate={routeCoordinates[0]}
              title="Start"
              pinColor="green"
            />
            <Marker // end marker
              coordinate={routeCoordinates[routeCoordinates.length - 1]}
              title="End"
              pinColor="red"
            />

            {/* Stopover Markers */}
            {stopovers.map((stopover) => (
              <Marker
                key={stopover.id}
                coordinate={stopover.coordinates}
                title={stopover.location}
                description="Stopover"
              >
                <View className="bg-orange-400 rounded-full p-2">
                  <Ionicons name="pause" size={10} color="white" />
                </View>
              </Marker>
            ))}

            
            {/* Route Polyline */}
            <Polyline
              coordinates={polylineCoords}
              strokeColor="#00BD5F"
              strokeWidth={3}
            />
          </MapView>
        </View>

        {/* Ride Status - FIXED with safety checks */}
        <View className="mx-4 mt-4 mb-4">
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-lg font-bold font-[Afacad] text-black">
                  {safeString(rideData.from) || 'Unknown'} → {safeString(rideData.to) || 'Unknown'}
                </Text>
                <Text className="text-sm font-[Afacad] text-gray-600">
                  {formatDate(rideData)} at {formatTime(safeString(rideData.departureTime))}
                </Text>
                <Text className="text-sm font-[Afacad] text-gray-600 mt-1">
                  Duration: {safeString(rideData.duration) || 'N/A'} • Price: {safeString(rideData.price) || '0'} AED per seat
                </Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${
                rideData.status === 'in-progress' ? 'bg-yellow-100' :
                rideData.status === 'departed' ? 'bg-blue-100' : 
                rideData.status === 'completed' ? 'bg-green-100' :
                rideData.status === 'booked' ? 'bg-purple-100' :
                'bg-gray-100' // Default for unknown statuses
              }`}>
                <Text className={`text-sm font-[Afacad] font-medium ${
                  rideData.status === 'in-progress' ? 'text-yellow-700' :
                  rideData.status === 'departed' ? 'text-blue-700' : 
                  rideData.status === 'completed' ? 'text-green-700' :
                  rideData.status === 'booked' ? 'text-purple-700' :
                  'text-gray-700' // Default for unknown statuses
                }`}>
                  {rideData.status === 'in-progress' ? 'Ready to Start' :
                  rideData.status === 'departed' ? 'In Progress' : 
                  rideData.status === 'completed' ? 'Completed' :
                  rideData.status === 'booked' ? 'Booked' :
                  safeString(rideData.status) || 'Unknown Status'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Seat Information - FIXED with safety checks */}
        <View className="bg-white rounded-lg mx-4 mb-4 shadow-sm">
          <View className="p-4 border-b border-gray-200">
            <Text className="text-lg font-bold font-[Afacad] text-black">
              Seat Information
            </Text>
          </View>
          <View className="p-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-base font-[Afacad] text-gray-600">Available Seats:</Text>
              <Text className="text-base font-[Afacad] font-semibold text-black">
                {safeNumber(rideData.availableSeats)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-base font-[Afacad] text-gray-600">Booked Seats:</Text>
              <Text className="text-base font-[Afacad] font-semibold text-blue-600">
                {safeNumber(rideData.bookedSeats)}
              </Text>
            </View>
            {/* {rideData.totalSeats && (
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-[Afacad] text-gray-600">Total Seats:</Text>
                <Text className="text-base font-[Afacad] font-semibold text-black">
                  {safeNumber(rideData.totalSeats)}
                </Text>
              </View>
            )} */}
          </View>
        </View>

        {/* Passengers List - FIXED with safety checks */}
        <View className="bg-white rounded-lg mx-4 mb-4 shadow-sm">
          <View className="p-4 border-b border-gray-200">
            <Text className="text-lg font-bold font-[Afacad] text-black">
              Passengers ({passengers.length})
            </Text>
          </View>
          
          {passengers.length > 0 ? (
            <ScrollView className="max-h-48">
              {passengers.map((passenger, index) => (
                <View key={index} className="flex-row items-center justify-between p-4 border-b border-gray-100">
                  <View className="flex-1">
                    <Text className="text-base font-[Afacad] font-medium text-black">
                      {safeString(passenger.name) || 'Unknown Passenger'}
                    </Text>
                    <Text className="text-sm font-[Afacad] text-gray-600">
                      {safeNumber(passenger.seatsBooked)} seat{safeNumber(passenger.seatsBooked) > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleCallPress(passenger.phone, passenger.name)}
                    className="bg-green-500 px-4 py-2 rounded-full flex-row items-center"
                  >
                    <Ionicons name="call" size={16} color="white" />
                    <Text className="text-white font-[Afacad] ml-2">Call</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className="p-4 items-center">
              <Text className="text-gray-500 font-[Afacad]">No passengers yet</Text>
              <Text className="text-gray-400 font-[Afacad] text-sm mt-1">
                Passengers will appear here once they book your ride
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="mx-4 mb-4">
          {(rideData.status === 'in-progress' || rideData.status === 'booked') && (
            <Pressable
              onPress={handleStartRide}
              disabled={actionLoading}
              className={`py-4 rounded-lg mb-3 items-center ${
                actionLoading ? 'bg-gray-400' : 'bg-green-500'
              }`}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#00BD5F" />
              ) : (
                <Text className="text-white text-lg font-[Afacad] font-semibold">
                  Start Ride
                </Text>
              )}
            </Pressable>
          )}
          
          {rideData.status === 'departed' && (
            <Pressable
              onPress={handleEndRide}
              disabled={actionLoading}
              className={`py-4 rounded-lg mb-3 items-center ${
                actionLoading ? 'bg-gray-400' : 'bg-red-500'
              }`}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-lg font-[Afacad] font-semibold">
                  End Ride
                </Text>
              )}
            </Pressable>
          )}
          
          {rideData.status === 'completed' && (
            <View className="bg-gray-100 py-4 rounded-lg items-center">
              <Text className="text-gray-600 text-lg font-[Afacad]">
                Ride Completed - Thank you!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DriverRideDetailsScreen;