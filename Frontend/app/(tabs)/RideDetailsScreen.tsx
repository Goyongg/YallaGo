// RideDetailsScreen.tsx - ENHANCED: Direct profile fetch for gender verification
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Polyline, Marker } from 'react-native-maps';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { Platform } from 'react-native';
import { BASE_URL } from '@/config';
import useHomeUserData from '../../hooks/useHomeUserData';

const { width } = Dimensions.get('window');

const RideDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [passengerCount, setPassengerCount] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);
  const [userGenderFromProfile, setUserGenderFromProfile] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Get user data from home hook
  const { userData } = useHomeUserData();

  // ENHANCED: Direct profile fetch function
  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      console.log('🔍 Fetching user profile directly for gender verification...');
      
      const user = auth().currentUser;
      if (!user) {
        console.log('❌ No authenticated user found');
        return;
      }

      const idToken = await user.getIdToken();
      const response = await axios.get(`${BASE_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        timeout: 10000,
      });

      console.log('✅ Direct profile fetch response:', response.data);
      
      // Handle different response structures
      let profileData = response.data;
      if (profileData.user) {
        profileData = profileData.user;
      }

      console.log('🔍 Profile data structure:', JSON.stringify(profileData, null, 2));
      console.log('🔍 Gender from direct profile fetch:', profileData.gender);
      
      if (profileData.gender) {
        setUserGenderFromProfile(profileData.gender);
        console.log('✅ Successfully extracted gender from profile:', profileData.gender);
      } else {
        console.log('⚠️ No gender field in profile data');
        setUserGenderFromProfile('prefer_not_to_say');
      }

    } catch (error: any) {
      console.error('❌ Error fetching user profile:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      // Set fallback
      setUserGenderFromProfile('prefer_not_to_say');
    } finally {
      setProfileLoading(false);
    }
  };

  // Fetch profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // ENHANCED: Multi-source gender detection with detailed logging
  const getUserGender = () => {
    console.log('🔍 === GENDER DETECTION DEBUG ===');
    console.log('🔍 Sources available:');
    console.log('🔍 1. userData from home hook:', userData?.gender);
    console.log('🔍 2. userGenderFromProfile (direct fetch):', userGenderFromProfile);
    console.log('🔍 3. params.userGender:', params.userGender);
    
    // Priority 1: Direct profile fetch (most reliable)
    if (userGenderFromProfile && userGenderFromProfile !== 'prefer_not_to_say') {
      console.log('🔍 ✅ Using gender from direct profile fetch:', userGenderFromProfile);
      return userGenderFromProfile;
    }
    
    // Priority 2: User data from home hook
    if (userData?.gender && userData.gender !== 'prefer_not_to_say') {
      console.log('🔍 ✅ Using gender from userData:', userData.gender);
      return userData.gender;
    }
    
    // Priority 3: Params from search (fallback)
    if (params.userGender && params.userGender !== 'prefer_not_to_say') {
      console.log('🔍 ✅ Using gender from params:', params.userGender);
      return params.userGender as string;
    }
    
    // Priority 4: Default fallback
    console.log('🔍 ❌ No reliable gender found, using default');
    return 'prefer_not_to_say';
  };

  const userGender = getUserGender();
  const isFemale = userGender?.toLowerCase() === 'female';

  console.log('🚗 === FINAL GENDER RESULT ===');
  console.log('🚗 Final userGender:', userGender);
  console.log('🚗 isFemale:', isFemale);
  console.log('🚗 profileLoading:', profileLoading);

  // Extract ride parameters
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
    // Additional params
    fromLat: parseFloat(params.fromLat as string) || 25.1972,
    fromLng: parseFloat(params.fromLng as string) || 55.2744,
    toLat: parseFloat(params.toLat as string) || 25.2532,
    toLng: parseFloat(params.toLng as string) || 55.3657,
    // Vehicle information
    vehicleMake: params.vehicleMake as string,
    vehicleModel: params.vehicleModel as string,
    vehicleColor: params.vehicleColor as string,
    vehiclePlateNumber: params.vehiclePlateNumber as string,
    // Driver comment
    driverComment: params.driverComment as string,
    // Parse polyline
    polyline: (() => {
      try {
        return params.polyline ? JSON.parse(params.polyline as string) : [];
      } catch (err) {
        console.warn('Failed to parse polyline:', err);
        return [];
      }
    })(),
  };

  // ENHANCED: Gender check with comprehensive logging
  const canBookRide = (() => {
    console.log('🚗 === BOOKING ELIGIBILITY CHECK ===');
    console.log('🚗 rideDetails.femaleOnly:', rideDetails.femaleOnly);
    console.log('🚗 userGender:', userGender);
    console.log('🚗 isFemale:', isFemale);
    console.log('🚗 profileLoading:', profileLoading);
    
    // If still loading profile, don't allow booking yet
    if (profileLoading) {
      console.log('🚗 ⏳ Profile still loading - booking disabled temporarily');
      return false;
    }
    
    if (!rideDetails.femaleOnly) {
      // Non-female-only ride: anyone can book
      console.log('🚗 ✅ Non-female-only ride - booking allowed');
      return true;
    }
    
    if (rideDetails.femaleOnly && isFemale) {
      // Female-only ride and user is female: can book
      console.log('🚗 ✅ Female-only ride + Female user - booking allowed');
      return true;
    }
    
    // Female-only ride but user is not female: cannot book
    console.log('🚗 ❌ Female-only ride + Non-female user - booking blocked');
    console.log('🚗 Gender breakdown:', {
      rawGender: userGender,
      normalizedGender: userGender?.toLowerCase(),
      isFemaleCheck: userGender?.toLowerCase() === 'female'
    });
    return false;
  })();

  console.log('🚗 === FINAL BOOKING RESULT ===');
  console.log('🚗 canBookRide:', canBookRide);

  const handleBookRide = async () => {
    // Enhanced gender restriction check
    if (!canBookRide) {
      console.log('🚗 Booking blocked - showing detailed gender restriction alert');
      
      let alertMessage = `This is a female-only ride. Only female users can book this ride.\n\n`;
      alertMessage += `Your profile gender: ${userGender}\n`;
      alertMessage += `Required: female\n\n`;
      
      if (profileLoading) {
        alertMessage += `Note: Profile is still loading. Please wait and try again.`;
      } else if (userGender === 'prefer_not_to_say') {
        alertMessage += `Tip: You may need to update your gender in your profile settings.`;
      }
      
      Alert.alert('Booking Restricted', alertMessage, [{ text: 'OK' }]);
      return;
    }

    if (!rideDetails.rideId) {
      Alert.alert('Error', 'Invalid ride information');
      return;
    }

    try {
      setIsBooking(true);

      const token = await auth().currentUser?.getIdToken();
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in to book rides');
        return;
      }

      // Call /payments/create-intent to get clientSecret
      const paymentRes = await fetch(`${BASE_URL}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rideId: rideDetails.rideId,
          amount: rideDetails.price * passengerCount,
        }),
      });

      if (!paymentRes.ok) {
        const errorText = await paymentRes.text();
        throw new Error(`Failed to create payment intent: ${errorText}`);
      }

      const { clientSecret, paymentIntentId } = await paymentRes.json(); // ✅ Now you can safely destructure

      // STEP 2: Navigate to payment screen
      router.push({
        pathname: '/payment',
        params: {
          clientSecret,
          paymentIntentId,
          rideId: rideDetails.rideId,
          seats: passengerCount.toString(),
          price: rideDetails.price.toString(),
          from: rideDetails.from, // 👈
          to: rideDetails.to,     // 👈
        },
      });
    } catch (error: any) {
      console.error('Booking failed:', error);
      
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

  // Create route coordinates
  const routeCoordinates = [
    { latitude: rideDetails.fromLat, longitude: rideDetails.fromLng },
    { latitude: rideDetails.toLat, longitude: rideDetails.toLng },
  ];

  const mapRegion = {
    latitude: (rideDetails.fromLat + rideDetails.toLat) / 2,
    longitude: (rideDetails.fromLng + rideDetails.toLng) / 2,
    latitudeDelta: Math.abs(rideDetails.fromLat - rideDetails.toLat) + 0.05,
    longitudeDelta: Math.abs(rideDetails.fromLng - rideDetails.toLng) + 0.05,
  };

  const formatDate = () => {
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]}`;
  };

  const formatRideDate = () => {
    try {
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
    
    return formatDate();
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
        {/* Profile Loading Indicator */}
        {profileLoading && (
          <View className="mx-4 mb-4 p-3 bg-blue-100 rounded-lg">
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#00BD5F" style={{ marginRight: 8 }} />
              <Text className="text-blue-600 font-[Afacad]">
                Loading your profile...
              </Text>
            </View>
          </View>
        )}

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
            {rideDetails.polyline.length > 1 && (
              <Polyline
                coordinates={rideDetails.polyline}
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

          <View className="flex-row items-center justify-start">
            <View className="items-end pr-2">
              <Text className="text-lg font-bold font-[Afacad]">{rideDetails.departureTime}</Text>
              <Text className="text-sm text-gray-500 font-[Afacad]">{rideDetails.duration}</Text>
              <Text className="text-lg font-bold mt-1 font-[Afacad]">{rideDetails.arrivalTime}</Text>
            </View>

            <View className="items-center mx-2">
              <Ionicons name="ellipse" size={10} color="#00BD5F" />
              <View className="w-px h-12 bg-[#00BD5F]" />
              <Ionicons name="ellipse" size={10} color="#00BD5F" />
            </View>

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
            
            <View className="bg-green-100 rounded-full p-2">
              <Ionicons name="checkmark-circle" size={20} color="#00BD5F" />
            </View>
          </View>
          
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

        {/* Female Only Badge with Enhanced Display */}
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

      {/* Bottom Book Button - ENHANCED with better gender restriction feedback */}
      <View className="bg-white px-4 py-4 border-t border-gray-200">
        {canBookRide ? (
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
        ) : (
          <View className="bg-gray-300 py-4 rounded-xl items-center">
            <View className="flex-row items-center">
              <Ionicons name="woman" size={20} color="#666" style={{ marginRight: 8 }} />
              <Text className="text-gray-600 text-lg font-[Afacad] font-semibold">
                Female-Only Ride - Booking Not Available
              </Text>
            </View>
            <Text className="text-gray-500 text-sm font-[Afacad] mt-1">
              Your profile gender: {userGender} • Required: female
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default RideDetailsScreen;