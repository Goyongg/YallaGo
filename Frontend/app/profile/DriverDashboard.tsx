import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DriverUpcomingRideCard from '../components/DriverUpcomingRideCard'; // Your enhanced existing card
import DriverRideHistoryCard from '../components/DriverRideHistoryCard'; // Your enhanced existing card
import useDriverRides from '../../hooks/useDriverRides';

const DriverDashboard = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  
  const { upcomingRides, historyRides, loading, error, refetch } = useDriverRides();

  // Group history rides by date
  const groupRidesByDate = (rides: typeof historyRides) => {
    if (!Array.isArray(rides)) {
      console.error('🚗 Invalid rides for grouping:', rides);
      return {};
    }
    
    return rides.reduce((groups: Record<string, typeof rides>, ride) => {
      if (!ride || !ride.date) {
        console.warn('🚗 Invalid ride for date grouping:', ride);
        return groups;
      }
      
      try {
        const date = new Date(ride.date).toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
        
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(ride);
      } catch (error) {
        console.error('🚗 Error grouping ride by date:', error, ride);
      }
      
      return groups;
    }, {});
  };

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-white px-6 pt-[70px]">
        <View className="w-[95%] self-center flex-1">
          {/* Back Arrow + Title */}
          <View className="flex-row items-center mb-6">
            <Pressable onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>
            <Text className="text-xl ml-4 font-bold font-[Afacad]">Driver Dashboard</Text>
          </View>
          
          {/* Loading indicator */}
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#00BD5F" />
            <Text className="mt-4 text-gray-500 font-[Afacad]">Loading your rides...</Text>
          </View>
        </View>
      </View>
    );
  }

  // Error state
  if (error && !loading) {
    return (
      <View className="flex-1 bg-white px-6 pt-[70px]">
        <View className="w-[95%] self-center flex-1">
          {/* Back Arrow + Title */}
          <View className="flex-row items-center mb-6">
            <Pressable onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>
            <Text className="text-xl ml-4 font-bold font-[Afacad]">Driver Dashboard</Text>
          </View>
          
          {/* Error message */}
          <View className="flex-1 justify-center items-center px-4">
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text className="text-lg font-bold text-gray-800 mt-4 text-center font-[Afacad]">
              Error Loading Rides
            </Text>
            <Text className="text-gray-600 mt-2 text-center font-[Afacad]">
              {error}
            </Text>
            <Pressable 
              onPress={refetch}
              className="bg-[#00BD5F] px-6 py-3 rounded-lg mt-6"
            >
              <Text className="text-white font-bold font-[Afacad]">Try Again</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-6 pt-[70px]">
      <View className="w-[95%] self-center flex-1">
        {/* Back Arrow + Title */}
        <View className="flex-row items-center mb-6">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <Text className="text-xl ml-4 font-bold font-[Afacad]">Driver Dashboard</Text>
        </View>

        {/* Tabs */}
        <View className="flex-row mb-4">
          {(['upcoming', 'history'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 border-b-2 items-center ${
                activeTab === tab ? 'border-[#00BD5F] bg-gray-100 rounded-t-md' : 'border-gray-300'
              }`}
            >
              <Text
                className={`font-[Afacad] text-lg ${
                  activeTab === tab ? 'text-[#00BD5F]' : 'text-gray-400'
                }`}
              >
                {tab === 'upcoming' ? `Upcoming Rides (${upcomingRides.length})` : `Ride History (${historyRides.length})`}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Ride List */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#00BD5F']}
              tintColor="#00BD5F"
            />
          }
        >
          {activeTab === 'upcoming' ? (
            upcomingRides.length === 0 ? (
              <View className="flex-1 justify-center items-center mt-20">
                <Ionicons name="car-outline" size={64} color="#9CA3AF" />
                <Text className="text-center text-gray-400 mt-4 font-[Afacad] text-lg">
                  No upcoming rides
                </Text>
                <Text className="text-center text-gray-400 mt-2 font-[Afacad]">
                  Create a new ride to get started
                </Text>
              </View>
            ) : (
              (() => {
                console.log('🚗 About to render upcoming rides:', upcomingRides.length);
                
                // Debug each ride before rendering
                upcomingRides.forEach((ride, index) => {
                  console.log(`🚗 Ride ${index} props:`, {
                    id: ride.id,
                    from: ride.from,
                    to: ride.to,
                    price: ride.price,
                    status: ride.status,
                    departureTime: ride.departureTime,
                    arrivalTime: ride.arrivalTime,
                    duration: ride.duration,
                    availableSeats: ride.availableSeats,
                    bookedSeats: ride.bookedSeats,
                    hasBookings: ride.hasBookings
                  });
                });

                return upcomingRides.map((ride, index) => {
                  // CRITICAL: Add safety check for each individual ride
                  if (!ride || typeof ride !== 'object') {
                    console.error('🚗 Invalid ride object at render index', index, ride);
                    return null;
                  }

                  // CRITICAL: Ensure all required props exist and are safe
                  const safeRide = {
                    id: ride.id || `fallback-${index}`,
                    departureTime: ride.departureTime || '00:00',
                    arrivalTime: ride.arrivalTime || '00:00',
                    duration: ride.duration || '0m',
                    from: ride.from || 'Unknown',
                    to: ride.to || 'Unknown',
                    price: ride.price || '0',
                    availableSeats: typeof ride.availableSeats === 'number' ? ride.availableSeats : 0,
                    bookedSeats: typeof ride.bookedSeats === 'number' ? ride.bookedSeats : 0,
                    hasBookings: Boolean(ride.hasBookings),
                    status: ride.status || 'unknown'
                  };

                  // Determine display status safely
                  let displayStatus = 'Upcoming';
                  if (safeRide.status === 'departed') {
                    displayStatus = 'Departed';
                  } else if (safeRide.status === 'booked') {
                    displayStatus = 'Booked';
                  } else if (safeRide.status === 'in-progress') {
                    displayStatus = 'Upcoming';
                  }

                  console.log(`🚗 Rendering ride ${index} with safe props:`, safeRide);

                  try {
                    return (
                      <DriverUpcomingRideCard
                        key={safeRide.id}
                        id={safeRide.id}
                        departureTime={safeRide.departureTime}
                        arrivalTime={safeRide.arrivalTime}
                        duration={safeRide.duration}
                        from={safeRide.from}
                        to={safeRide.to}
                        price={safeRide.price}
                        availableSeats={safeRide.availableSeats}
                        status={displayStatus}
                        bookedSeats={safeRide.bookedSeats}
                        hasBookings={safeRide.hasBookings}
                        onRideUpdated={refetch}
                      />
                    );
                  } catch (renderError) {
                    console.error(`🚗 Error rendering ride ${index}:`, renderError);
                    return null;
                  }
                }).filter(Boolean); // Remove any null entries
              })()
            )
          ) : (
            // History rides section remains the same...
            historyRides.length === 0 ? (
              <View className="flex-1 justify-center items-center mt-20">
                <Ionicons name="time-outline" size={64} color="#9CA3AF" />
                <Text className="text-center text-gray-400 mt-4 font-[Afacad] text-lg">
                  No ride history
                </Text>
                <Text className="text-center text-gray-400 mt-2 font-[Afacad]">
                  Complete some rides to see your history
                </Text>
              </View>
            ) : (
              Object.entries(groupRidesByDate(historyRides)).map(([dateLabel, rides]) => (
                <View key={dateLabel} className="mb-6">
                  <Text className="text-lg font-bold text-gray-800 mb-3 font-[Afacad]">
                    {dateLabel}
                  </Text>
                  {rides.map((ride) => (
                    <DriverRideHistoryCard
                      key={ride.id}
                      id={ride.id}
                      from={ride.from}
                      to={ride.to}
                      departureTime={ride.departureTime}
                      arrivalTime={ride.arrivalTime}
                      duration={ride.duration}
                      price={ride.price}
                      bookedSeats={ride.bookedSeats}
                      status={ride.status}
                    />
                  ))}
                </View>
              ))
            )
          )}
        </ScrollView>
      </View>

      {/* Floating Add Button - Only show for upcoming rides */}
      {activeTab === 'upcoming' && (
        <Pressable
          onPress={() => router.push('/(tabs)/home')}
          className="absolute bottom-8 right-8 bg-[#00BD5F] rounded-full p-4 shadow-lg"
          style={{
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <Ionicons name="add" size={28} color="white" />
        </Pressable>
      )}
    </View>
  );
};

export default DriverDashboard;