// app/(tabs)/home.tsx - Updated version
import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, ImageBackground, KeyboardAvoidingView, Platform, View, Text } from 'react-native';
import Header from '../components/Header';
import GreetingCard from '../components/GreetingCard';
import RideSearchForm from '../components/RideSearchForm';
import RecentSearches from '../components/RecentSearches';
import UpcomingRideCard from '../components/UpcomingRideCard'; // Import the new component
import useHomeUserData from '../../hooks/useHomeUserData';
import useRecentSearches from '@/hooks/useRecentSearches';
import useUpcomingRide from '../../hooks/useUpcomingRide'; // Import the new hook
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
  const { userData, loading } = useHomeUserData();
  const { upcomingRide, loading: upcomingRideLoading } = useUpcomingRide(userData?.role || '');
  const params = useGlobalSearchParams();

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

  if (loading || !userData) {
    return null;
  }

  const isDriver = userData.role === 'driver';
  
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
          
          {/* Debug info - remove in production */}
          {/* {__DEV__ && (
            <View className="mx-4 mb-4 p-2 bg-yellow-100 rounded">
              <Text className="text-xs font-[Afacad]">
                Debug: Role={userData.role}, Loading={upcomingRideLoading.toString()}, HasRide={!!upcomingRide}
              </Text>
              {upcomingRide && (
                <Text className="text-xs font-[Afacad]">
                  Ride: {upcomingRide.from} → {upcomingRide.to} at {new Date(upcomingRide.departureTime).toLocaleString()}
                </Text>
              )}
            </View>
          )} */}
          
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