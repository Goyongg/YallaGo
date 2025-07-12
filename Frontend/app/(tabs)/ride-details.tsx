// app/ride-details.tsx
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
  Dimensions 
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import ReviewModal from '../components/ReviewModal';

const { width, height } = Dimensions.get('window');
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

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

const RideDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  
  const { rideId, userRole, vehicle, passengerCount } = params;
  
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 25.2048, // Default to Dubai
    longitude: 55.2708,
  });
  
  const [routeCoordinates, setRouteCoordinates] = useState([
    { latitude: 25.2048, longitude: 55.2708 }, // Start point (placeholder)
    { latitude: 25.1972, longitude: 55.2744 }, // End point (placeholder)
  ]);
  
  const [passengers, setPassengers] = useState<PassengerInfo[]>([
    // Placeholder data - would normally come from backend
    { name: 'Ahmed Al-Rashid', phone: '+971501234567', seatsBooked: 1 },
    { name: 'Sara Mohammed', phone: '+971509876543', seatsBooked: 2 },
  ]);
  
  const [driverInfo, setDriverInfo] = useState<DriverInfo>({
    // Placeholder data - would normally come from backend
    name: 'Mohammed Hassan',
    phone: '+971501111222',
    rating: 4.8,
  });
  
  const [rideStatus, setRideStatus] = useState<'in-progress' | 'departed' | 'completed'>('in-progress');
  const [loading, setLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ name: string; id: string } | null>(null);

  // Parse vehicle data if provided
  const vehicleData = vehicle ? JSON.parse(vehicle as string) : null;
  const totalPassengers = passengerCount ? parseInt(passengerCount as string) : passengers.length;

  useEffect(() => {
    // Get current location
    // In a real app, you'd use location services here
    // For now, using placeholder location
    setCurrentLocation({
      latitude: 25.2048,
      longitude: 55.2708,
    });
    
    // Fetch ride details from backend
    fetchRideDetails();
  }, []);

  const fetchRideDetails = async () => {
    try {
      setLoading(true);
      
      // This would fetch real ride details including route coordinates
      // For now using placeholder data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you'd fetch:
      // - Route coordinates from Google Maps API or stored waypoints
      // - Passenger/driver details from your backend
      // - Current ride status
      
    } catch (error) {
      console.error('Error fetching ride details:', error);
    } finally {
      setLoading(false);
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
                  `${BASE_URL}/rides/start-ride?rideId=${rideId}`,
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
                  `${BASE_URL}/rides/end-ride?rideId=${rideId}`,
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
                  // For demo, we'll review the first passenger
                  // In real implementation, you'd show review modal for each passenger who booked
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
            // In a real app, this would:
            // 1. Call emergency services (999 in UAE)
            // 2. Send location to emergency contacts
            // 3. Notify the ride-sharing platform
            
            Alert.alert('SOS Activated', 'Emergency services have been notified.');
            
            // For demo purposes, just show the emergency number
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
    
    // Navigate back to home after review
    setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 1000);
  };

  const handleLeaveReview = () => {
    if (userRole === 'passenger') {
      setReviewTarget({ name: driverInfo.name, id: driverInfo.phone });
      setShowReviewModal(true);
    }
  };

  const renderDriverView = () => (
    <>
      {/* Passengers List */}
      <View className="bg-white rounded-lg mx-4 mb-4 shadow-sm">
        <View className="p-4 border-b border-gray-200">
          <Text className="text-lg font-bold font-[Afacad] text-black">
            Passengers ({totalPassengers})
          </Text>
        </View>
        
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
          {vehicleData && (
            <View className="bg-gray-50 rounded-lg p-3">
              <Text className="text-sm font-[Afacad] text-gray-600 mb-2">Vehicle</Text>
              <Text className="text-base font-[Afacad] font-medium text-black">
                {vehicleData.make} {vehicleData.model} • {vehicleData.color}
              </Text>
              <Text className="text-lg font-[Afacad] font-bold text-black">
                {vehicleData.plateNumber}
              </Text>
            </View>
          )}
        </View>
      </View>

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
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
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
        <View className="mx-4 mt-4 mb-4">
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold font-[Afacad] text-black">
                Ride Status
              </Text>
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

        {/* Role-specific Content */}
        {userRole === 'driver' ? renderDriverView() : renderPassengerView()}
      </ScrollView>
      
      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          visible={showReviewModal}
          onClose={handleReviewComplete}
          rideId={rideId as string}
          targetName={reviewTarget.name}
          userRole={userRole as 'driver' | 'passenger'}
        />
      )}
    </SafeAreaView>
  );
};

export default RideDetailsScreen;