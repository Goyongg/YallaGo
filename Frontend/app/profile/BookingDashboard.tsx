import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import UpcomingBookingCard from '../components/UpcomingBookingCard';
import BookingHistoryCard from '../components/BookingHistoryCard';
import useBookingHistory from '../../hooks/useBookingHistory';

const BookingDashboard = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  
  const { bookings, loading, error, refetch } = useBookingHistory();
  
  // Fetch bookings
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (!hasFetchedRef.current) {
      refetch();
      hasFetchedRef.current = true;
    }
  }, []);

  // Filter bookings by status - same logic as your useBookingHistory comments suggest
  const upcomingBookings = bookings.filter(booking => {
    const status = booking.status.toLowerCase();
    return status === 'pending' || status === 'confirmed' || status === 'ongoing';
  });

  const historyBookings = bookings.filter(booking => {
    const status = booking.status.toLowerCase();
    return status === 'completed' || status === 'cancelled' || status === 'no-show';
  });

  // Group bookings by date (works for both upcoming and history)
  const groupBookingsByDate = (bookings: typeof historyBookings) => {
    if (!Array.isArray(bookings)) {
      console.error('📅 Invalid bookings for grouping:', bookings);
      return {};
    }
    
    return bookings.reduce((groups: Record<string, any>, booking) => {
      if (!booking || !booking.date) {
        console.warn('📅 Invalid booking for date grouping:', booking);
        return groups;
      }
      
      try {
        // Ensure we have a valid date string
        const dateStr = typeof booking.date === 'string' ? booking.date : String(booking.date);
        const dateObj = new Date(dateStr);
        
        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
          console.warn('📅 Invalid date object for booking:', booking.id, 'date:', booking.date);
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
          console.warn('📅 Invalid formatted date for booking:', booking.id);
          return groups;
        }
        
        if (!groups[formattedDate]) {
          groups[formattedDate] = {
            bookings: [],
            originalDate: dateObj // Store original date object for sorting
          };
        }
        groups[formattedDate].bookings.push(booking);
      } catch (error) {
        console.error('📅 Error grouping booking by date:', error, booking);
      }
      
      return groups;
    }, {});
  };

  // Sort grouped bookings by date (earliest first for upcoming, latest first for history)
  const sortGroupedBookingsByDate = (groupedBookings: Record<string, any>, isUpcoming: boolean = false) => {
    const entries = Object.entries(groupedBookings);
    
    // Filter out any invalid entries
    const validEntries = entries.filter(([dateLabel, groupData]) => {
      const isValidLabel = dateLabel && typeof dateLabel === 'string' && dateLabel !== 'Invalid Date';
      const isValidGroupData = groupData && groupData.bookings && Array.isArray(groupData.bookings) && groupData.bookings.length > 0;
      
      if (!isValidLabel || !isValidGroupData) {
        console.warn('📅 Filtering out invalid date group:', { dateLabel, bookingsCount: groupData?.bookings?.length });
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
          console.warn('📅 Invalid date objects in sorting:', { dateA, dateB });
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
        console.error('📅 Error sorting dates:', error, { dateA, dateB });
        return 0; // Keep original order on error
      }
    });
    
    // Convert back to the expected format: [dateLabel, bookings[]]
    return validEntries.map(([dateLabel, groupData]) => [dateLabel, groupData.bookings]);
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
            <Text className="text-xl ml-4 font-bold font-[Afacad]">Booking Dashboard</Text>
          </View>
          
          {/* Loading indicator */}
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#00BD5F" />
            <Text className="mt-4 text-gray-500 font-[Afacad]">Loading your bookings...</Text>
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
            <Text className="text-xl ml-4 font-bold font-[Afacad]">Booking Dashboard</Text>
          </View>
          
          {/* Error message */}
          <View className="flex-1 justify-center items-center px-4">
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text className="text-lg font-bold text-gray-800 mt-4 text-center font-[Afacad]">
              Error Loading Bookings
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
          <Text className="text-xl ml-4 font-bold font-[Afacad]">Booking Dashboard</Text>
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
                {tab === 'upcoming' ? `Upcoming Bookings (${upcomingBookings.length})` : `Booking History (${historyBookings.length})`}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Booking List */}
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
            upcomingBookings.length === 0 ? (
              <View className="flex-1 justify-center items-center mt-20">
                <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
                <Text className="text-center text-gray-400 mt-4 font-[Afacad] text-lg">
                  No upcoming bookings
                </Text>
                <Text className="text-center text-gray-400 mt-2 font-[Afacad]">
                  Book a ride to see your upcoming trips
                </Text>
              </View>
            ) : (
              // NEW: Group and sort upcoming bookings by date
              (() => {
                const groupedBookings = groupBookingsByDate(upcomingBookings);
                const sortedEntries = sortGroupedBookingsByDate(groupedBookings, true);
                
                console.log('📅 Grouped upcoming bookings by date:', Object.keys(groupedBookings));
                console.log('📅 Sorted date entries:', sortedEntries.map(([date]) => date));
                
                if (sortedEntries.length === 0) {
                  console.warn('📅 No valid date groups found for upcoming bookings');
                  return (
                    <View className="flex-1 justify-center items-center mt-20">
                      <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
                      <Text className="text-center text-gray-400 mt-4 font-[Afacad] text-lg">
                        No properly dated upcoming bookings
                      </Text>
                      <Text className="text-center text-gray-400 mt-2 font-[Afacad]">
                        Bookings may have invalid date information
                      </Text>
                    </View>
                  );
                }
                
                return sortedEntries.map(([dateLabel, bookings]) => {
                  // Additional safety check for each date group
                  if (!dateLabel || !Array.isArray(bookings) || bookings.length === 0) {
                    console.warn('📅 Skipping invalid date group:', { dateLabel, bookingsCount: bookings?.length });
                    return null;
                  }
                  
                  return (
                    <View key={dateLabel} className="mb-6">
                      <Text className="text-lg font-bold text-gray-800 mb-3 font-[Afacad]">
                        {String(dateLabel)}
                      </Text>
                      {bookings.map((booking, index) => {
                        console.log('📅 About to render upcoming booking:', booking?.id || 'unknown');
                        
                        // Add safety check for each individual booking
                        if (!booking || typeof booking !== 'object') {
                          console.error('📅 Invalid booking object at render index', index, booking);
                          return null;
                        }

                        // CRITICAL: Ensure all required props exist and are safe
                        const safeBooking = {
                          id: String(booking.id || `fallback-${index}`),
                          rideId: String(booking.rideId || ''),
                          from: String(booking.from || 'Unknown'),
                          to: String(booking.to || 'Unknown'),
                          departureTime: String(booking.departureTime || '00:00'),
                          arrivalTime: String(booking.arrivalTime || '00:00'),
                          duration: String(booking.duration || '0m'),
                          totalCost: String(booking.totalCost || '0'),
                          seatsBooked: typeof booking.seatsBooked === 'number' ? booking.seatsBooked : 1,
                          status: String(booking.status || 'pending'),
                          driver: booking.driver || {
                            name: 'Driver',
                            rating: 0.0,
                            phoneNumber: 'N/A'
                          }
                        };

                        console.log(`📅 Rendering booking ${index} with safe props:`, safeBooking);

                        try {
                          return (
                            <UpcomingBookingCard
                              key={safeBooking.id}
                              id={safeBooking.id}
                              rideId={safeBooking.rideId}
                              from={safeBooking.from}
                              to={safeBooking.to}
                              departureTime={safeBooking.departureTime}
                              arrivalTime={safeBooking.arrivalTime}
                              duration={safeBooking.duration}
                              totalCost={safeBooking.totalCost}
                              seatsBooked={safeBooking.seatsBooked}
                              status={safeBooking.status}
                              driver={safeBooking.driver}
                              vehicle={booking.vehicle} // Keep original vehicle if available
                              stopovers={undefined} // Stopovers not available from your backend structure
                            />
                          );
                        } catch (renderError) {
                          console.error(`📅 Error rendering booking ${index}:`, renderError);
                          return null;
                        }
                      }).filter(Boolean)} {/* Remove any null entries */}
                    </View>
                  );
                }).filter(Boolean); // Remove any null date groups
              })()
            )
          ) : (
            // History bookings section - with date grouping
            historyBookings.length === 0 ? (
              <View className="flex-1 justify-center items-center mt-20">
                <Ionicons name="time-outline" size={64} color="#9CA3AF" />
                <Text className="text-center text-gray-400 mt-4 font-[Afacad] text-lg">
                  No booking history
                </Text>
                <Text className="text-center text-gray-400 mt-2 font-[Afacad]">
                  Complete some rides to see your history
                </Text>
              </View>
            ) : (
              sortGroupedBookingsByDate(groupBookingsByDate(historyBookings), false).map(([dateLabel, bookings]) => (
                <View key={dateLabel} className="mb-6">
                  <Text className="text-lg font-bold text-gray-800 mb-3 font-[Afacad]">
                    {String(dateLabel)}
                  </Text>
                  {Array.isArray(bookings) && bookings.map((booking) => (
                    <BookingHistoryCard
                      key={booking.id}
                      id={booking.id}
                      from={booking.from}
                      to={booking.to}
                      departureTime={booking.departureTime}
                      arrivalTime={booking.arrivalTime}
                      duration={booking.duration}
                      totalCost={booking.totalCost}
                      seatsBooked={booking.seatsBooked}
                      status={booking.status}
                      driver={booking.driver}
                    />
                  ))}
                </View>
              ))
            )
          )}
        </ScrollView>
      </View>

      {/* Floating Search Button - Only show for upcoming bookings */}
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
          <Ionicons name="search" size={28} color="white" />
        </Pressable>
      )}
    </View>
  );
};

export default BookingDashboard;