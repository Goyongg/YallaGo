import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import auth from '@react-native-firebase/auth';
import { BASE_URL } from '@/config';

const BookingRequests = () => {
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const hasFetchedRef = useRef(false);

  // Fetch booking requests function - updated for new field names
  const fetchBookingRequests = async () => {
    try {
      setLoading(true);
      console.log('📋 Fetching booking requests for driver...');
      
      const user = auth().currentUser;
      if (!user) {
        console.log('📋 No authenticated user');
        return;
      }
      
      const idToken = await user.getIdToken();
      const response = await axios.get(`${BASE_URL}/users/booking-requests`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        timeout: 50000, // 10 second timeout
      });
      
      console.log('📋 Booking requests response:', response.data);
      
      // Handle the response structure - backend returns { bookings: [...] }
      const bookings = response.data?.bookings || [];
      console.log('📋 Extracted bookings:', bookings);
      
      setBookingRequests(bookings);
      
    } catch (err: any) {
      // Handle specific error cases gracefully
      if (err.response?.status === 404) {
        console.log('📋 No booking requests endpoint found or no rides for driver');
        
        // Check if it's because the driver has no rides at all
        if (err.response?.data?.message?.includes('not found') || 
            err.response?.data?.message?.includes('No rides') ||
            err.response?.data?.error === 'Not Found') {
          
          console.log('📋 Driver has no rides yet, setting empty booking requests');
          setBookingRequests([]); // Set empty array instead of showing error
          return; // Don't show error to user
        }
      } else if (err.code === 'ECONNABORTED') {
        console.log('📋 Booking requests fetch timed out');
      } else if (err.code === 'ECONNREFUSED' || err.code === 'NETWORK_ERROR') {
        console.log('📋 Cannot connect to server for booking requests');
      } else if (err.response?.status >= 500) {
        console.log('📋 Server error when fetching booking requests');
      } else {
        // Only show console.error for unexpected errors
        console.error('📋 Unexpected error fetching booking requests:', err.message || err);
      }
      
      // For any errors, just set empty array and don't show error to user
      // This is non-critical functionality
      console.log('📋 Setting empty booking requests due to error');
      setBookingRequests([]);
      
    } finally {
      setLoading(false);
    }
  };

  const acceptBooking = async (bookingId: string, passengerName: string) => {
    try {
      const user = auth().currentUser;
      if (!user) return;
      
      const idToken = await user.getIdToken();
      
      console.log('🔄 Attempting to accept booking:', bookingId);
      console.log('🔄 Using URL:', `${BASE_URL}/users/accept-booking?bookingId=${bookingId}`);
      
      const response = await axios.patch(
        `${BASE_URL}/users/accept-booking?bookingId=${bookingId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      
      console.log('✅ Accept booking response:', response.data);
      Alert.alert('Success', `Booking from ${passengerName} accepted!`);
      fetchBookingRequests(); // Refresh the list
    } catch (err: any) {
      console.error('❌ Error accepting booking:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error config URL:', err.config?.url);
      
      // More detailed error message
      let errorMessage = 'Failed to accept booking';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 404) {
        errorMessage = 'Booking not found or endpoint unavailable';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied - you may not have permission to accept this booking';
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid booking request';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const declineBooking = async (bookingId: string) => {
    try {
      const user = auth().currentUser;
      if (!user) return;
      
      const idToken = await user.getIdToken();
      
      console.log('🔄 Attempting to decline booking:', bookingId);
      
      const response = await axios.patch(
        `${BASE_URL}/users/decline-booking?bookingId=${bookingId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      
      console.log('✅ Decline booking response:', response.data);
      Alert.alert('Success', 'Booking declined');
      fetchBookingRequests(); // Refresh the list
    } catch (err: any) {
      console.error('❌ Error declining booking:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      
      // More detailed error message
      let errorMessage = 'Failed to decline booking';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 404) {
        errorMessage = 'Booking not found or endpoint unavailable';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookingRequests();
    setRefreshing(false);
  };

  // Initial fetch
  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchBookingRequests();
      hasFetchedRef.current = true;
    }
  }, []);

  return (
    <View className="flex-1 bg-white px-6 pt-[70px]">
      <View className="w-[95%] self-center flex-1">
        {/* Back Arrow + Title */}
        <View className="flex-row items-center mb-6">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <Text className="text-xl ml-4 font-bold font-[Afacad]">Booking Requests</Text>
        </View>

        {/* Subtitle */}
        <Text className="text-gray-600 mb-4 font-[Afacad]">
          Manage passenger booking requests for your rides
        </Text>

        {/* Content */}
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
          {/* Loading state */}
          {loading && !refreshing && (
            <View className="flex-1 justify-center items-center mt-20">
              <ActivityIndicator size="large" color="#00BD5F" />
              <Text className="mt-4 text-gray-500 font-[Afacad]">Loading booking requests...</Text>
            </View>
          )}

          {/* Booking Requests List */}
          {!loading && bookingRequests.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold font-[Afacad] text-black mb-4">
                Pending Requests ({bookingRequests.length})
              </Text>
              
              {bookingRequests.map((request, index) => {
                // DEBUG: Log the request structure to see what fields are available
                console.log('📋 Request object structure:', JSON.stringify(request, null, 2));
                console.log('📋 Available keys:', Object.keys(request));
                console.log('📋 bookingId value:', request.bookingId);
                
                return (
                <View key={request.bookingId || request.id || index} className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-[Afacad] font-semibold text-black">
                        {request.name || 'Passenger'}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text className="text-sm text-gray-600 font-[Afacad] ml-1">
                          {request.averageRating?.toFixed(1) || '0.0'}
                        </Text>
                        <Text className="text-sm text-gray-600 font-[Afacad] ml-3">
                          • {request.seatsBooked || 1} seat{(request.seatsBooked || 1) > 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* UPDATED: Use startLocation and endLocation instead of pickup/dropoff */}
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text className="text-sm text-gray-600 font-[Afacad] ml-2 flex-1" numberOfLines={1}>
                      {request.startLocation || 'Unknown pickup'} → {request.endLocation || 'Unknown destination'}
                    </Text>
                  </View>
                  
                  {/* Additional info if available */}
                  {request.phoneNumber && (
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="call-outline" size={16} color="#666" />
                      <Text className="text-sm text-gray-600 font-[Afacad] ml-2">
                        {request.phoneNumber}
                      </Text>
                    </View>
                  )}

                  {/* Show booking price if available */}
                  {request.pricePerSeat && (
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="cash-outline" size={16} color="#666" />
                      <Text className="text-sm text-gray-600 font-[Afacad] ml-2">
                        {request.pricePerSeat} AED per seat • Total: {(request.pricePerSeat * (request.seatsBooked || 1)).toFixed(0)} AED
                      </Text>
                    </View>
                  )}

                  {/* Show booking status if available */}
                  {request.status && (
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="information-circle-outline" size={16} color="#666" />
                      <Text className="text-sm text-gray-600 font-[Afacad] ml-2 capitalize">
                        Status: {request.status}
                      </Text>
                    </View>
                  )}
                  
                  <View className="flex-row justify-end mt-3 space-x-3">
                    <Pressable
                      onPress={() => declineBooking(request.bookingId || request.id)}
                      className="bg-red-500 px-5 py-3 rounded-lg"
                    >
                      <Text className="text-white font-[Afacad] font-medium">Decline</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => acceptBooking(request.bookingId || request.id, request.name || 'Passenger')}
                      className="bg-green-500 px-5 py-3 rounded-lg ml-3"
                    >
                      <Text className="text-white font-[Afacad] font-medium">Accept</Text>
                    </Pressable>
                  </View>
                </View>
              );
              })}
            </View>
          )}

          {/* Empty state */}
          {!loading && bookingRequests.length === 0 && (
            <View className="flex-1 justify-center items-center mt-20">
              <Ionicons name="clipboard-outline" size={64} color="#9CA3AF" />
              <Text className="text-center text-gray-400 mt-4 font-[Afacad] text-lg">
                No booking requests
              </Text>
              <Text className="text-center text-gray-400 mt-2 font-[Afacad]">
                When passengers request to book your rides, they'll appear here
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default BookingRequests;