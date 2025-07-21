// app/(tabs)/home.tsx - Fixed hooks order issue
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ScrollView, ImageBackground, KeyboardAvoidingView, Platform, View, Text, Alert, Pressable, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import GreetingCard from '../components/GreetingCard';
import RideSearchForm from '../components/RideSearchForm';
import RecentSearches from '../components/RecentSearches';
import UpcomingRideCard from '../components/UpcomingRideCard';
import useHomeUserData from '../../hooks/useHomeUserData';
import useRecentSearches from '@/hooks/useRecentSearches';
import useUpcomingRide from '../../hooks/useUpcomingRide';
import CreateRideForm from '../components/CreateRideForm';
import { useGlobalSearchParams, useFocusEffect } from 'expo-router';
import axios from 'axios';
import auth from '@react-native-firebase/auth';
import { BASE_URL } from '@/config';
import { Ionicons } from '@expo/vector-icons';

export const unstable_settings = {
  gestureEnabled: false,
  headerBackVisible: false,
};

const Home = () => {
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [passengerCount, setPassengerCount] = useState('');
  const [date, setDate] = useState('');
  const [isCreateMode, setIsCreateMode] = useState(false);
  
  // Add booking requests state - ALWAYS declare hooks at top level
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [loadingBookingRequests, setLoadingBookingRequests] = useState(false);

  const { recentSearches } = useRecentSearches();
  const { userData, upcomingData, loading, refetch } = useHomeUserData();
  const { upcomingRide, loading: upcomingRideLoading } = useUpcomingRide(userData, upcomingData, loading);
  
  const params = useGlobalSearchParams();
  const hasFetchedRef = useRef(false);

  // Debug logging
  console.log('🏠 Home component render:');
  console.log('🏠 - userData:', userData);
  console.log('🏠 - upcomingData:', upcomingData);
  console.log('🏠 - loading:', loading);
  console.log('🏠 - upcomingRideLoading:', upcomingRideLoading);
  console.log('🏠 - upcomingRide:', upcomingRide);

  // Define functions BEFORE using them in hooks
  const fetchBookingRequests = async () => {
    // Only fetch if user is a driver
    if (!userData || userData.role !== 'driver') return;
    
    try {
      setLoadingBookingRequests(true);
      const user = auth().currentUser;
      if (!user) return;
      
      const idToken = await user.getIdToken();
      const response = await axios.get(`${BASE_URL}/users/booking-requests`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      
      console.log('📋 Booking requests:', response.data);
      setBookingRequests(response.data.bookings || []);
    } catch (err) {
      console.error('Error fetching booking requests:', err);
    } finally {
      setLoadingBookingRequests(false);
    }
  };

  const acceptBooking = async (bookingId: string, passengerName: string) => {
    try {
      const user = auth().currentUser;
      if (!user) return;
      
      const idToken = await user.getIdToken();
      const response = await axios.patch(
        `${BASE_URL}/users/accept-booking?bookingId=${bookingId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      
      Alert.alert('Success', `Booking from ${passengerName} accepted!`);
      fetchBookingRequests(); // Refresh the list
      refetch(); // Refresh home data
    } catch (err) {
      console.error('Error accepting booking:', err);
      Alert.alert('Error', 'Failed to accept booking');
    }
  };

  const declineBooking = async (bookingId: string) => {
    try {
      const user = auth().currentUser;
      if (!user) return;
      
      const idToken = await user.getIdToken();
      const response = await axios.patch(
        `${BASE_URL}/users/decline-booking?bookingId=${bookingId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      
      Alert.alert('Success', 'Booking declined');
      fetchBookingRequests(); // Refresh the list
    } catch (err) {
      console.error('Error declining booking:', err);
      Alert.alert('Error', 'Failed to decline booking');
    }
  };

  useEffect(() => {
    if (!hasFetchedRef.current) {
      console.log('🏠 Initial fetch triggered');
      refetch();
      hasFetchedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (userData?.role === 'driver') {
      setIsCreateMode(true); // Default to create mode for drivers
    }
  }, [userData]);

  // Fetch booking requests when driver data is loaded
  useEffect(() => {
    if (userData?.role === 'driver' && !loading) {
      fetchBookingRequests();
    }
  }, [userData?.role, loading]);

  // Handle switching to search mode when returning from location picker with search context
  useFocusEffect(
    useCallback(() => {
      // If we have location data with search context, switch to search mode
      if (params.context === 'search' && userData?.role === 'driver') {
        setIsCreateMode(false);
      }
      
      // Refresh booking requests for drivers when screen is focused
      if (userData?.role === 'driver' && hasFetchedRef.current) {
        fetchBookingRequests();
      }
    }, [params.context, userData?.role])
  );

  // Wait for userData to load before rendering
  if (loading || !userData) {
    console.log('🏠 Still loading or no userData');
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="font-[Afacad]">Loading...</Text>
      </View>
    );
  }

  const isDriver = userData.role === 'driver';
  
  console.log('🏠 Rendering home with:');
  console.log('🏠 - isDriver:', isDriver);
  console.log('🏠 - should show upcoming ride:', !upcomingRideLoading && !!upcomingRide);
  
  return (
    <ImageBackground
      source={require('../../assets/images/background_image_1.png')}
      resizeMode="cover"
      className="flex-1"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView className="flex-1 pt-[70px]" keyboardShouldPersistTaps="handled">
          <Header 
            userName={userData.name} 
            rating={userData.averageRating}
            isDriver={isDriver}
            isCreateMode={isCreateMode}
            toggleCreateMode={() => setIsCreateMode(prev => !prev)}
            userRole={userData.role}
          />
          
          {/* Upcoming Ride Card - Show for both drivers and passengers */}
          {!upcomingRideLoading && upcomingRide && (
            <UpcomingRideCard
              rideId={upcomingRide.rideId}
              departureTime={upcomingRide.departureTime}
              from={upcomingRide.from}
              to={upcomingRide.to}
              userRole={upcomingRide.userRole}
              vehicle={upcomingRide.vehicle}
              passengerCount={upcomingRide.passengerCount}
            />
          )}

          {/* Show message when no upcoming ride */}
          {/* {!upcomingRideLoading && !upcomingRide && (
            <View className="mx-4 mb-4 p-3 bg-gray-100 rounded-lg">
              <Text className="text-center text-gray-600 font-[Afacad]">
                No upcoming rides
              </Text>
            </View>
          )} */}

          {/* Show loading state for upcoming ride */}
          {upcomingRideLoading && (
            <View className="mx-4 mb-4 p-3 bg-blue-100 rounded-lg">
              <Text className="text-center text-blue-600 font-[Afacad]">
                Loading upcoming rides...
              </Text>
            </View>
          )}

          {/* Pending Booking Requests for Drivers */}
          {isDriver && bookingRequests.length > 0 && (
            <View className="mx-4 mb-6 bg-white rounded-xl p-4 shadow-md border border-gray-200">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold font-[Afacad] text-black">
                  Pending Booking Requests ({bookingRequests.length})
                </Text>
                {loadingBookingRequests && (
                  <ActivityIndicator size="small" color="#00BD5F" />
                )}
              </View>
              
              {bookingRequests.map((request, index) => (
                <View key={index} className="bg-gray-50 p-3 rounded-lg mb-2">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-base font-[Afacad] font-semibold text-black">
                        {request.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text className="text-sm text-gray-600 font-[Afacad] ml-1">
                          {request.averageRating?.toFixed(1) || '0.0'}
                        </Text>
                        <Text className="text-sm text-gray-600 font-[Afacad] ml-3">
                          • {request.seatsBooked} seat{request.seatsBooked > 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text className="text-sm text-gray-600 font-[Afacad] ml-1 flex-1" numberOfLines={1}>
                      {request.pickupPoint} → {request.dropOffPoint}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-end mt-3 space-x-2">
                    <Pressable
                      onPress={() => declineBooking(request.bookingId)}
                      className="bg-red-500 px-4 py-2 rounded-lg"
                    >
                      <Text className="text-white font-[Afacad] font-medium">Decline</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => acceptBooking(request.bookingId, request.name)}
                      className="bg-green-500 px-4 py-2 rounded-lg ml-2"
                    >
                      <Text className="text-white font-[Afacad] font-medium">Accept</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {isDriver && isCreateMode ? (
            <View className="px-4 mt-4">
              <CreateRideForm />
            </View>
          ) : (
            <>
              <GreetingCard userName={userData.name} ecoPoints={userData.ecoPoints} />
              <RideSearchForm
                femaleOnly={femaleOnly}
                setFemaleOnly={setFemaleOnly}
                passengerCount={passengerCount}
                setPassengerCount={setPassengerCount}
                date={date}
                setDate={setDate}
              />
              <RecentSearches recentSearches={recentSearches} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default Home;