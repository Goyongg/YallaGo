// app/ride-details.tsx - Fixed to use single data source with polyline
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  SafeAreaView, 
  ScrollView, 
  Alert,
  Linking,
  Platform,
  Dimensions,
  ActivityIndicator 
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import ReviewModal from '../components/ReviewModal';
import useHomeUserData from '../../hooks/useHomeUserData';
import { BASE_URL } from '@/config';

interface PassengerInfo {
  name: string;
  phone: string;
  seatsBooked: number;
}

interface DriverInfo {
  name: string;
  phone: string;
  rating: number;
  photo?: string;
}

interface VehicleInfo {
  make: string;
  model: string;
  color: string;
  plateNumber: string;
}

interface RideData {
  rideId: string;
  from: string;
  to: string;
  departureTime: Date;
  status: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
    _latitude?: number;
    _longitude?: number;
  };
  endGeo?: {
    latitude?: number;
    longitude?: number;
    _latitude?: number;
    _longitude?: number;
  };
  polyline?: string;
}

// Safety utility functions
const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const safeNumber = (value: any): number => {
  if (value === null || value === undefined || isNaN(Number(value))) return 0;
  return Number(value);
};

const RideDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  
  const { rideId, userRole } = params;
  const { userData, upcomingData, loading: homeLoading, refetch } = useHomeUserData();
  
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 25.2048, // Default to Dubai
    longitude: 55.2708,
  });
  
  // Default coordinates (Dubai area)
  const defaultCoordinates = [
    { latitude: 25.2048, longitude: 55.2708 }, // Start
    { latitude: 25.1972, longitude: 55.2744 }, // End
  ];
  
  const [routeCoordinates, setRouteCoordinates] = useState(defaultCoordinates);
  const [polylineCoords, setPolylineCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  
  const [passengers, setPassengers] = useState<PassengerInfo[]>([]);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [rideData, setRideData] = useState<RideData | null>(null);
  const [rideStatus, setRideStatus] = useState<'in-progress' | 'departed' | 'completed'>('in-progress');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ name: string; id: string } | null>(null);

  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (!hasFetchedRef.current) {
      refetch();
      hasFetchedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!homeLoading && upcomingData && userData && rideId) {
      loadRideDetails();
    }
  }, [homeLoading, upcomingData, userData, rideId]);

  const loadRideDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚗 Loading ride details for ID:', rideId, 'Role:', userRole);
      console.log('🚗 Available upcoming data:', upcomingData.length, 'items');

      if (!userData) {
        throw new Error('User data not available');
      }

      // Find the specific ride/booking in upcoming data
      const targetItem = upcomingData.find((item: any) => {
        if (userData.role === 'driver') {
          return item.rideId === rideId;
        } else {
          return item.bookingId === rideId || item.rideId === rideId;
        }
      });

      if (!targetItem) {
        throw new Error('Ride not found in upcoming data');
      }

      console.log('🚗 Found ride data:', targetItem);

      if (userData.role === 'driver') {
        await processDriverRideData(targetItem);
      } else {
        await processPassengerBookingData(targetItem);
      }

    } catch (err: any) {
      console.error('🚗 Error loading ride details:', err);
      setError(err.message || 'Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  const processDriverRideData = async (rideItem: any) => {
    try {
      // Parse departure time
      let departureTime: Date;
      if (rideItem.departureTime && typeof rideItem.departureTime === 'object') {
        if (rideItem.departureTime._seconds) {
          departureTime = new Date(rideItem.departureTime._seconds * 1000);
        } else if (rideItem.departureTime.seconds) {
          departureTime = new Date(rideItem.departureTime.seconds * 1000);
        } else {
          departureTime = new Date(rideItem.departureTime);
        }
      } else {
        departureTime = new Date(rideItem.departureTime || Date.now());
      }

      // Set ride data
      const ride: RideData = {
        rideId: rideItem.rideId,
        from: safeString(rideItem.startLocation) || 'Unknown',
        to: safeString(rideItem.endLocation) || 'Unknown',
        departureTime,
        status: safeString(rideItem.status) || 'in-progress',
        coordinates: rideItem.coordinates,
        endGeo: rideItem.endGeo,
        polyline: rideItem.polyline,
      };
      setRideData(ride);

      // 🗺️ Process coordinates and polyline
      processCoordinatesAndPolyline(rideItem);

      // Set passengers from bookings
      if (rideItem.bookings && Array.isArray(rideItem.bookings)) {
        const passengerList: PassengerInfo[] = rideItem.bookings.map((booking: any) => ({
          name: safeString(booking.passengerName) || 'Unknown Passenger',
          phone: safeString(booking.phoneNumber) || '',
          seatsBooked: safeNumber(booking.seatsBooked),
        }));
        setPassengers(passengerList);
      }

      // Set ride status
      setRideStatus(rideItem.status === 'departed' ? 'departed' : 'in-progress');

      console.log('🚗 Driver ride data processed:', ride);
      console.log('🚗 Passengers:', passengers.length);

    } catch (err) {
      console.error('🚗 Error processing driver ride data:', err);
      throw err;
    }
  };

  const processPassengerBookingData = async (bookingItem: any) => {
    try {
      // Parse departure time from ride data
      let departureTime: Date;
      const rideDepTime = bookingItem.ride?.departureTime;
      if (rideDepTime && typeof rideDepTime === 'object') {
        if (rideDepTime._seconds) {
          departureTime = new Date(rideDepTime._seconds * 1000);
        } else if (rideDepTime.seconds) {
          departureTime = new Date(rideDepTime.seconds * 1000);
        } else {
          departureTime = new Date(rideDepTime);
        }
      } else {
        departureTime = new Date(rideDepTime || Date.now());
      }

      // Set ride data
      const ride: RideData = {
        rideId: bookingItem.bookingId,
        from: safeString(bookingItem.pickupPoint) || 'Unknown',
        to: safeString(bookingItem.dropOffPoint) || 'Unknown',
        departureTime,
        status: safeString(bookingItem.status) || 'confirmed',
        coordinates: bookingItem.ride?.coordinates,
        endGeo: bookingItem.ride?.endGeo,
        polyline: bookingItem.ride?.polyline,
      };
      setRideData(ride);

      // Use the main ride data for polyline, not booking-specific coordinates
      console.log('🗺️ Passenger booking - checking for polyline data:', {
        hasRide: !!bookingItem.ride,
        hasPolyline: !!bookingItem.ride?.polyline,
        polylineLength: bookingItem.ride?.polyline?.length
      });

      // Process coordinates and polyline from the main ride data
      processCoordinatesAndPolyline(bookingItem.ride || bookingItem);

      // 🔧 OPTIONAL: Only override with booking-specific coordinates if they exist AND no polyline
      if (bookingItem.bookingStart && bookingItem.bookingEnd && !bookingItem.ride?.polyline) {
        console.log('🗺️ Using booking-specific coordinates (no polyline available)');
        const startCoords = {
          latitude: bookingItem.bookingStart.latitude || bookingItem.bookingStart._latitude || defaultCoordinates[0].latitude,
          longitude: bookingItem.bookingStart.longitude || bookingItem.bookingStart._longitude || defaultCoordinates[0].longitude,
        };
        const endCoords = {
          latitude: bookingItem.bookingEnd.latitude || bookingItem.bookingEnd._latitude || defaultCoordinates[1].latitude,
          longitude: bookingItem.bookingEnd.longitude || bookingItem.bookingEnd._longitude || defaultCoordinates[1].longitude,
        };
        setRouteCoordinates([startCoords, endCoords]);
        setPolylineCoords([startCoords, endCoords]); // Simple line for booking-specific route
      }

      // Set driver info
      if (bookingItem.driver) {
        const driver: DriverInfo = {
          name: safeString(bookingItem.driver.name) || 'Unknown Driver',
          phone: safeString(bookingItem.driver.phoneNumber) || '',
          rating: safeNumber(bookingItem.driver.averageRating),
        };
        setDriverInfo(driver);
      }

      // Set vehicle info
      if (bookingItem.vehicle) {
        const vehicle: VehicleInfo = {
          make: safeString(bookingItem.vehicle.make) || 'Unknown',
          model: safeString(bookingItem.vehicle.model) || 'Unknown',
          color: safeString(bookingItem.vehicle.color) || 'Unknown',
          plateNumber: safeString(bookingItem.vehicle.plateNumber) || 'Unknown',
        };
        setVehicleInfo(vehicle);
      }

      // Set status based on booking status
      if (bookingItem.status === 'ongoing') {
        setRideStatus('departed');
      } else if (bookingItem.status === 'completed') {
        setRideStatus('completed');
      } else {
        setRideStatus('in-progress');
      }

      console.log('🚗 Passenger booking data processed:', ride);
      console.log('🚗 Driver info:', driverInfo);
      console.log('🚗 Vehicle info:', vehicleInfo);

    } catch (err) {
      console.error('🚗 Error processing passenger booking data:', err);
      throw err;
    }
  };

  // 🗺️ NEW: Process coordinates and polyline (same logic as driver-ride-details.tsx)
  const processCoordinatesAndPolyline = (rideInfo: any) => {
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
        
        // 🔧 FIX: Set simple line first, then try to parse polyline
        setPolylineCoords([startCoords, endCoords]);
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
    
    // 🔧 FIX: Parse polyline AFTER setting basic coordinates
    if (rideInfo.polyline) {  
      try {
        console.log('🗺️ Attempting to parse polyline:', rideInfo.polyline.substring(0, 100) + '...');
        const parsed = JSON.parse(rideInfo.polyline);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('📍 Polyline coordinates set:', parsed.length, 'points');
          setPolylineCoords(parsed); // This should override the simple line
        } else {
          console.warn('🗺️ Parsed polyline is not a valid array');
        }
      } catch (err) {
        console.warn('🗺️ Failed to parse polyline from string:', err);
        console.log('🗺️ Polyline raw data:', rideInfo.polyline);
      }
    } else {
      console.log('🗺️ No polyline data available');
    }
  };

  const handleCallPress = (phoneNumber: string, name: string) => {
    const safeName = safeString(name) || 'Person';
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

    try {
      const user = auth().currentUser;
      if (!user) return;

      const idToken = await user.getIdToken();
      
      Alert.alert(
        'Start Ride',
        'Are you sure you want to start this ride?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start',
            onPress: async () => {
              try {
                setLoading(true);
                
                const response = await axios.patch(
                  `${BASE_URL}/rides/start-ride?rideId=${rideData.rideId}`,
                  {},
                  {
                    headers: {
                      Authorization: `Bearer ${idToken}`,
                    },
                  }
                );
                
                setRideStatus('departed');
                Alert.alert('Success', 'Ride started successfully!');
                // Refresh data
                refetch();
              } catch (error: any) {
                console.error('Error starting ride:', error);
                Alert.alert('Error', 'Failed to start ride');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleStartRide:', error);
    }
  };

  const handleEndRide = async () => {
    if (!rideData) return;

    try {
      const user = auth().currentUser;
      if (!user) return;

      const idToken = await user.getIdToken();
      
      Alert.alert(
        'End Ride',
        'Are you sure you want to end this ride?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End',
            onPress: async () => {
              try {
                setLoading(true);
                
                const response = await axios.patch(
                  `${BASE_URL}/rides/end-ride?rideId=${rideData.rideId}`,
                  {},
                  {
                    headers: {
                      Authorization: `Bearer ${idToken}`,
                    },
                  }
                );
                
                setRideStatus('completed');
                
                // 📝 MANDATORY REVIEW: Show review modal immediately after ride completion
                // Driver must review passengers, Passenger must review driver
                setTimeout(() => {
                  if (userRole === 'driver' && passengers.length > 0) {
                    // Driver reviews first passenger (can be extended for multiple passengers)
                    setReviewTarget({ name: passengers[0].name, id: passengers[0].phone });
                    setShowReviewModal(true);
                  } else if (userRole === 'passenger' && driverInfo) {
                    // Passenger reviews driver
                    setReviewTarget({ name: driverInfo.name, id: driverInfo.phone });
                    setShowReviewModal(true);
                  }
                }, 500);
                
                // Refresh data
                refetch();
                
              } catch (error: any) {
                console.error('Error ending ride:', error);
                Alert.alert('Error', 'Failed to end ride');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleEndRide:', error);
    }
  };

  const handleSOSPress = () => {
    Alert.alert(
      'Emergency SOS',
      'This feature will contact emergency services and notify your emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call Emergency', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('SOS Activated', 'Emergency services have been notified.');
            const emergencyNumber = '999'; // UAE emergency number
            Linking.openURL(`tel:${emergencyNumber}`);
          }
        },
      ]
    );
  };

  const handleReviewComplete = () => {
    setShowReviewModal(false);
    setReviewTarget(null);
    
    // Navigate back to home after review is completed
    setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 500);
  };

  const handleLeaveReview = () => {
    if (userRole === 'passenger' && driverInfo) {
      setReviewTarget({ name: driverInfo.name, id: driverInfo.phone });
      setShowReviewModal(true);
    }
  };

  // Loading state
  if (loading || homeLoading) {
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

  const renderDriverView = () => (
    <>
      {/* Passengers List */}
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
          </View>
        )}
      </View>

      {/* Driver Action Buttons */}
      <View className="mx-4 mb-4">
        {rideStatus === 'in-progress' && (
          <Pressable
            onPress={handleStartRide}
            disabled={loading}
            className="bg-blue-500 py-4 rounded-lg mb-3 items-center"
          >
            <Text className="text-white text-lg font-[Afacad] font-semibold">
              {loading ? 'Starting...' : 'Start Ride'}
            </Text>
          </Pressable>
        )}
        
        {rideStatus === 'departed' && (
          <Pressable
            onPress={handleEndRide}
            disabled={loading}
            className="bg-red-500 py-4 rounded-lg mb-3 items-center"
          >
            <Text className="text-white text-lg font-[Afacad] font-semibold">
              {loading ? 'Ending...' : 'End Ride'}
            </Text>
          </Pressable>
        )}
        
        {rideStatus === 'completed' && (
          <View className="bg-gray-100 py-4 rounded-lg items-center">
            <Text className="text-gray-600 text-lg font-[Afacad]">
              Ride Completed - Thank you!
            </Text>
          </View>
        )}
      </View>
    </>
  );

  const renderPassengerView = () => (
    <>
      {/* Driver Info */}
      {driverInfo && (
        <View className="bg-white rounded-lg mx-4 mb-4 shadow-sm">
          <View className="p-4 border-b border-gray-200">
            <Text className="text-lg font-bold font-[Afacad] text-black">
              Your Driver
            </Text>
          </View>
          
          <View className="p-4">
            <View className="flex-row items-center mb-4">
              <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center">
                <Ionicons name="person" size={32} color="#666" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-lg font-[Afacad] font-bold text-black">
                  {safeString(driverInfo.name) || 'Unknown Driver'}
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text className="text-sm font-[Afacad] text-gray-600 ml-1">
                    {safeNumber(driverInfo.rating).toFixed(1)}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => handleCallPress(driverInfo.phone, driverInfo.name)}
                className="bg-green-500 px-4 py-2 rounded-full flex-row items-center"
              >
                <Ionicons name="call" size={16} color="white" />
                <Text className="text-white font-[Afacad] ml-2">Call</Text>
              </Pressable>
            </View>
            
            {/* Vehicle Info */}
            {vehicleInfo && (
              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-sm font-[Afacad] text-gray-600 mb-2">Vehicle</Text>
                <Text className="text-base font-[Afacad] font-medium text-black">
                  {safeString(vehicleInfo.make)} {safeString(vehicleInfo.model)} • {safeString(vehicleInfo.color)}
                </Text>
                <Text className="text-lg font-[Afacad] font-bold text-black">
                  {safeString(vehicleInfo.plateNumber)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* SOS Button */}
      <View className="mx-4 mb-4">
        <Pressable
          onPress={handleSOSPress}
          className="bg-red-500 py-4 rounded-lg items-center border-2 border-red-600"
        >
          <View className="flex-row items-center">
            <Ionicons name="warning" size={24} color="white" />
            <Text className="text-white text-lg font-[Afacad] font-bold ml-2">
              Emergency SOS
            </Text>
          </View>
          <Text className="text-red-100 text-sm font-[Afacad] mt-1">
            Tap in case of emergency
          </Text>
        </Pressable>
      </View>

      {/* Passenger Action Buttons */}
      <View className="mx-4 mb-4">
        {/* Remove manual review button since review is now mandatory after ride completion */}
        {rideStatus === 'completed' && !showReviewModal && (
          <View className="bg-gray-100 py-4 rounded-lg items-center">
            <Text className="text-gray-600 text-lg font-[Afacad]">
              Ride Completed - Thank you!
            </Text>
          </View>
        )}
      </View>
    </>
  );

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
              latitude: routeCoordinates.length > 0 ? routeCoordinates[0].latitude : defaultCoordinates[0].latitude,
              longitude: routeCoordinates.length > 0 ? routeCoordinates[0].longitude : defaultCoordinates[0].longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {/* Current Location Marker */}
            <Marker
              coordinate={currentLocation}
              title="Your Location"
              pinColor="blue"
            />
            
            {/* Route Markers */}
            {routeCoordinates.length > 0 && (
              <>
                <Marker
                  coordinate={routeCoordinates[0]}
                  title="Start"
                  pinColor="green"
                />
                <Marker
                  coordinate={routeCoordinates[routeCoordinates.length - 1]}
                  title="End"
                  pinColor="red"
                />
              </>
            )}
            
            {/* Route Polyline - Show detailed route if available */}
            {polylineCoords.length > 0 && (
              <Polyline
                coordinates={polylineCoords}
                strokeColor="#00BD5F"
                strokeWidth={3}
              />
            )}
          </MapView>
        </View>

        {/* Ride Status */}
        {rideData && (
          <View className="mx-4 mt-4 mb-4">
            <View className="bg-white rounded-lg p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-lg font-bold font-[Afacad] text-black">
                    {safeString(rideData.from)} → {safeString(rideData.to)}
                  </Text>
                  <Text className="text-sm font-[Afacad] text-gray-600">
                    {rideData.departureTime.toLocaleDateString()} at {rideData.departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${
                  rideStatus === 'in-progress' ? 'bg-yellow-100' :
                  rideStatus === 'departed' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  <Text className={`text-sm font-[Afacad] font-medium ${
                    rideStatus === 'in-progress' ? 'text-yellow-700' :
                    rideStatus === 'departed' ? 'text-blue-700' : 'text-green-700'
                  }`}>
                    {rideStatus === 'in-progress' ? 'Ready to Start' :
                     rideStatus === 'departed' ? 'In Progress' : 'Completed'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Role-specific Content */}
        {userRole === 'driver' ? renderDriverView() : renderPassengerView()}
      </ScrollView>
      
      {/* Review Modal */}
      {reviewTarget && rideData && (
        <ReviewModal
          visible={showReviewModal}
          onClose={handleReviewComplete}
          rideId={rideData.rideId}
          targetName={reviewTarget.name}
          userRole={userRole as 'driver' | 'passenger'}
        />
      )}
    </SafeAreaView>
  );
};

export default RideDetailsScreen;