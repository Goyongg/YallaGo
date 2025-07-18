// app/ride-details.tsx - Updated to use real backend data
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
    latitude: number;
    longitude: number;
  };
  endGeo?: {
    latitude: number;
    longitude: number;
  };
}

const RideDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  
  const { rideId, userRole } = params;
  const { userData, upcomingData, loading: homeLoading } = useHomeUserData();
  
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 25.2048, // Default to Dubai
    longitude: 55.2708,
  });
  
  const [routeCoordinates, setRouteCoordinates] = useState([
    { latitude: 25.2048, longitude: 55.2708 }, // Start point (placeholder)
    { latitude: 25.1972, longitude: 55.2744 }, // End point (placeholder)
  ]);
  
  const [passengers, setPassengers] = useState<PassengerInfo[]>([]);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [rideData, setRideData] = useState<RideData | null>(null);
  const [rideStatus, setRideStatus] = useState<'in-progress' | 'departed' | 'completed'>('in-progress');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ name: string; id: string } | null>(null);

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
        console.log('🚗 Ride not found in upcoming data, fetching from API...');
        await fetchRideFromAPI();
        return;
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
        from: rideItem.startLocation,
        to: rideItem.endLocation,
        departureTime,
        status: rideItem.status || 'in-progress',
        coordinates: rideItem.coordinates,
        endGeo: rideItem.endGeo,
      };
      setRideData(ride);

      // Set route coordinates if available
      if (rideItem.coordinates && rideItem.endGeo) {
        const startCoords = {
          latitude: rideItem.coordinates.latitude || rideItem.coordinates._latitude || 25.2048,
          longitude: rideItem.coordinates.longitude || rideItem.coordinates._longitude || 55.2708,
        };
        const endCoords = {
          latitude: rideItem.endGeo.latitude || rideItem.endGeo._latitude || 25.1972,
          longitude: rideItem.endGeo.longitude || rideItem.endGeo._longitude || 55.2744,
        };
        setRouteCoordinates([startCoords, endCoords]);
      }

      // Set passengers from bookings
      if (rideItem.bookings && Array.isArray(rideItem.bookings)) {
        const passengerList: PassengerInfo[] = rideItem.bookings.map((booking: any) => ({
          name: booking.passengerName,
          phone: booking.phoneNumber,
          seatsBooked: booking.seatsBooked,
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
        from: bookingItem.pickupPoint,
        to: bookingItem.dropOffPoint,
        departureTime,
        status: bookingItem.status || 'confirmed',
        coordinates: bookingItem.ride?.coordinates,
        endGeo: bookingItem.ride?.endGeo,
      };
      setRideData(ride);

      // Set route coordinates if available
      if (bookingItem.bookingStart && bookingItem.bookingEnd) {
        const startCoords = {
          latitude: bookingItem.bookingStart.latitude || bookingItem.bookingStart._latitude || 25.2048,
          longitude: bookingItem.bookingStart.longitude || bookingItem.bookingStart._longitude || 55.2708,
        };
        const endCoords = {
          latitude: bookingItem.bookingEnd.latitude || bookingItem.bookingEnd._latitude || 25.1972,
          longitude: bookingItem.bookingEnd.longitude || bookingItem.bookingEnd._longitude || 55.2744,
        };
        setRouteCoordinates([startCoords, endCoords]);
      }

      // Set driver info
      if (bookingItem.driver) {
        const driver: DriverInfo = {
          name: bookingItem.driver.name,
          phone: bookingItem.driver.phoneNumber,
          rating: bookingItem.driver.averageRating || 0,
        };
        setDriverInfo(driver);
      }

      // Set vehicle info
      if (bookingItem.vehicle) {
        const vehicle: VehicleInfo = {
          make: bookingItem.vehicle.make,
          model: bookingItem.vehicle.model,
          color: bookingItem.vehicle.color,
          plateNumber: bookingItem.vehicle.plateNumber,
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

  const fetchRideFromAPI = async () => {
    try {
      // If ride not found in upcoming data, try to fetch from API
      // This would require additional backend endpoints
      console.log('🚗 Fetching ride from API not implemented yet');
      throw new Error('Ride not found in upcoming data');
    } catch (err) {
      throw err;
    }
  };

  const handleCallPress = (phoneNumber: string, name: string) => {
    Alert.alert(
      `Call ${name}`,
      `Do you want to call ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            const url = `tel:${phoneNumber}`;
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
                Alert.alert('Success', 'Ride completed! Please leave reviews for your passengers.');
                
                // Show review modal for driver to review passengers
                if (userRole === 'driver' && passengers.length > 0) {
                  setTimeout(() => {
                    setReviewTarget({ name: passengers[0].name, id: passengers[0].phone });
                    setShowReviewModal(true);
                  }, 1000);
                }
                
                // Navigate back to home after a brief delay
                setTimeout(() => {
                  router.replace('/(tabs)/home');
                }, 2000);
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
    setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 1000);
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
            {error}
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
                    {passenger.name}
                  </Text>
                  <Text className="text-sm font-[Afacad] text-gray-600">
                    {passenger.seatsBooked} seat{passenger.seatsBooked > 1 ? 's' : ''}
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
                  {driverInfo.name}
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text className="text-sm font-[Afacad] text-gray-600 ml-1">
                    {driverInfo.rating.toFixed(1)}
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
                  {vehicleInfo.make} {vehicleInfo.model} • {vehicleInfo.color}
                </Text>
                <Text className="text-lg font-[Afacad] font-bold text-black">
                  {vehicleInfo.plateNumber}
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
        {rideStatus === 'completed' && (
          <Pressable
            onPress={handleLeaveReview}
            className="bg-[#00BD5F] py-4 rounded-lg items-center"
          >
            <Text className="text-white text-lg font-[Afacad] font-semibold">
              Leave Review for Driver
            </Text>
          </Pressable>
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
              latitude: routeCoordinates[0].latitude,
              longitude: routeCoordinates[0].longitude,
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
            
            {/* Route Polyline */}
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#00BD5F"
              strokeWidth={3}
            />
          </MapView>
        </View>

        {/* Ride Status */}
        {rideData && (
          <View className="mx-4 mt-4 mb-4">
            <View className="bg-white rounded-lg p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-lg font-bold font-[Afacad] text-black">
                    {rideData.from} → {rideData.to}
                  </Text>
                  <Text className="text-sm font-[Afacad] text-gray-600">
                    {rideData.departureTime.toLocaleDateString()} at {rideData.departureTime.toLocaleTimeString()}
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