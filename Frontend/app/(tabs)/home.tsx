// app/(tabs)/home.tsx - Fixed to pass data directly to hook
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ScrollView, ImageBackground, KeyboardAvoidingView, Platform, View, Text } from 'react-native';
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

export const unstable_settings = {
  gestureEnabled: false,
  headerBackVisible: false,
};

const Home = () => {
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [passengerCount, setPassengerCount] = useState('');
  const [date, setDate] = useState('');
  const [isCreateMode, setIsCreateMode] = useState(false);

  const { recentSearches } = useRecentSearches();
  
  // Single source of truth for home data
  const { userData, upcomingData, loading, refetch } = useHomeUserData();
  
  // Pass the data directly to the hook instead of calling useHomeUserData again
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

  // Handle switching to search mode when returning from location picker with search context
  useFocusEffect(
    useCallback(() => {
      // If we have location data with search context, switch to search mode
      if (params.context === 'search' && userData?.role === 'driver') {
        setIsCreateMode(false);
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
          
          {/* Debug info - enable this temporarily to see what's happening */}
          {/* {__DEV__ && (
            <View className="mx-4 mb-4 p-3 bg-yellow-100 rounded-lg">
              <Text className="text-sm font-[Afacad] font-bold mb-2">Debug Info:</Text>
              <Text className="text-xs font-[Afacad]">User Role: {userData.role}</Text>
              <Text className="text-xs font-[Afacad]">Upcoming Data Length: {upcomingData?.length || 0}</Text>
              <Text className="text-xs font-[Afacad]">Upcoming Loading: {upcomingRideLoading.toString()}</Text>
              <Text className="text-xs font-[Afacad]">Has Upcoming Ride: {(!!upcomingRide).toString()}</Text>
              <Text className="text-xs font-[Afacad]">Should Show Card: {(!upcomingRideLoading && !!upcomingRide).toString()}</Text>
              {upcomingData && upcomingData.length > 0 && (
                <Text className="text-xs font-[Afacad]">First Item: {JSON.stringify(upcomingData[0], null, 2).substring(0, 100)}...</Text>
              )}
              {upcomingRide && (
                <>
                  <Text className="text-xs font-[Afacad]">Ride ID: {upcomingRide.rideId}</Text>
                  <Text className="text-xs font-[Afacad]">From: {upcomingRide.from}</Text>
                  <Text className="text-xs font-[Afacad]">To: {upcomingRide.to}</Text>
                  <Text className="text-xs font-[Afacad]">User Role: {upcomingRide.userRole}</Text>
                  <Text className="text-xs font-[Afacad]">Time: {new Date(upcomingRide.departureTime).toLocaleString()}</Text>
                </>
              )}
            </View>
          )} */}
          
          {/* Upcoming Ride Card - Show for both drivers and passengers */}
          {!upcomingRideLoading && upcomingRide && (
            <>
              {/* <Text className="text-center text-green-600 font-[Afacad] mb-2">
                ✅ Showing Upcoming Ride Card
              </Text> */}
              <UpcomingRideCard
                rideId={upcomingRide.rideId}
                departureTime={upcomingRide.departureTime}
                from={upcomingRide.from}
                to={upcomingRide.to}
                userRole={upcomingRide.userRole}
                vehicle={upcomingRide.vehicle}
                passengerCount={upcomingRide.passengerCount}
              />
            </>
          )}

          {/* Show message when no upcoming ride */}
          {!upcomingRideLoading && !upcomingRide && (
            <View className="mx-4 mb-4 p-3 bg-gray-100 rounded-lg">
              <Text className="text-center text-gray-600 font-[Afacad]">
                No upcoming rides
              </Text>
            </View>
          )}

          {/* Show loading state for upcoming ride */}
          {upcomingRideLoading && (
            <View className="mx-4 mb-4 p-3 bg-blue-100 rounded-lg">
              <Text className="text-center text-blue-600 font-[Afacad]">
                Loading upcoming rides...
              </Text>
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