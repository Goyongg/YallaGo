// app/(tabs)/home.tsx - Booking requests moved to separate page
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
          
          {/* Upcoming Ride Card - Show for both drivers and passengers */}
          {!upcomingRideLoading && upcomingRide && (
            <UpcomingRideCard
              rideId={upcomingRide.rideId}
              departureTime={upcomingRide.departureTime}
              from={upcomingRide.from}
              to={upcomingRide.to}
              userRole={upcomingRide.userRole}
              status={upcomingRide.status}
              vehicle={upcomingRide.vehicle}
              passengerCount={upcomingRide.passengerCount}
            />
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
              <CreateRideForm userGender={userData.gender} />
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
                userGender={userData.gender}
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