import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Polyline, Marker } from 'react-native-maps';

const { width } = Dimensions.get('window');

const RideDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [passengerCount, setPassengerCount] = useState(1);

  // Extract parameters
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
  };

  // Sample route coordinates (you'll get these from your backend)
  const routeCoordinates = [
    { latitude: 25.1972, longitude: 55.2744 }, // Dubai Mall
    { latitude: 25.2048, longitude: 55.2708 }, // Downtown Dubai
    { latitude: 25.2532, longitude: 55.3657 }, // Dubai Airport
  ];

  const mapRegion = {
    latitude: 25.2048,
    longitude: 55.2708,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  const formatDate = () => {
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]}`;
  };

  const handleBookRide = () => {
    // Navigate to booking confirmation or payment screen
    router.push({
      pathname: '/',
      params: {
        ...params,
        passengerCount: passengerCount.toString(),
        totalPrice: (rideDetails.price * passengerCount).toString(),
      }
    });
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
            {formatDate()}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Map Section */}
        <View className="mx-4 mb-4">
          <MapView
            style={{ width: width - 32, height: 300, borderRadius: 12 }}
            region={mapRegion}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            {/* Route Polyline */}
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#00BD5F"
              strokeWidth={4}
            />
            
            {/* Start Marker */}
            <Marker coordinate={routeCoordinates[0]}>
              <View className="bg-[#00BD5F] rounded-full p-2">
                <Ionicons name="ellipse" size={8} color="white" />
              </View>
            </Marker>
            
            {/* End Marker */}
            <Marker coordinate={routeCoordinates[routeCoordinates.length - 1]}>
              <View className="bg-[#00BD5F] rounded-full p-2">
                <Ionicons name="ellipse" size={8} color="white" />
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
              Route Downtown Dubai
            </Text>
          </View>

          {/* Departure */}
          <View className="flex-row items-center mb-3">
            <Text className="text-lg font-bold font-[Afacad] w-16">
              {rideDetails.departureTime}
            </Text>
            <View className="ml-4">
              <Text className="text-base font-semibold font-[Afacad]">
                {rideDetails.from}
              </Text>
              <Text className="text-sm text-gray-500 font-[Afacad]">
                Address Beach Resort
              </Text>
            </View>
          </View>

          {/* Duration */}
          <View className="flex-row items-center mb-3 ml-16">
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text className="ml-2 text-sm text-gray-600 font-[Afacad]">
              {rideDetails.duration}
            </Text>
          </View>

          {/* Arrival */}
          <View className="flex-row items-center">
            <Text className="text-lg font-bold font-[Afacad] w-16">
              {rideDetails.arrivalTime}
            </Text>
            <View className="ml-4">
              <Text className="text-base font-semibold font-[Afacad]">
                {rideDetails.to}
              </Text>
              <Text className="text-sm text-gray-500 font-[Afacad]">
                Reem Marina AbuDhabi
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-200 mx-4 mb-4" />

        {/* Driver Info */}
        <View className="mx-4 mb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
                <Ionicons name="person" size={24} color="#666" />
              </View>
              <View className="ml-3">
                <View className="flex-row items-center">
                  <Text className="text-lg font-semibold font-[Afacad]">
                    {rideDetails.driverName}
                  </Text>
                  <View className="flex-row items-center ml-2">
                    <Text className="text-sm font-medium font-[Afacad]">
                      {rideDetails.driverRating.toFixed(1)}
                    </Text>
                    <Ionicons name="star" size={14} color="#FFD700" style={{ marginLeft: 2 }} />
                  </View>
                </View>
                <Text className="text-sm text-gray-500 font-[Afacad]">
                  Black Mercedes S-class • B 4546
                </Text>
              </View>
            </View>
            
            {/* Green check badge */}
            <View className="bg-[#00BD5F] rounded-full p-1">
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
          </View>
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-200 mx-4 mb-4" />

        {/* Passenger Count and Price */}
        <View className="mx-4 mb-6">
          <View className="flex-row items-center justify-between">
            {/* Passenger Counter */}
            <View className="flex-row items-center">
              <Text className="text-base font-[Afacad] mr-4">Passengers:</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg">
                <Pressable 
                  onPress={decreasePassengers}
                  className="p-2"
                  disabled={passengerCount <= 1}
                >
                  <Ionicons 
                    name="remove" 
                    size={16} 
                    color={passengerCount <= 1 ? "#ccc" : "#00BD5F"} 
                  />
                </Pressable>
                <Text className="text-base font-[Afacad] px-4">
                  {passengerCount} passenger{passengerCount !== 1 ? 's' : ''}
                </Text>
                <Pressable 
                  onPress={increasePassengers}
                  className="p-2"
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

            {/* Total Price */}
            <Text className="text-xl font-bold font-[Afacad]">
              {(rideDetails.price * passengerCount).toFixed(1)} AED
            </Text>
          </View>
        </View>

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
      </ScrollView>

      {/* Bottom Book Button */}
      <View className="bg-white px-4 py-4 border-t border-gray-200">
        <Pressable 
          onPress={handleBookRide}
          className="bg-[#00BD5F] py-4 rounded-xl items-center"
        >
          <Text className="text-white text-lg font-[Afacad] font-semibold">
            Book a ride
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default RideDetailsScreen;