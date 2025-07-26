// app/booking-details.tsx - Enhanced with comments and stopovers
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  SafeAreaView, 
  ScrollView, 
  Alert,
  Linking,
  ActivityIndicator 
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { BASE_URL } from '@/config';

interface BookingData {
  bookingId: string;
  rideId: string;
  startLocation: string;
  endLocation: string;
  departureTime: any; // Firestore timestamp
  durationSeconds: number;
  pricePerSeat: number;
  seatsBooked: number;
  status: string;
  
  // Driver info
  name?: string;
  phoneNumber?: string;
  averageRating?: number;
  
  // Vehicle info
  make?: string;
  model?: string;
  color?: string;
  plateNumber?: string;
  
  // Location coordinates
  coordinates?: {
    _latitude: number;
    _longitude: number;
  };
  endGeo?: {
    _latitude: number;
    _longitude: number;
  };
  
  // Additional fields
  distanceMeters?: number;
  comments?: string;
  waypoints?: any[];
  polyline?: string;
}

const BookingDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  
  const { bookingId } = params;
  
  // Default coordinates (Dubai area)
  const defaultCoordinates = [
    { latitude: 25.2048, longitude: 55.2708 }, // Start
    { latitude: 25.1972, longitude: 55.2744 }, // End
  ];
  
  const [routeCoordinates, setRouteCoordinates] = useState(defaultCoordinates);
  const [polylineCoords, setPolylineCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  
  // Add stopovers state
  const [stopovers, setStopovers] = useState<
    { id: string; location: string; coordinates: { latitude: number; longitude: number } }[]
  >([]);
  
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Safety utility functions
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  const safeNumber = (value: any): number => {
    if (value === null || value === undefined || isNaN(Number(value))) return 0;
    return Number(value);
  };

  // Format time from Firestore timestamp
  const formatTime = (timestamp: any): string => {
    try {
      if (!timestamp) return '00:00';
      
      let date: Date;
      if (timestamp && typeof timestamp._seconds === 'number') {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp && typeof timestamp.seconds === 'number') {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp);
      }
      
      if (!date || isNaN(date.getTime())) return '00:00';
      
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '00:00';
    }
  };

  // Format duration from seconds
  const formatDuration = (seconds: number): string => {
    try {
      const safeSeconds = safeNumber(seconds);
      const hours = Math.floor(safeSeconds / 3600);
      const minutes = Math.floor((safeSeconds % 3600) / 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    } catch (error) {
      console.error('Error formatting duration:', error);
      return '0m';
    }
  };

  // Calculate arrival time
  const calculateArrivalTime = (departureTimestamp: any, durationSeconds: number): string => {
    try {
      if (!departureTimestamp) return '00:00';
      
      const safeDurationSeconds = safeNumber(durationSeconds);
      
      let departureDate: Date;
      if (departureTimestamp && typeof departureTimestamp._seconds === 'number') {
        departureDate = new Date(departureTimestamp._seconds * 1000);
      } else if (departureTimestamp && typeof departureTimestamp.seconds === 'number') {
        departureDate = new Date(departureTimestamp.seconds * 1000);
      } else if (departureTimestamp && typeof departureTimestamp.toDate === 'function') {
        departureDate = departureTimestamp.toDate();
      } else {
        departureDate = new Date(departureTimestamp);
      }
      
      if (!departureDate || isNaN(departureDate.getTime())) return '00:00';
      
      const arrivalDate = new Date(departureDate.getTime() + (safeDurationSeconds * 1000));
      
      if (isNaN(arrivalDate.getTime())) return '00:00';
      
      return arrivalDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error calculating arrival time:', error);
      return '00:00';
    }
  };

  // Process coordinates and polyline for map display
  const processCoordinatesAndPolyline = (booking: BookingData) => {
    console.log('🗺️ Processing booking coordinates:', booking);
    
    // Process coordinates if available
    if (booking.coordinates && booking.endGeo) {
      const startLat = booking.coordinates._latitude;
      const startLng = booking.coordinates._longitude;
      const endLat = booking.endGeo._latitude;
      const endLng = booking.endGeo._longitude;
      
      if (typeof startLat === 'number' && typeof startLng === 'number' && 
          typeof endLat === 'number' && typeof endLng === 'number') {
        
        const startCoords = { latitude: startLat, longitude: startLng };
        const endCoords = { latitude: endLat, longitude: endLng };
        
        console.log('📍 Route coordinates set:', [startCoords, endCoords]);
        setRouteCoordinates([startCoords, endCoords]);
        setPolylineCoords([startCoords, endCoords]); // Simple line first
      } else {
        console.warn('🗺️ Invalid coordinates, using defaults');
        setRouteCoordinates(defaultCoordinates);
        setPolylineCoords(defaultCoordinates);
      }
    } else {
      console.warn('🗺️ No coordinates found, using defaults');
      setRouteCoordinates(defaultCoordinates);
      setPolylineCoords(defaultCoordinates);
    }
    
    // Parse polyline if available
    if (booking.polyline) {  
      try {
        console.log('🗺️ Parsing polyline...');
        const parsed = JSON.parse(booking.polyline);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('📍 Polyline coordinates set:', parsed.length, 'points');
          setPolylineCoords(parsed);
        } else {
          console.warn('🗺️ Parsed polyline is not a valid array');
        }
      } catch (err) {
        console.warn('🗺️ Failed to parse polyline:', err);
      }
    } else {
      console.log('🗺️ No polyline data available');
    }
  };

  // NEW: Process stopovers from waypoints
  const processStopovers = (waypoints: any[]) => {
    console.log('🛑 Processing waypoints:', waypoints);
    
    if (Array.isArray(waypoints) && waypoints.length > 0) {
      const formattedStopovers = waypoints.map((wp: any, index: number) => ({
        id: `stopover-${index}`,
        location: wp.label || `Stopover ${index + 1}`,
        coordinates: {
          latitude: wp.coordinates?.lat ?? wp.coordinates?._latitude ?? 0,
          longitude: wp.coordinates?.lng ?? wp.coordinates?._longitude ?? 0,
        },
      }));
      setStopovers(formattedStopovers);
      console.log('🛑 Stopovers parsed:', formattedStopovers);
    } else {
      setStopovers([]);
      console.log('🛑 No stopovers to process');
    }
  };

  // Fetch booking details from /bookings endpoint
  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = auth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const idToken = await user.getIdToken();
      console.log('📋 Fetching booking details from /bookings endpoint...');
      
      const response = await axios.get(`${BASE_URL}/bookings`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        timeout: 10000,
      });

      console.log('📋 All bookings from backend:', response.data);
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response from bookings endpoint');
      }

      // Find the specific booking by bookingId
      const targetBooking = response.data.find((booking: any) => 
        booking.bookingId === bookingId
      );

      if (!targetBooking) {
        throw new Error(`Booking with ID ${bookingId} not found`);
      }

      console.log('📋 Found target booking:', targetBooking);
      
      setBookingData(targetBooking);
      processCoordinatesAndPolyline(targetBooking);
      
      // NEW: Process stopovers from waypoints
      processStopovers(targetBooking.waypoints);

    } catch (err: any) {
      console.error('📋 Error fetching booking details:', err);
      setError(err.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setError('No booking ID provided');
      setLoading(false);
    }
  }, [bookingId]);

  // NEW: Render driver comment section (keeping original design style)
  const renderDriverComment = () => {
    if (!bookingData?.comments) return null;
    
    return (
      <View className="mx-4 mb-6">
        <Text className="text-lg font-semibold font-[Afacad] mb-3">
          Driver's Note
        </Text>
        <View className="bg-gray-100 rounded-xl p-4">
          <View className="flex-row items-start">
            <Ionicons name="chatbubble-outline" size={16} color="#00BD5F" style={{ marginTop: 2, marginRight: 8 }} />
            <Text className="text-base text-gray-700 font-[Afacad] italic flex-1">
              "{safeString(bookingData.comments)}"
            </Text>
          </View>
        </View>
        <View className="h-px bg-gray-200 mt-6" />
      </View>
    );
  };

  // NEW: Render stopovers section (keeping original design style)
  const renderStopovers = () => {
    if (!stopovers || stopovers.length === 0) return null;

    return (
      <View className="mx-4 mb-6">
        <Text className="text-lg font-semibold font-[Afacad] mb-3">
          Trip Stopovers ({stopovers.length})
        </Text>
        <View className="bg-orange-50 rounded-xl p-4">
          {stopovers.map((stopover, index) => (
            <View key={stopover.id || index} className="flex-row items-center mb-3 last:mb-0">
              <View className="w-3 h-3 rounded-full bg-orange-400 mr-3" />
              <View className="flex-1">
                <Text className="text-base font-medium font-[Afacad]">
                  {stopover.location}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <View className="h-px bg-gray-200 mt-6" />
      </View>
    );
  };

  const handleCallPress = (phoneNumber: string, name: string) => {
    const safeName = safeString(name) || 'Driver';
    const safePhone = safeString(phoneNumber);
    
    if (!safePhone) {
      Alert.alert('Error', 'No phone number available');
      return;
    }

    Alert.alert(
      `Call ${safeName}`,
      `Do you want to call ${safePhone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            const url = `tel:${safePhone}`;
            Linking.openURL(url).catch(err => 
              Alert.alert('Error', 'Unable to make phone call')
            );
          }
        },
      ]
    );
  };

  const handleSOSPress = () => {
    Alert.alert(
      'Emergency SOS',
      'This feature will contact emergency services and notify your emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call Emergency', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('SOS Activated', 'Emergency services have been notified.');
            const emergencyNumber = '999'; // UAE emergency number
            Linking.openURL(`tel:${emergencyNumber}`);
          }
        },
      ]
    );
  };

  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          text: 'Pending',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700'
        };
      case 'confirmed':
        return {
          text: 'Confirmed',
          bgColor: 'bg-[#00BD5F]',
          textColor: 'text-white'
        };
      case 'ongoing':
        return {
          text: 'In Progress',
          bgColor: 'bg-blue-500',
          textColor: 'text-white'
        };
      case 'completed':
        return {
          text: 'Completed',
          bgColor: 'bg-green-500',
          textColor: 'text-white'
        };
      default:
        return {
          text: 'Confirmed',
          bgColor: 'bg-[#00BD5F]',
          textColor: 'text-white'
        };
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between px-4 py-3 bg-white shadow-sm pt-[60px]">
          <Pressable onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <Text className="text-xl font-bold font-[Afacad] text-black">
            Booking Details
          </Text>
          <View className="w-8" />
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00BD5F" />
          <Text className="mt-4 text-lg font-[Afacad] text-gray-600">
            Loading booking details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between px-4 py-3 bg-white shadow-sm pt-[60px]">
          <Pressable onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <Text className="text-xl font-bold font-[Afacad] text-black">
            Booking Details
          </Text>
          <View className="w-8" />
        </View>
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-lg font-bold text-gray-800 mt-4 text-center font-[Afacad]">
            Error Loading Booking
          </Text>
          <Text className="text-gray-600 mt-2 text-center font-[Afacad]">
            {safeString(error)}
          </Text>
          <Pressable 
            onPress={() => router.back()}
            className="bg-[#00BD5F] px-6 py-3 rounded-lg mt-6"
          >
            <Text className="text-white font-bold font-[Afacad]">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!bookingData) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between px-4 py-3 bg-white shadow-sm pt-[60px]">
          <Pressable onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <Text className="text-xl font-bold font-[Afacad] text-black">
            Booking Details
          </Text>
          <View className="w-8" />
        </View>
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-lg font-bold text-gray-800 mt-4 text-center font-[Afacad]">
            Booking Not Found
          </Text>
          <Pressable 
            onPress={() => router.back()}
            className="bg-[#00BD5F] px-6 py-3 rounded-lg mt-6"
          >
            <Text className="text-white font-bold font-[Afacad]">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusDisplay(bookingData.status);
  const departureTime = formatTime(bookingData.departureTime);
  const arrivalTime = calculateArrivalTime(bookingData.departureTime, bookingData.durationSeconds);
  const duration = formatDuration(bookingData.durationSeconds);
  const totalCost = (bookingData.pricePerSeat * bookingData.seatsBooked).toString();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white shadow-sm pt-[60px]">
        <Pressable onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        <Text className="text-xl font-bold font-[Afacad] text-black">
          Booking Details
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1">
        {/* Map */}
        <View className="h-96 mx-4 mt-4 rounded-lg overflow-hidden shadow-sm">
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: routeCoordinates[0].latitude,
              longitude: routeCoordinates[0].longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {/* Route Markers */}
            <Marker
              coordinate={routeCoordinates[0]}
              title="Pickup"
              pinColor="green"
            />
            <Marker
              coordinate={routeCoordinates[routeCoordinates.length - 1]}
              title="Destination"
              pinColor="red"
            />

            {/* Stopover Markers */}
            {stopovers.map((stopover) => (
              <Marker
                key={stopover.id}
                coordinate={stopover.coordinates}
                title={stopover.location}
                description="Stopover"
              >
                <View className="bg-orange-400 rounded-full p-2">
                  <Ionicons name="pause" size={10} color="white" />
                </View>
              </Marker>
            ))}
            
            {/* Route Polyline */}
            {polylineCoords.length > 0 && (
              <Polyline
                coordinates={polylineCoords}
                strokeColor="#00BD5F"
                strokeWidth={3}
              />
            )}
          </MapView>
        </View>

        {/* Booking Status */}
        <View className="mx-4 mt-4 mb-4">
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-lg font-bold font-[Afacad] text-black">
                  {safeString(bookingData.startLocation)} → {safeString(bookingData.endLocation)}
                </Text>
                <Text className="text-sm font-[Afacad] text-gray-600">
                  {departureTime} - {arrivalTime} ({duration})
                </Text>
                <Text className="text-sm font-[Afacad] text-gray-600 mt-1">
                  {bookingData.seatsBooked} seat{bookingData.seatsBooked > 1 ? 's' : ''} • {totalCost} AED
                </Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${statusConfig.bgColor}`}>
                <Text className={`text-sm font-[Afacad] font-medium ${statusConfig.textColor}`}>
                  {statusConfig.text}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* NEW: Driver Comment Section */}
        {renderDriverComment()}

        {/* NEW: Stopovers Section */}
        {renderStopovers()}

        {/* Driver Info */}
        {bookingData.name && (
          <View className="bg-white rounded-lg mx-4 mb-4 shadow-sm">
            <View className="p-4 border-b border-gray-200">
              <Text className="text-lg font-bold font-[Afacad] text-black">
                Your Driver
              </Text>
            </View>
            
            <View className="p-4">
              <View className="flex-row items-center mb-4">
                <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center">
                  <Ionicons name="person" size={32} color="#666" />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-lg font-[Afacad] font-bold text-black">
                    {safeString(bookingData.name)}
                  </Text>
                  {bookingData.averageRating && (
                    <View className="flex-row items-center">
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text className="text-sm font-[Afacad] text-gray-600 ml-1">
                        {safeNumber(bookingData.averageRating).toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
                {bookingData.phoneNumber && (
                  <Pressable
                    onPress={() => handleCallPress(bookingData.phoneNumber!, bookingData.name!)}
                    className="bg-green-500 px-4 py-2 rounded-full flex-row items-center"
                  >
                    <Ionicons name="call" size={16} color="white" />
                    <Text className="text-white font-[Afacad] ml-2">Call</Text>
                  </Pressable>
                )}
              </View>
              
              {/* Vehicle Info */}
              {bookingData.make && bookingData.model && (
                <View className="bg-gray-50 rounded-lg p-3">
                  <Text className="text-sm font-[Afacad] text-gray-600 mb-2">Vehicle</Text>
                  <Text className="text-base font-[Afacad] font-medium text-black">
                    {safeString(bookingData.make)} {safeString(bookingData.model)} • {safeString(bookingData.color)}
                  </Text>
                  <Text className="text-lg font-[Afacad] font-bold text-black">
                    {safeString(bookingData.plateNumber)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* SOS Button */}
        <View className="mx-4 mb-4">
          <Pressable
            onPress={handleSOSPress}
            className="bg-red-500 py-4 rounded-lg items-center border-2 border-red-600"
          >
            <View className="flex-row items-center">
              <Ionicons name="warning" size={24} color="white" />
              <Text className="text-white text-lg font-[Afacad] font-bold ml-2">
                Emergency SOS
              </Text>
            </View>
            <Text className="text-red-100 text-sm font-[Afacad] mt-1">
              Tap in case of emergency
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingDetailsScreen;