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

  // Group history bookings by date - same as DriverDashboard
  const groupBookingsByDate = (bookings: typeof historyBookings) => {
    if (!Array.isArray(bookings)) {
      console.error('📅 Invalid bookings for grouping:', bookings);
      return {};
    }
    
    return bookings.reduce((groups: Record<string, typeof bookings>, booking) => {
      if (!booking || !booking.date) {
        console.warn('📅 Invalid booking for date grouping:', booking);
        return groups;
      }
      
      try {
        const date = new Date(booking.date).toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
        
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(booking);
      } catch (error) {
        console.error('📅 Error grouping booking by date:', error, booking);
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
              upcomingBookings.map((booking) => (
                <UpcomingBookingCard
                  key={booking.id}
                  id={booking.id}
                  rideId={booking.rideId}
                  from={booking.from}
                  to={booking.to}
                  departureTime={booking.departureTime}
                  arrivalTime={booking.arrivalTime}
                  duration={booking.duration}
                  totalCost={booking.totalCost}
                  seatsBooked={booking.seatsBooked}
                  status={booking.status}
                  driver={booking.driver}
                  vehicle={undefined} // Vehicle info not available from your backend structure
                  stopovers={undefined} // Stopovers not available from your backend structure
                />
              ))
            )
          ) : (
            // History bookings section
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
              Object.entries(groupBookingsByDate(historyBookings)).map(([dateLabel, bookings]) => (
                <View key={dateLabel} className="mb-6">
                  <Text className="text-lg font-bold text-gray-800 mb-3 font-[Afacad]">
                    {dateLabel}
                  </Text>
                  {bookings.map((booking) => (
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