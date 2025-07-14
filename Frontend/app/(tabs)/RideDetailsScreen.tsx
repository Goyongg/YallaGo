import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Polyline, Marker } from 'react-native-maps';
import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');

// This should be checked to match the current IP address
// Uni: 10.45.49.69
// Home: 10.128.24.33
const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

const RideDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [passengerCount, setPassengerCount] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);

  // Extract parameters with better type safety
  const rideDetails = {
    rideId: params.rideId as string,
    departureTime: params.departureTime as string,
    arrivalTime: params.arrivalTime as string,
    duration: params.duration as string,
    from: params.from as string,
    to: params.to as string,
    price: parseFloat(params.price as string) || 0,
    driverName: params.driverName as string,
    driverRating: parseFloat(params.driverRating as string) || 0,
    availableSeats: parseInt(params.availableSeats as string) || 1,
    femaleOnly: params.femaleOnly === '1',
    // Additional params that might be passed from search results
    fromLat: parseFloat(params.fromLat as string) || 25.1972,
    fromLng: parseFloat(params.fromLng as string) || 55.2744,
    toLat: parseFloat(params.toLat as string) || 25.2532,
    toLng: parseFloat(params.toLng as string) || 55.3657,
    // Vehicle information from search results
    vehicleMake: params.vehicleMake as string,
    vehicleModel: params.vehicleModel as string,
    vehicleColor: params.vehicleColor as string,
    vehiclePlateNumber: params.vehiclePlateNumber as string,
  };

  // Set vehicle info if available
  useEffect(() => {
    if (rideDetails.vehicleMake && rideDetails.vehicleModel) {
      setVehicleInfo({
        make: rideDetails.vehicleMake,
        model: rideDetails.vehicleModel,
        color: rideDetails.vehicleColor,
        plateNumber: rideDetails.vehiclePlateNumber,
      });
    }
  }, []);

  // Create route coordinates from the passed coordinates
  const routeCoordinates = [
    { latitude: rideDetails.fromLat, longitude: rideDetails.fromLng },
    { latitude: rideDetails.toLat, longitude: rideDetails.toLng },
  ];

  // Calculate map region to show both points
  const mapRegion = {
    latitude: (rideDetails.fromLat + rideDetails.toLat) / 2,
    longitude: (rideDetails.fromLng + rideDetails.toLng) / 2,
    latitudeDelta: Math.abs(rideDetails.fromLat - rideDetails.toLat) + 0.05,
    longitudeDelta: Math.abs(rideDetails.fromLng - rideDetails.toLng) + 0.05,
  };

  // Format the current date for display
  const formatDate = () => {
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]}`;
  };

  // Book ride function that calls the backend - FIXED
  const handleBookRide = async () => {
    if (!rideDetails.rideId) {
      Alert.alert('Error', 'Invalid ride information');
      return;
    }

    try {
      setIsBooking(true);

      // Get authentication token
      const token = await auth().currentUser?.getIdToken();
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in to book rides');
        return;
      }

      // Prepare booking payload according to CreateRidePassengerDto
      const bookingPayload = {
        rideId: rideDetails.rideId,
        pickupPoint: rideDetails.from,
        startPoint: {
          lat: rideDetails.fromLat,
          lng: rideDetails.fromLng,
        },
        dropOffPoint: rideDetails.to,
        endPoint: {
          lat: rideDetails.toLat,
          lng: rideDetails.toLng,
        },
        seatsBooked: passengerCount,
      };

      console.log('Booking ride with payload:', bookingPayload);

      // FIXED: Use correct endpoint /bookings instead of /ride-passengers
      const response = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Booking error:', errorText);
        throw new Error(errorText || 'Failed to book ride');
      }

      const result = await response.json();
      console.log('Booking successful:', result);

      // FIXED: Show success message and stay on the same page
      Alert.alert(
        'Booking Successful! 🎉', 
        `Your ride has been booked successfully.\n\nBooking ID: ${result.bookingId || 'N/A'}\nSeats booked: ${passengerCount}\nTotal cost: ${((rideDetails.price || 0) * passengerCount).toFixed(1)} AED`,
        [
          {
            text: 'OK',
            onPress: () => {
              // FIXED: Stay on the same page instead of navigating away
              console.log('Booking completed, staying on current page');
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Booking failed:', error);
      
      // Better error handling with more specific messages
      let errorMessage = 'Unable to book the ride. Please try again.';
      
      if (error.message.includes('Booked seats cannot be more than available seats')) {
        errorMessage = `Sorry, only ${rideDetails.availableSeats} seats are available for this ride.`;
      } else if (error.message.includes('Authentication')) {
        errorMessage = 'Please log in again to book this ride.';
      } else if (error.message.includes('Ride does not exist')) {
        errorMessage = 'This ride is no longer available.';
      }
      
      Alert.alert('Booking Failed', errorMessage);
    } finally {
      setIsBooking(false);
    }
  };

  const increasePassengers = () => {
    if (passengerCount < rideDetails.availableSeats) {
      setPassengerCount(prev => prev + 1);
    }
  };

  const decreasePassengers = () => {
    if (passengerCount > 1) {
      setPassengerCount(prev => prev - 1);
    }
  };

  // Format departure date from the ride details
  const formatRideDate = () => {
    try {
      // If we have date info from search, use it; otherwise use current date
      if (params.date) {
        const rideDate = new Date(params.date as string);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        
        return `${days[rideDate.getDay()]}, ${rideDate.getDate()} ${months[rideDate.getMonth()]}`;
      }
    } catch (error) {
      console.log('Error formatting ride date:', error);
    }
    
    return formatDate(); // Fallback to current date
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-16 pb-4 px-4 bg-white">
        <View className="flex-row items-center">
          <Pressable 
            onPress={() => router.back()}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="#00BD5F" />
          </Pressable>
          <Text className="text-xl font-[Afacad] font-semibold">
            {formatRideDate()}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Map Section */}
        <View className="mx-4 mb-4">
          <MapView
            style={{ width: width - 32, height: 300, borderRadius: 12 }}
            region={mapRegion}
            scrollEnabled={true}
            zoomEnabled={true}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            {/* Route Polyline */}
            {routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#00BD5F"
                strokeWidth={4}
                lineDashPattern={[1]}
              />
            )}
            
            {/* Start Marker */}
            <Marker 
              coordinate={routeCoordinates[0]}
              title={rideDetails.from}
              description="Pickup Location"
            >
              <View className="bg-[#00BD5F] rounded-full p-2">
                <Ionicons name="radio-button-on" size={12} color="white" />
              </View>
            </Marker>
            
            {/* End Marker */}
            <Marker 
              coordinate={routeCoordinates[routeCoordinates.length - 1]}
              title={rideDetails.to}
              description="Drop-off Location"
            >
              <View className="bg-red-500 rounded-full p-2">
                <Ionicons name="location" size={12} color="white" />
              </View>
            </Marker>
          </MapView>
          
          <Text className="text-md text-gray-600 mt-2 font-[Afacad]">
            Check the trip route on the map 🗺️
          </Text>
        </View>

        {/* Trip Details */}
        <View className="mx-4 mb-4">
          <View className="flex-row items-center mb-4">
            <Ionicons name="location-outline" size={16} color="#00BD5F" />
            <Text className="ml-2 text-sm text-gray-600 font-[Afacad]">
              Route: {rideDetails.from} → {rideDetails.to}
            </Text>
          </View>

          {/* Trip timeline matching RideResultCard structure */}
          <View className="flex-row items-center justify-start">
            {/* Left: Time & Duration */}
            <View className="items-end pr-2">
              <Text className="text-lg font-bold font-[Afacad]">{rideDetails.departureTime}</Text>
              <Text className="text-sm text-gray-500 font-[Afacad]">{rideDetails.duration}</Text>
              <Text className="text-lg font-bold mt-1 font-[Afacad]">{rideDetails.arrivalTime}</Text>
            </View>

            {/* Center: Line & Circles */}
            <View className="items-center mx-2">
              <Ionicons name="ellipse" size={10} color="#00BD5F" />
              <View className="w-px h-12 bg-[#00BD5F]" />
              <Ionicons name="ellipse" size={10} color="#00BD5F" />
            </View>

            {/* Right: Locations with descriptions */}
            <View className="ml-2 flex-1">
              <View className="mb-1">
                <Text className="text-base font-semibold font-[Afacad]" numberOfLines={1}>
                  {rideDetails.from}
                </Text>
                <Text className="text-sm text-gray-500 font-[Afacad]">
                  Pickup location
                </Text>
              </View>
              <View className="h-2" />
              <View className="mt-1">
                <Text className="text-base font-semibold font-[Afacad]" numberOfLines={1}>
                  {rideDetails.to}
                </Text>
                <Text className="text-sm text-gray-500 font-[Afacad]">
                  Drop-off location
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-200 mx-4 mb-4" />

        {/* Driver Info */}
        <View className="mx-4 mb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 rounded-full bg-[#00BD5F] items-center justify-center overflow-hidden">
                <Ionicons name="person" size={24} color="white" />
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text className="text-lg font-semibold font-[Afacad]">
                    {rideDetails.driverName}
                  </Text>
                  <View className="flex-row items-center ml-2">
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text className="text-sm font-medium font-[Afacad] ml-1">
                      {rideDetails.driverRating.toFixed(1)}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm text-gray-500 font-[Afacad]">
                  {vehicleInfo ? 
                    `${vehicleInfo.color} ${vehicleInfo.make} ${vehicleInfo.model} • ${vehicleInfo.plateNumber}` :
                    `Verified driver • ${rideDetails.availableSeats} seats available`
                  }
                </Text>
              </View>
            </View>
            
            {/* Verified badge */}
            <View className="bg-green-100 rounded-full p-2">
              <Ionicons name="checkmark-circle" size={20} color="#00BD5F" />
            </View>
          </View>
          
          {/* Additional info row for verified status and seats */}
          {vehicleInfo && (
            <View className="flex-row items-center mt-2 ml-15">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={12} color="#00BD5F" />
                <Text className="text-xs text-gray-500 font-[Afacad] ml-1">
                  Verified
                </Text>
              </View>
              <Text className="text-xs text-gray-400 font-[Afacad] mx-2">•</Text>
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={12} color="#666" />
                <Text className="text-xs text-gray-500 font-[Afacad] ml-1">
                  {rideDetails.availableSeats} seats available
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-200 mx-4 mb-4" />

        {/* Female Only Badge */}
        {rideDetails.femaleOnly && (
          <View className="mx-4 mb-4">
            <View className="bg-pink-100 px-3 py-2 rounded-lg self-start">
              <Text className="text-pink-600 font-[Afacad] text-sm font-medium">
                👩 Female-only ride
              </Text>
            </View>
          </View>
        )}

        {/* Passenger Count and Price */}
        <View className="mx-4 mb-6">
          <View className="bg-gray-50 rounded-xl p-4">
            <Text className="text-lg font-semibold font-[Afacad] mb-3">Booking Details</Text>
            
            {/* Passenger Counter */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-[Afacad]">Number of passengers:</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg bg-white">
                <Pressable 
                  onPress={decreasePassengers}
                  className="p-3"
                  disabled={passengerCount <= 1}
                >
                  <Ionicons 
                    name="remove" 
                    size={16} 
                    color={passengerCount <= 1 ? "#ccc" : "#00BD5F"} 
                  />
                </Pressable>
                <Text className="text-base font-[Afacad] px-4 min-w-[100px] text-center">
                  {passengerCount} passenger{passengerCount !== 1 ? 's' : ''}
                </Text>
                <Pressable 
                  onPress={increasePassengers}
                  className="p-3"
                  disabled={passengerCount >= rideDetails.availableSeats}
                >
                  <Ionicons 
                    name="add" 
                    size={16} 
                    color={passengerCount >= rideDetails.availableSeats ? "#ccc" : "#00BD5F"} 
                  />
                </Pressable>
              </View>
            </View>

            {/* Price Breakdown */}
            <View className="border-t border-gray-200 pt-3">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-gray-600 font-[Afacad]">
                  Price per seat:
                </Text>
                <Text className="text-sm font-[Afacad]">
                  {rideDetails.price.toFixed(1)} AED
                </Text>
              </View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-gray-600 font-[Afacad]">
                  × {passengerCount} passenger{passengerCount !== 1 ? 's' : ''}:
                </Text>
                <Text className="text-sm font-[Afacad]">
                  {((rideDetails.price || 0) * passengerCount).toFixed(1)} AED
                </Text>
              </View>
              <View className="h-px bg-gray-200 my-2" />
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-bold font-[Afacad]">
                  Total:
                </Text>
                <Text className="text-xl font-bold font-[Afacad] text-[#00BD5F]">
                  {((rideDetails.price || 0) * passengerCount).toFixed(1)} AED
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Book Button */}
      <View className="bg-white px-4 py-4 border-t border-gray-200">
        <Pressable 
          onPress={handleBookRide}
          className="bg-[#00BD5F] py-4 rounded-xl items-center flex-row justify-center"
          disabled={isBooking}
          style={{ opacity: isBooking ? 0.7 : 1 }}
        >
          {isBooking ? (
            <>
              <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
              <Text className="text-white text-lg font-[Afacad] font-semibold">
                Booking...
              </Text>
            </>
          ) : (
            <Text className="text-white text-lg font-[Afacad] font-semibold">
              Book {passengerCount} seat{passengerCount !== 1 ? 's' : ''} for {((rideDetails.price || 0) * passengerCount).toFixed(1)} AED
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default RideDetailsScreen;