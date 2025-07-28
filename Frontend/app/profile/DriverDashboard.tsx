import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DriverUpcomingRideCard from '../components/DriverUpcomingRideCard';
import DriverRideHistoryCard from '../components/DriverRideHistoryCard';
import useDriverRides from '../../hooks/useDriverRides';
import { useTranslation } from 'react-i18next';

const DriverDashboard = () => {
  const { t } = useTranslation('profile/DriverDashboard');

  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  
  const { upcomingRides, historyRides, loading, error, refetch } = useDriverRides();
  
  // Fetch driver rides
  const hasFetchedRef = useRef(false);
    useEffect(() => {
    if (!hasFetchedRef.current) {
      refetch();
      hasFetchedRef.current = true;
    }
  }, []);

  // Group rides by date (works for both upcoming and history)
  const groupRidesByDate = (rides: typeof historyRides) => {
    if (!Array.isArray(rides)) {
      console.error('🚗 Invalid rides for grouping:', rides);
      return {};
    }
    
    return rides.reduce((groups: Record<string, any>, ride) => {
      if (!ride || !ride.date) {
        console.warn('🚗 Invalid ride for date grouping:', ride);
        return groups;
      }
      
      try {
        // Ensure we have a valid date string
        const dateStr = typeof ride.date === 'string' ? ride.date : String(ride.date);
        const dateObj = new Date(dateStr);
        
        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
          console.warn('🚗 Invalid date object for ride:', ride.id, 'date:', ride.date);
          return groups;
        }
        
        // Format WITHOUT year for display
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
        
        // Ensure the formatted date is a valid string
        if (!formattedDate || formattedDate === 'Invalid Date') {
          console.warn('🚗 Invalid formatted date for ride:', ride.id);
          return groups;
        }
        
        if (!groups[formattedDate]) {
          groups[formattedDate] = {
            rides: [],
            originalDate: dateObj // Store original date object for sorting
          };
        }
        groups[formattedDate].rides.push(ride);
      } catch (error) {
        console.error('🚗 Error grouping ride by date:', error, ride);
      }
      
      return groups;
    }, {});
  };

  // Sort grouped rides by date (newest first for upcoming, newest first for history)
  const sortGroupedRidesByDate = (groupedRides: Record<string, any>, isUpcoming: boolean = false) => {
    const entries = Object.entries(groupedRides);
    
    // Filter out any invalid entries
    const validEntries = entries.filter(([dateLabel, groupData]) => {
      const isValidLabel = dateLabel && typeof dateLabel === 'string' && dateLabel !== 'Invalid Date';
      const isValidGroupData = groupData && groupData.rides && Array.isArray(groupData.rides) && groupData.rides.length > 0;
      
      if (!isValidLabel || !isValidGroupData) {
        console.warn('🚗 Filtering out invalid date group:', { dateLabel, ridesCount: groupData?.rides?.length });
        return false;
      }
      
      return true;
    });
    
    // Sort by date using the stored original date objects
    validEntries.sort(([dateA, groupDataA], [dateB, groupDataB]) => {
      try {
        const dateObjA = groupDataA.originalDate;
        const dateObjB = groupDataB.originalDate;
        
        // Validate date objects
        if (!dateObjA || !dateObjB || isNaN(dateObjA.getTime()) || isNaN(dateObjB.getTime())) {
          console.warn('🚗 Invalid date objects in sorting:', { dateA, dateB });
          return 0; // Keep original order if dates are invalid
        }
        
        if (isUpcoming) {
          // For upcoming: earliest date first (ascending)
          return dateObjA.getTime() - dateObjB.getTime();
        } else {
          // For history: latest date first (descending)
          return dateObjB.getTime() - dateObjA.getTime();
        }
      } catch (error) {
        console.error('🚗 Error sorting dates:', error, { dateA, dateB });
        return 0; // Keep original order on error
      }
    });
    
    // Convert back to the expected format: [dateLabel, rides[]]
    return validEntries.map(([dateLabel, groupData]) => [dateLabel, groupData.rides]);
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
            <Text className="text-xl ml-4 font-bold font-[Afacad]">{t('title')}</Text>
          </View>
          
          {/* Loading indicator */}
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#00BD5F" />
            <Text className="mt-4 text-gray-500 font-[Afacad]">{t('loadingMessage')}</Text>
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
            <Text className="text-xl ml-4 font-bold font-[Afacad]">{t('title')}</Text>
          </View>
          
          {/* Error message */}
          <View className="flex-1 justify-center items-center px-4">
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text className="text-lg font-bold text-gray-800 mt-4 text-center font-[Afacad]">
              {t('error.title')}
            </Text>
            <Text className="text-gray-600 mt-2 text-center font-[Afacad]">
              {error}
            </Text>
            <Pressable 
              onPress={refetch}
              className="bg-[#00BD5F] px-6 py-3 rounded-lg mt-6"
            >
              <Text className="text-white font-bold font-[Afacad]">{t('error.retryButton')}</Text>
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
          <Text className="text-xl ml-4 font-bold font-[Afacad]">{t('title')}</Text>
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
                {tab === 'upcoming'
                  ? t('tabs.upcoming', { count: upcomingRides.length })
                  : t('tabs.history', { count: historyRides.length })
                }
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
                  {t('empty.upcoming.title')}
                </Text>
                <Text className="text-center text-gray-400 mt-2 font-[Afacad]">
                  {t('empty.upcoming.subtitle')}
                </Text>
              </View>
            ) : (
              // NEW: Group and sort upcoming rides by date
              (() => {
                const groupedRides = groupRidesByDate(upcomingRides);
                const sortedEntries = sortGroupedRidesByDate(groupedRides, true);
                
                console.log('🚗 Grouped upcoming rides by date:', Object.keys(groupedRides));
                console.log('🚗 Sorted date entries:', sortedEntries.map(([date]) => date));
                
                if (sortedEntries.length === 0) {
                  console.warn('🚗 No valid date groups found for upcoming rides');
                  return (
                    <View className="flex-1 justify-center items-center mt-20">
                      <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
                      <Text className="text-center text-gray-400 mt-4 font-[Afacad] text-lg">
                        {t('empty.invalidUpcoming.title')}
                      </Text>
                      <Text className="text-center text-gray-400 mt-2 font-[Afacad]">
                        {t('empty.invalidUpcoming.subtitle')}
                      </Text>
                    </View>
                  );
                }
                
                return sortedEntries.map(([dateLabel, rides]) => {
                  // Additional safety check for each date group
                  if (!dateLabel || !Array.isArray(rides) || rides.length === 0) {
                    console.warn('🚗 Skipping invalid date group:', { dateLabel, ridesCount: rides?.length });
                    return null;
                  }
                  
                  return (
                    <View key={dateLabel} className="mb-6">
                      <Text className="text-lg font-bold text-gray-800 mb-3 font-[Afacad]">
                        {String(dateLabel)}
                      </Text>
                      {rides.map((ride, index) => {
                        console.log('🚗 About to render upcoming ride:', ride?.id || 'unknown');
                        
                        // CRITICAL: Add safety check for each individual ride
                        if (!ride || typeof ride !== 'object') {
                          console.error('🚗 Invalid ride object at render index', index, ride);
                          return null;
                        }

                        // CRITICAL: Ensure all required props exist and are safe
                        const safeRide = {
                          id: String(ride.id || `fallback-${index}`),
                          departureTime: String(ride.departureTime || '00:00'),
                          arrivalTime: String(ride.arrivalTime || '00:00'),
                          duration: String(ride.duration || '0m'),
                          from: String(ride.from || 'Unknown'),
                          to: String(ride.to || 'Unknown'),
                          price: String(ride.price || '0'),
                          availableSeats: typeof ride.availableSeats === 'number' ? ride.availableSeats : 0,
                          bookedSeats: typeof ride.bookedSeats === 'number' ? ride.bookedSeats : 0,
                          hasBookings: Boolean(ride.hasBookings),
                          status: String(ride.status || 'unknown')
                        };

                        // Determine display status safely
                        let displayStatus = 'Upcoming';
                        const statusLower = safeRide.status.toLowerCase();
                        if (statusLower === 'departed') {
                          displayStatus = 'Departed';
                        } else if (statusLower === 'booked') {
                          displayStatus = 'Booked';
                        } else if (statusLower === 'in-progress') {
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
                      }).filter(Boolean)} {/* Remove any null entries */}
                    </View>
                  );
                }).filter(Boolean); // Remove any null date groups
              })()
            )
          ) : (
            // History rides section - remains the same
            historyRides.length === 0 ? (
              <View className="flex-1 justify-center items-center mt-20">
                <Ionicons name="time-outline" size={64} color="#9CA3AF" />
                <Text className="text-center text-gray-400 mt-4 font-[Afacad] text-lg">
                  {t('empty.history.title')}
                </Text>
                <Text className="text-center text-gray-400 mt-2 font-[Afacad]">
                  {t('empty.history.subtitle')}
                </Text>
              </View>
            ) : (
              sortGroupedRidesByDate(groupRidesByDate(historyRides), false).map(([dateLabel, rides]) => (
                <View key={dateLabel} className="mb-6">
                  <Text className="text-lg font-bold text-gray-800 mb-3 font-[Afacad]">
                    {String(dateLabel)}
                  </Text>
                  {Array.isArray(rides) && rides.map((ride) => (
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