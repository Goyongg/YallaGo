import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Polyline, Marker } from 'react-native-maps';
import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';
import { BASE_URL } from '@/config';

const { width } = Dimensions.get('window');

interface Stopover {
  id: string;
  location: string;
  coordinates: {
    _latitude: number;
    _longitude: number;
  };
  estimatedArrival?: any;
  estimatedDeparture?: any;
  duration?: number;
}

interface RidePreferences {
  allowsSmoking?: boolean;
  petsAllowed?: boolean;
  musicPreference?: string;
  luggageSpace?: 'small' | 'medium' | 'large';
}

const RideDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [passengerCount, setPassengerCount] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);
  const [stopovers, setStopovers] = useState<Stopover[]>([]);
  const [ridePreferences, setRidePreferences] = useState<RidePreferences>({});

  // Extract user gender from params
  const userGender = params.userGender as string;
  const isFemale = userGender?.toLowerCase() === 'female';

  // Extract parameters with better type safety
  const rideDetails = {
    rideId: params.rideId as string,
    departureTime: params.departureTime as string,
    arrivalTime: params.arrivalTime as string,
    duration: params.duration as string,
    from: params.from as string,
    to: params.to as string,
    price: parseFloat(params.price as string) || 0,
    driverName: params.driverName as string,
    driverRating: parseFloat(params.driverRating as string) || 0,
    availableSeats: parseInt(params.availableSeats as string) || 1,
    femaleOnly: params.femaleOnly === '1',
    // Additional params that might be passed from search results
    fromLat: parseFloat(params.fromLat as string) || 25.1972,
    fromLng: parseFloat(params.fromLng as string) || 55.2744,
    toLat: parseFloat(params.toLat as string) || 25.2532,
    toLng: parseFloat(params.toLng as string) || 55.3657,
    // Vehicle information from search results
    vehicleMake: params.vehicleMake as string,
    vehicleModel: params.vehicleModel as string,
    vehicleColor: params.vehicleColor as string,
    vehiclePlateNumber: params.vehiclePlateNumber as string,
    // Driver comment and ride data
    driverComment: params.driverComment as string,

    // Parse polyline back from stringyfied version after getting passed from router
    polyline: (() => {
      try {
        return params.polyline ? JSON.parse(params.polyline as string) : [];
      } catch (err) {
        console.warn('Failed to parse polyline:', err);
        return [];
      }
    })(),
  };
  
  console.log('FROM:', rideDetails.fromLat, rideDetails.fromLng);
  console.log('TO:', rideDetails.toLat, rideDetails.toLng);
  console.log('Driver Comment:', rideDetails.driverComment);

  // Check if user can book this ride
  const canBookRide = !rideDetails.femaleOnly || isFemale;

  // Parse stopovers and preferences from params
  useEffect(() => {
    try {
      if (params.stopovers) {
        const parsedStopovers = JSON.parse(params.stopovers as string);
        // Convert waypoints structure to stopover structure for consistency
        const convertedStopovers = parsedStopovers.map((waypoint: any, index: number) => ({
          id: `waypoint-${index}`,
          location: waypoint.label || 'Unknown location',
          coordinates: {
            _latitude: waypoint.coordinates?.lat || 0,
            _longitude: waypoint.coordinates?.lng || 0,
          },
          estimatedArrival: waypoint.estimatedArrival,
          estimatedDeparture: waypoint.estimatedDeparture,
          duration: waypoint.duration,
        }));
        setStopovers(convertedStopovers);
        console.log('Parsed and converted stopovers:', convertedStopovers);
      }
    } catch (error) {
      console.error('Error parsing stopovers:', error);
      setStopovers([]);
    }

    try {
      if (params.ridePreferences) {
        const parsedPreferences = JSON.parse(params.ridePreferences as string);
        setRidePreferences(parsedPreferences || {});
        console.log('Parsed preferences:', parsedPreferences);
      }
    } catch (error) {
      console.error('Error parsing ride preferences:', error);
      setRidePreferences({});
    }
  }, [params.stopovers, params.ridePreferences]);

  // Set vehicle info if available
  useEffect(() => {
    if (rideDetails.vehicleMake && rideDetails.vehicleModel) {
      setVehicleInfo({
        make: rideDetails.vehicleMake,
        model: rideDetails.vehicleModel,
        color: rideDetails.vehicleColor,
        plateNumber: rideDetails.vehiclePlateNumber,
      });
    }
  }, []);

  // Format time from various timestamp formats
  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      let date: Date;
      
      if (timestamp && typeof timestamp === 'object' && timestamp._seconds) {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
        date = timestamp.toDate();
      } else if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        return 'N/A';
      }
      
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'N/A';
    }
  };

  // Create route coordinates from the passed coordinates
  const routeCoordinates = [
    { latitude: rideDetails.fromLat, longitude: rideDetails.fromLng },
    { latitude: rideDetails.toLat, longitude: rideDetails.toLng },
  ];

  // Calculate map region to show both points
  const mapRegion = {
    latitude: (rideDetails.fromLat + rideDetails.toLat) / 2,
    longitude: (rideDetails.fromLng + rideDetails.toLng) / 2,
    latitudeDelta: Math.abs(rideDetails.fromLat - rideDetails.toLat) + 0.05,
    longitudeDelta: Math.abs(rideDetails.fromLng - rideDetails.toLng) + 0.05,
  };

  // Format the current date for display
  const formatDate = () => {
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]}`;
  };

  // Book ride function that calls the backend
  const handleBookRide = async () => {
    // Check gender restriction first
    if (!canBookRide) {
      Alert.alert(
        'Booking Restricted', 
        'This is a female-only ride. Only female users can book this ride.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!rideDetails.rideId) {
      Alert.alert('Error', 'Invalid ride information');
      return;
    }

    try {
      setIsBooking(true);

      // Get authentication token
      const token = await auth().currentUser?.getIdToken();
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in to book rides');
        return;
      }

      // Simplified booking payload - only send required fields
      const bookingPayload = {
        rideId: rideDetails.rideId,
        seatsBooked: passengerCount,
        bookingPrice: (rideDetails.price * passengerCount), // Changed from 'price' to 'bookingPrice'
        pricePerSeat: rideDetails.price, // Price per individual seat
      };

      console.log('Booking ride with payload:', bookingPayload);

      // Use correct endpoint /bookings
      const response = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Booking error:', errorText);
        throw new Error(errorText || 'Failed to book ride');
      }

      const result = await response.json();
      console.log('Booking successful:', result);

      // Show success message and stay on the same page
      // Alert.alert(
      //   'Booking Successful! 🎉', 
      //   `Your ride has been booked successfully.\n\nBooking ID: ${result.bookingId || 'N/A'}\nSeats booked: ${passengerCount}\nTotal cost: ${((rideDetails.price || 0) * passengerCount).toFixed(1)} AED`,
      //   [
      //     {
      //       text: 'OK',
      //       onPress: () => {
      //         console.log('Booking completed, staying on current page');
      //       }
      //     }
      //   ]
      // );

    } catch (error: any) {
      console.error('Booking failed:', error);
      
      // Better error handling with more specific messages
      let errorMessage = 'Unable to book the ride. Please try again.';
      
      if (error.message.includes('Booked seats cannot be more than available seats')) {
        errorMessage = `Sorry, only ${rideDetails.availableSeats} seats are available for this ride.`;
      } else if (error.message.includes('Authentication')) {
        errorMessage = 'Please log in again to book this ride.';
      } else if (error.message.includes('Ride does not exist')) {
        errorMessage = 'This ride is no longer available.';
      }
      
      Alert.alert('Booking Failed', errorMessage);
    } finally {
      setIsBooking(false);
    }
  };

  const increasePassengers = () => {
    if (passengerCount < rideDetails.availableSeats) {
      setPassengerCount(prev => prev + 1);
    }
  };

  const decreasePassengers = () => {
    if (passengerCount > 1) {
      setPassengerCount(prev => prev - 1);
    }
  };

  // Format departure date from the ride details
  const formatRideDate = () => {
    try {
      // If we have date info from search, use it; otherwise use current date
      if (params.date) {
        const rideDate = new Date(params.date as string);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        
        return `${days[rideDate.getDay()]}, ${rideDate.getDate()} ${months[rideDate.getMonth()]}`;
      }
    } catch (error) {
      console.log('Error formatting ride date:', error);
    }
    
    return formatDate(); // Fallback to current date
  };

  // Render stopovers section
  const renderStopovers = () => {
    if (!stopovers || stopovers.length === 0) return null;

    return (
      <View className="mx-4 mb-4">
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

  // Render driver comment section
  const renderDriverComment = () => {
    if (!rideDetails.driverComment) return null;
    
    return (
      <View className="mx-4 mb-6">
        <Text className="text-lg font-semibold font-[Afacad] mb-3">
          Driver's Note
        </Text>
        <View className="bg-gray-100 rounded-xl p-4">
          <View className="flex-row items-start">
            <Ionicons name="chatbubble-outline" size={16} color="#00BD5F" style={{ marginTop: 2, marginRight: 8 }} />
            <Text className="text-base text-gray-700 font-[Afacad] italic flex-1">
              "{rideDetails.driverComment}"
            </Text>
          </View>
        </View>
        <View className="h-px bg-gray-200 mt-6" />
      </View>
    );
  };

  // Render ride preferences
  const renderRidePreferences = () => {
    const preferences = [];
    
    if (ridePreferences.allowsSmoking) preferences.push({ icon: 'cloud-outline', text: 'Smoking OK', color: '#F59E0B' });
    if (ridePreferences.petsAllowed) preferences.push({ icon: 'paw-outline', text: 'Pets OK', color: '#8B5CF6' });
    if (ridePreferences.musicPreference) preferences.push({ icon: 'musical-notes-outline', text: ridePreferences.musicPreference, color: '#06B6D4' });
    if (ridePreferences.luggageSpace) {
      const luggageText = ridePreferences.luggageSpace === 'large' ? 'Large luggage' : 
                         ridePreferences.luggageSpace === 'medium' ? 'Medium luggage' : 'Small luggage only';
      preferences.push({ icon: 'bag-outline', text: luggageText, color: '#10B981' });
    }

    if (preferences.length === 0) return null;

    return (
      <View className="mx-4 mb-6">
        <Text className="text-lg font-semibold font-[Afacad] mb-3">
          Ride Preferences
        </Text>
        <View className="bg-gray-50 rounded-xl p-4">
          <View className="flex-row flex-wrap">
            {preferences.map((pref, index) => (
              <View 
                key={index}
                className="flex-row items-center bg-white px-3 py-2 rounded-full mr-2 mb-2 shadow-sm"
              >
                <Ionicons name={pref.icon as any} size={16} color={pref.color} />
                <Text className="text-sm text-gray-700 font-[Afacad] ml-2">
                  {pref.text}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-16 pb-4 px-4 bg-white">
        <View className="flex-row items-center">
          <Pressable 
            onPress={() => router.back()}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="#00BD5F" />
          </Pressable>
          <Text className="text-xl font-[Afacad] font-semibold">
            {formatRideDate()}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Map Section */}
        <View className="mx-4 mb-4">
          <MapView
            style={{ width: width - 32, height: 300, borderRadius: 12 }}
            region={mapRegion}
            scrollEnabled={true}
            zoomEnabled={true}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            {/* Route Polyline */}
            {rideDetails.polyline.length > 1 && (
              <Polyline
                coordinates={rideDetails.polyline}
                strokeColor="#00BD5F"
                strokeWidth={4}
                lineDashPattern={[1]}
              />
            )}
            
            {/* Start Marker */}
            <Marker 
              coordinate={routeCoordinates[0]}
              title={rideDetails.from}
              description="Pickup Location"
            >
              <View className="bg-[#00BD5F] rounded-full p-2">
                <Ionicons name="radio-button-on" size={12} color="white" />
              </View>
            </Marker>
            
            {/* End Marker */}
            <Marker 
              coordinate={routeCoordinates[routeCoordinates.length - 1]}
              title={rideDetails.to}
              description="Drop-off Location"
            >
              <View className="bg-red-500 rounded-full p-2">
                <Ionicons name="location" size={12} color="white" />
              </View>
            </Marker>

            {/* Stopover Markers */}
            {stopovers.map((stopover, index) => (
              <Marker
                key={stopover.id || index}
                coordinate={{
                  latitude: stopover.coordinates._latitude,
                  longitude: stopover.coordinates._longitude,
                }}
                title={stopover.location}
                description="Stopover"
              >
                <View className="bg-orange-400 rounded-full p-2">
                  <Ionicons name="pause" size={10} color="white" />
                </View>
              </Marker>
            ))}
          </MapView>
          
          <Text className="text-md text-gray-600 mt-2 font-[Afacad]">
            Check the trip route on the map 🗺️
            {stopovers.length > 0 && ` • ${stopovers.length} stopover${stopovers.length !== 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Trip Details */}
        <View className="mx-4 mb-4">
          <View className="flex-row items-center mb-4">
            <Ionicons name="location-outline" size={16} color="#00BD5F" />
            <Text className="ml-2 text-sm text-gray-600 font-[Afacad]">
              Route: {rideDetails.from} → {rideDetails.to}
            </Text>
          </View>

          {/* Trip timeline matching RideResultCard structure */}
          <View className="flex-row items-center justify-start">
            {/* Left: Time & Duration */}
            <View className="items-end pr-2">
              <Text className="text-lg font-bold font-[Afacad]">{rideDetails.departureTime}</Text>
              <Text className="text-sm text-gray-500 font-[Afacad]">{rideDetails.duration}</Text>
              <Text className="text-lg font-bold mt-1 font-[Afacad]">{rideDetails.arrivalTime}</Text>
            </View>

            {/* Center: Line & Circles */}
            <View className="items-center mx-2">
              <Ionicons name="ellipse" size={10} color="#00BD5F" />
              <View className="w-px h-12 bg-[#00BD5F]" />
              <Ionicons name="ellipse" size={10} color="#00BD5F" />
            </View>

            {/* Right: Locations with descriptions */}
            <View className="ml-2 flex-1">
              <View className="mb-1">
                <Text className="text-base font-semibold font-[Afacad]" numberOfLines={1}>
                  {rideDetails.from}
                </Text>
                <Text className="text-sm text-gray-500 font-[Afacad]">
                  Pickup location
                </Text>
              </View>
              <View className="h-2" />
              <View className="mt-1">
                <Text className="text-base font-semibold font-[Afacad]" numberOfLines={1}>
                  {rideDetails.to}
                </Text>
                <Text className="text-sm text-gray-500 font-[Afacad]">
                  Drop-off location
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-200 mx-4 mb-4" />

        {/* Stopovers Section */}
        {renderStopovers()}

        {/* Driver Comment Section */}
        {renderDriverComment()}

        {/* Ride Preferences Section */}
        {renderRidePreferences()}

        {/* Driver Info */}
        <View className="mx-4 mb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 rounded-full bg-[#00BD5F] items-center justify-center overflow-hidden">
                <Ionicons name="person" size={24} color="white" />
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text className="text-lg font-semibold font-[Afacad]">
                    {rideDetails.driverName}
                  </Text>
                  <View className="flex-row items-center ml-2">
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text className="text-sm font-medium font-[Afacad] ml-1">
                      {rideDetails.driverRating.toFixed(1)}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm text-gray-500 font-[Afacad]">
                  {vehicleInfo ? 
                    `${vehicleInfo.color} ${vehicleInfo.make} ${vehicleInfo.model} • ${vehicleInfo.plateNumber}` :
                    `Verified driver • ${rideDetails.availableSeats} seats available`
                  }
                </Text>
              </View>
            </View>
            
            {/* Verified badge */}
            <View className="bg-green-100 rounded-full p-2">
              <Ionicons name="checkmark-circle" size={20} color="#00BD5F" />
            </View>
          </View>
          
          {/* Additional info row for verified status and seats */}
          {vehicleInfo && (
            <View className="flex-row items-center mt-2 ml-15">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={12} color="#00BD5F" />
                <Text className="text-xs text-gray-500 font-[Afacad] ml-1">
                  Verified
                </Text>
              </View>
              <Text className="text-xs text-gray-400 font-[Afacad] mx-2">•</Text>
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={12} color="#666" />
                <Text className="text-xs text-gray-500 font-[Afacad] ml-1">
                  {rideDetails.availableSeats} seats available
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-200 mx-4 mb-4" />

        {/* Female Only Badge */}
        {rideDetails.femaleOnly && (
          <View className="mx-4 mb-4">
            <View className="bg-pink-100 px-3 py-2 rounded-lg self-start">
              <Text className="text-pink-600 font-[Afacad] text-sm font-medium">
                👩 Female-only ride
              </Text>
            </View>
          </View>
        )}

        {/* Passenger Count and Price */}
        <View className="mx-4 mb-6">
          <View className="bg-gray-50 rounded-xl p-4">
            <Text className="text-lg font-semibold font-[Afacad] mb-3">Booking Details</Text>
            
            {/* Passenger Counter */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-[Afacad]">Number of passengers:</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg bg-white">
                <Pressable 
                  onPress={decreasePassengers}
                  className="p-3"
                  disabled={passengerCount <= 1}
                >
                  <Ionicons 
                    name="remove" 
                    size={16} 
                    color={passengerCount <= 1 ? "#ccc" : "#00BD5F"} 
                  />
                </Pressable>
                <Text className="text-base font-[Afacad] px-4 min-w-[100px] text-center">
                  {passengerCount} passenger{passengerCount !== 1 ? 's' : ''}
                </Text>
                <Pressable 
                  onPress={increasePassengers}
                  className="p-3"
                  disabled={passengerCount >= rideDetails.availableSeats}
                >
                  <Ionicons 
                    name="add" 
                    size={16} 
                    color={passengerCount >= rideDetails.availableSeats ? "#ccc" : "#00BD5F"} 
                  />
                </Pressable>
              </View>
            </View>

            {/* Price Breakdown */}
            <View className="border-t border-gray-200 pt-3">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-gray-600 font-[Afacad]">
                  Price per seat:
                </Text>
                <Text className="text-sm font-[Afacad]">
                  {rideDetails.price.toFixed(1)} AED
                </Text>
              </View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-gray-600 font-[Afacad]">
                  × {passengerCount} passenger{passengerCount !== 1 ? 's' : ''}:
                </Text>
                <Text className="text-sm font-[Afacad]">
                  {((rideDetails.price || 0) * passengerCount).toFixed(1)} AED
                </Text>
              </View>
              <View className="h-px bg-gray-200 my-2" />
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-bold font-[Afacad]">
                  Total:
                </Text>
                <Text className="text-xl font-bold font-[Afacad] text-[#00BD5F]">
                  {((rideDetails.price || 0) * passengerCount).toFixed(1)} AED
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Book Button - Enhanced with gender restriction */}
      <View className="bg-white px-4 py-4 border-t border-gray-200">
        {canBookRide ? (
          <Pressable 
            onPress={handleBookRide}
            className="bg-[#00BD5F] py-4 rounded-xl items-center flex-row justify-center"
            disabled={isBooking}
            style={{ opacity: isBooking ? 0.7 : 1 }}
          >
            {isBooking ? (
              <>
                <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                <Text className="text-white text-lg font-[Afacad] font-semibold">
                  Booking...
                </Text>
              </>
            ) : (
              <Text className="text-white text-lg font-[Afacad] font-semibold">
                Book {passengerCount} seat{passengerCount !== 1 ? 's' : ''} for {((rideDetails.price || 0) * passengerCount).toFixed(1)} AED
              </Text>
            )}
          </Pressable>
        ) : (
          <View className="bg-gray-300 py-4 rounded-xl items-center">
            <View className="flex-row items-center">
              <Ionicons name="woman" size={20} color="#666" style={{ marginRight: 8 }} />
              <Text className="text-gray-600 text-lg font-[Afacad] font-semibold">
                Female-Only Ride - Booking Not Available
              </Text>
            </View>
            <Text className="text-gray-500 text-sm font-[Afacad] mt-1">
              This ride is restricted to female passengers only
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default RideDetailsScreen;