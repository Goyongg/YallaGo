import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RideResultCard from '../components/RideResultCard';
import RideSearchForm from '../components/RideSearchForm';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useHomeUserData from '../../hooks/useHomeUserData';

// Updated interface to match backend data structure
interface Waypoint {
  coordinates: {
    lat: number;
    lng: number;
  };
  label: string;
  estimatedArrival?: any; // Firestore Timestamp
  estimatedDeparture?: any; // Firestore Timestamp
  duration?: number; // Duration in minutes
}

interface EnrichedRideResult {
  ride: {
    rideId: string;
    startLocation: string;
    endLocation: string;
    coordinates: {
      _latitude: number;
      _longitude: number;
    };
    endGeo: {
      _latitude: number;
      _longitude: number;
    };
    departureTime: any; // Firestore Timestamp
    durationSeconds: number;
    pricePerSeat: number;
    availableSeats: number;
    femaleOnly?: boolean;
    waypoints?: Waypoint[]; // Changed from stopovers to waypoints
    polyline?: string;
    // New fields for comments and stopovers - using correct field name from logs
    comments?: string; // Changed from driverComment to comments
    allowsSmoking?: boolean;
    petsAllowed?: boolean;
    musicPreference?: string;
    luggageSpace?: 'small' | 'medium' | 'large';
  };
  driver: {
    name: string;
    averageRating: number;
  } | null;
  vehicle: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  } | null;
}

const SearchResultsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [rides, setRides] = useState<EnrichedRideResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [expandedRides, setExpandedRides] = useState<Set<string>>(new Set());
  
  // Search form state
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [passengerCount, setPassengerCount] = useState('');
  const [date, setDate] = useState('');

  // Get user data to access gender
  const { userData } = useHomeUserData();
  
  // Extract search parameters
  const searchParams = {
    from: params.from as string || 'Unknown',
    to: params.to as string || 'Unknown',
    date: params.date as string || '',
    passengerCount: parseInt(params.passengerCount as string) || 1,
    femaleOnly: params.femaleOnly === '1',
    fromLat: parseFloat(params.fromLat as string),
    fromLng: parseFloat(params.fromLng as string),
    toLat: parseFloat(params.toLat as string),
    toLng: parseFloat(params.toLng as string),
  };

  useEffect(() => {
    // Initialize search form state with current search params
    setPassengerCount(searchParams.passengerCount.toString());
    setFemaleOnly(searchParams.femaleOnly);
    setDate(searchParams.date);
  }, [searchParams.passengerCount, searchParams.femaleOnly, searchParams.date]);

  useEffect(() => {
    // Parse search results from params
    try {
      const searchResults = params.searchResults ? JSON.parse(params.searchResults as string) : [];
      console.log('Raw search results:', searchResults);
      
      // Log the first ride's data structure for debugging
      if (searchResults.length > 0) {
        console.log('First enriched ride data:', searchResults[0]);
        if (searchResults[0].ride) {
          console.log('First ride departureTime:', searchResults[0].ride.departureTime);
          console.log('First driver data:', searchResults[0].driver);
          console.log('First vehicle data:', searchResults[0].vehicle);
          console.log('Driver comment:', searchResults[0].ride.comments); // Fixed field name
          console.log('Waypoints:', searchResults[0].ride.waypoints); // Changed from stopovers to waypoints
        }
      }
      
      setRides(searchResults);
    } catch (error) {
      console.error('Error parsing search results:', error);
      setRides([]);
    } finally {
      setIsLoading(false);
    }
  }, [params.searchResults]);

  // Toggle expanded view for a specific ride
  const toggleRideExpansion = (rideId: string) => {
    const newExpanded = new Set(expandedRides);
    if (newExpanded.has(rideId)) {
      newExpanded.delete(rideId);
    } else {
      newExpanded.add(rideId);
    }
    setExpandedRides(newExpanded);
  };

  // Format time from Firestore timestamp
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

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return { weekday: '', monthDay: '', year: '' };
    
    const date = new Date(dateString);
    const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
    const monthDay = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    const year = date.toLocaleDateString(undefined, { year: 'numeric' });
    
    return { weekday, monthDay, year };
  };

  // Format ride time - updated to handle backend Timestamp format
  const formatRideTime = (departureTime: any, durationSeconds: number) => {
    let departure: Date;
    
    try {
      // Handle Firestore Timestamp with _seconds property (from backend)
      if (departureTime && typeof departureTime === 'object' && departureTime._seconds) {
        // Convert Firestore timestamp (_seconds) to JavaScript Date
        departure = new Date(departureTime._seconds * 1000);
      } else if (departureTime && typeof departureTime === 'object' && departureTime.toDate) {
        // Handle native Firestore Timestamp
        departure = departureTime.toDate();
      } else if (departureTime && typeof departureTime === 'object' && departureTime.seconds) {
        // Handle serialized Firestore Timestamp
        departure = new Date(departureTime.seconds * 1000);
      } else if (typeof departureTime === 'string') {
        departure = new Date(departureTime);
      } else {
        console.error('Unhandled departureTime format:', departureTime);
        departure = new Date();
      }
      
      // Check if date is valid
      if (isNaN(departure.getTime())) {
        console.error('Invalid departure time:', departure);
        departure = new Date();
      }
      
      const arrival = new Date(departure.getTime() + (durationSeconds * 1000));
      
      const depTime = departure.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
      
      const arrTime = arrival.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
      
      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.floor((durationSeconds % 3600) / 60);
      const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      
      return { depTime, arrTime, duration };
      
    } catch (error) {
      console.error('Error formatting ride time:', error, 'departureTime:', departureTime);
      // Return fallback values
      return { 
        depTime: '00:00', 
        arrTime: '00:00', 
        duration: '0m' 
      };
    }
  };

  // Component to render waypoints (stopovers)
  const renderStopovers = (waypoints: Waypoint[] | undefined, rideId: string) => {
    if (!waypoints || waypoints.length === 0) return null;

    const isExpanded = expandedRides.has(rideId);
    const displayedWaypoints = isExpanded ? waypoints : waypoints.slice(0, 2);

    return (
      <View className="mt-3 pt-3 border-t border-gray-200">
        <Text className="text-sm font-semibold text-gray-700 font-[Afacad] mb-2">
          Stopovers ({waypoints.length})
        </Text>
        
        {displayedWaypoints.map((waypoint, index) => (
          <View key={index} className="flex-row items-center mb-2">
            <View className="w-2 h-2 rounded-full bg-orange-400 mr-3" />
            <View className="flex-1">
              <Text className="text-sm font-medium font-[Afacad]">
                {waypoint.label}
              </Text>
              {waypoint.estimatedArrival && (
                <Text className="text-xs text-gray-500 font-[Afacad]">
                  Stop at {formatTime(waypoint.estimatedArrival)}
                  {waypoint.duration && ` • ${waypoint.duration}min stop`}
                </Text>
              )}
            </View>
          </View>
        ))}
        
        {waypoints.length > 2 && (
          <Pressable 
            onPress={() => toggleRideExpansion(rideId)}
            className="mt-1"
          >
            <Text className="text-xs text-[#00BD5F] font-[Afacad] font-medium">
              {isExpanded ? 'Show less' : `Show ${waypoints.length - 2} more stopovers`}
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  // Component to render driver preferences/comments
  const renderRidePreferences = (ride: EnrichedRideResult['ride']) => {
    const preferences = [];
    
    if (ride.allowsSmoking) preferences.push({ icon: 'cloud-outline', text: 'Smoking OK', color: '#F59E0B' });
    if (ride.petsAllowed) preferences.push({ icon: 'paw-outline', text: 'Pets OK', color: '#8B5CF6' });
    if (ride.musicPreference) preferences.push({ icon: 'musical-notes-outline', text: ride.musicPreference, color: '#06B6D4' });
    if (ride.luggageSpace) {
      const luggageText = ride.luggageSpace === 'large' ? 'Large luggage' : 
                         ride.luggageSpace === 'medium' ? 'Medium luggage' : 'Small luggage only';
      preferences.push({ icon: 'bag-outline', text: luggageText, color: '#10B981' });
    }

    if (preferences.length === 0) return null; // Removed comment check - don't show comment content on card

    return (
      <View className="mt-3 pt-3 border-t border-gray-200">
        {/* Removed Driver Comment section - only show in RideDetailsScreen */}

        {/* Preferences */}
        {preferences.length > 0 && (
          <View>
            <Text className="text-sm font-semibold text-gray-700 font-[Afacad] mb-2">
              Ride Preferences
            </Text>
            <View className="flex-row flex-wrap">
              {preferences.map((pref, index) => (
                <View 
                  key={index}
                  className="flex-row items-center bg-gray-100 px-2 py-1 rounded-full mr-2 mb-1"
                >
                  <Ionicons name={pref.icon as any} size={12} color={pref.color} />
                  <Text className="text-xs text-gray-600 font-[Afacad] ml-1">
                    {pref.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const { weekday, monthDay, year } = formatDate(searchParams.date);

  console.log('🔍 SearchResultsScreen - User gender:', userData?.gender);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white pt-[70px] items-center justify-center">
        <ActivityIndicator size="large" color="#00BD5F" />
        <Text className="mt-4 text-lg font-[Afacad] text-gray-600">Loading results...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white pt-[70px] items-center">
      {/* Inner content wrapper */}
      <View className="w-[80%] gap-3">
        {/* Header Row - Now Pressable */}
        <Pressable 
          onPress={() => setShowSearchModal(true)}
          className="flex-row items-center mb-4 px-2 py-3 rounded-xl border border-black"
        >
          {/* Left Side: Back Arrow and Text */}
          <View className="flex-row items-center gap-2 flex-1">
            <Pressable onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color="#00BD5F" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-xl font-[Afacad]" numberOfLines={1} ellipsizeMode="tail">
                {searchParams.from} → {searchParams.to}
              </Text>
              <Text className="text-md text-gray-500 font-[Afacad]" numberOfLines={1} ellipsizeMode="tail">
                {weekday} {monthDay}, {searchParams.passengerCount} passenger(s)
                {searchParams.femaleOnly && ' • Female-only'}
              </Text>
            </View>
          </View>
        </Pressable>

        {/* Date Label */}
        <Text className="text-xl mb-2 font-[Afacad]">{monthDay} {year}</Text>

        {/* Results Count */}
        <Text className="text-md text-gray-600 mb-2 font-[Afacad]">
          {rides.length === 0 ? 'No rides found' : `${rides.length} ride${rides.length !== 1 ? 's' : ''} found`}
        </Text>

        {/* List of Results or Empty State */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {rides.length === 0 ? (
            /* Empty State */
            <View className="items-center justify-center py-12">
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <Ionicons name="car-outline" size={48} color="#9CA3AF" />
              </View>
              <Text className="text-xl font-[Afacad] text-gray-800 mb-2">No rides found</Text>
              <Text className="text-md text-gray-500 text-center mb-6 px-4 font-[Afacad]">
                Sorry, there are no rides available for your search criteria. Try adjusting your:
              </Text>
              
              <View className="w-full bg-gray-50 rounded-xl p-4 mb-6">
                <Text className="text-sm text-gray-600 mb-2 font-[Afacad]">• Search date and time</Text>
                <Text className="text-sm text-gray-600 mb-2 font-[Afacad]">• Number of passengers</Text>
                <Text className="text-sm text-gray-600 mb-2 font-[Afacad]">• Pickup or destination location</Text>
                {searchParams.femaleOnly && (
                  <Text className="text-sm text-gray-600 font-[Afacad]">• Remove female-only filter</Text>
                )}
              </View>

              <Pressable 
                onPress={() => setShowSearchModal(true)}
                className="bg-[#00BD5F] px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-[Afacad] text-base font-semibold">
                  Try New Search
                </Text>
              </Pressable>
            </View>
          ) : (
            /* Enhanced Ride Results with Stopovers and Comments */
            rides.map((enrichedRide, index) => {
              const { ride, driver, vehicle } = enrichedRide;
              
              if (!ride) {
                console.warn('Missing ride data for index:', index);
                return null;
              }
              
              const { depTime, arrTime, duration } = formatRideTime(ride.departureTime, ride.durationSeconds);
              
              // Get driver name and rating with fallbacks
              const driverName = driver?.name || 'Driver';
              const driverRating = driver?.averageRating || 0;
              
              return (
                <View key={ride.rideId || index} className="bg-[#F3F3F3] rounded-2xl p-4 mb-4 shadow border border-gray-100">
                  {/* Original Ride Card Content */}
                  <View className="flex-row justify-between items-start min-h-[70px]">
                    {/* Ride Route Details */}
                    <View className="flex-row items-center justify-start flex-1">
                      {/* Left: Time & Duration */}
                      <View className="items-end pr-2">
                        <Text className="text-md font-bold font-[Afacad]">{depTime}</Text>
                        <Text className="text-xs text-gray-500 font-[Afacad]">{duration}</Text>
                        <Text className="text-md font-bold mt-1 font-[Afacad]">{arrTime}</Text>
                      </View>

                      {/* Center: Line & Circles - Simple version without stopovers */}
                      <View className="items-center mx-2">
                        <Ionicons name="ellipse-outline" size={10} color="#00BD5F" />
                        <View className="w-px h-8 bg-[#00BD5F]" />
                        <Ionicons name="ellipse-outline" size={10} color="#00BD5F" />
                      </View>

                      {/* Right: Locations - Simple version without inline waypoints */}
                      <View className="ml-2 flex-1">
                        <Text className="text-md font-semibold font-[Afacad]" numberOfLines={1}>
                          {ride.startLocation}
                        </Text>
                        <View className="h-5" />
                        <Text className="text-md font-semibold font-[Afacad]" numberOfLines={1}>
                          {ride.endLocation}
                        </Text>
                      </View>
                    </View>

                    {/* Right Side: Price and Info */}
                    <View className="items-end ml-4">
                      <Text className="text-lg font-bold text-black font-[Afacad]">{ride.pricePerSeat} AED</Text>
                      {ride.availableSeats && (
                        <Text className="text-xs text-gray-500 font-[Afacad] mt-1">
                          {ride.availableSeats} seat{ride.availableSeats !== 1 ? 's' : ''} left
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Badges Row */}
                  <View className="flex-row mb-2 flex-wrap">
                    {ride.femaleOnly && (
                      <View className="bg-pink-100 px-2 py-1 rounded-full mr-2 mb-1">
                        <Text className="text-xs text-pink-600 font-[Afacad] font-medium">Female-only</Text>
                      </View>
                    )}
                    {ride.waypoints && ride.waypoints.length > 0 && (
                      <View className="bg-orange-100 px-2 py-1 rounded-full mr-2 mb-1">
                        <Text className="text-xs text-orange-600 font-[Afacad] font-medium">
                          {ride.waypoints.length} stop{ride.waypoints.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                    {ride.comments && ( // Fixed field name
                      <View className="bg-blue-100 px-2 py-1 rounded-full mr-2 mb-1">
                        <Text className="text-xs text-blue-600 font-[Afacad] font-medium">Has note</Text>
                      </View>
                    )}
                  </View>

                  {/* Render Waypoints - Removed from card, only show in details */}
                  {/* {renderStopovers(ride.waypoints, ride.rideId)} */}

                  {/* Render Ride Preferences and Comments */}
                  {renderRidePreferences(ride)}

                  {/* Bottom Row: Driver Info */}
                  <View className="border-t border-gray-300 mt-4 pt-4 pl-4 flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-full items-center justify-center overflow-hidden bg-[#00BD5F]">
                        <Ionicons name="person" size={22} color="white" />
                      </View>
                      <View className="pl-2 flex-1">
                        <View className="flex-row items-center">
                          <Text className="font-[Afacad] text-base font-medium">{driverName}</Text>
                          <View className="flex-row items-center ml-2">
                            <Ionicons name="star" size={12} color="#FFD700" />
                            <Text className="text-sm text-gray-500 font-[Afacad] ml-1">
                              {(driverRating || 0).toFixed(1)}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-sm text-gray-500 font-[Afacad]" numberOfLines={1}>
                          {vehicle ? `${vehicle.color} ${vehicle.make} ${vehicle.model} • ${vehicle.plateNumber}` : 'Vehicle details available'}
                        </Text>
                      </View>
                    </View>

                    {/* Book Now Button */}
                    <Pressable 
                      onPress={() => {
                        router.push({
                          pathname: '/(tabs)/RideDetailsScreen',
                          params: {
                            rideId: ride.rideId,
                            departureTime: depTime,
                            arrivalTime: arrTime,
                            duration: duration,
                            from: ride.startLocation,
                            fromLat: ride.coordinates._latitude.toString(),
                            fromLng: ride.coordinates._longitude.toString(),
                            to: ride.endLocation,
                            toLat: ride.endGeo._latitude.toString(),
                            toLng: ride.endGeo._longitude.toString(),
                            price: ride.pricePerSeat.toString(),
                            polyline: ride.polyline,
                            driverName: driverName,
                            driverRating: driverRating.toString(),
                            availableSeats: ride.availableSeats?.toString(),
                            femaleOnly: ride.femaleOnly ? '1' : '0',
                            vehicleMake: vehicle?.make,
                            vehicleModel: vehicle?.model,
                            vehicleColor: vehicle?.color,
                            vehiclePlateNumber: vehicle?.plateNumber,
                            userGender: userData?.gender,
                            // Pass additional ride data
                            driverComment: ride.comments,
                            stopovers: JSON.stringify(ride.waypoints || []),
                            ridePreferences: JSON.stringify({
                              allowsSmoking: ride.allowsSmoking,
                              petsAllowed: ride.petsAllowed,
                              musicPreference: ride.musicPreference,
                              luggageSpace: ride.luggageSpace,
                            }),
                          }
                        });
                      }}
                      className="bg-[#00BD5F] px-4 py-2 rounded-xl"
                    >
                      <Text className="text-white font-[Afacad] text-sm font-semibold">
                        Book Now
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Search Modal - Content-sized and Responsive */}
      <Modal
        visible={showSearchModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSearchModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSearchModal(false)}>
          <View className="flex-1 justify-center items-center px-6">
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-xl p-6 w-full shadow-lg" style={{ maxWidth: 400, minWidth: 300 }}>
                {/* Modal Header */}
                <View className="relative mb-6">
                  <Text className="text-xl font-[Afacad] font-semibold text-center">Adjust Search</Text>
                  <Pressable 
                    onPress={() => setShowSearchModal(false)}
                    className="absolute right-0 top-0 p-1"
                    style={{ top: -2 }}
                  >
                    <Ionicons name="close" size={24} color="#00BD5F" />
                  </Pressable>
                </View>

                {/* Search Form */}
                <RideSearchForm
                  femaleOnly={femaleOnly}
                  setFemaleOnly={setFemaleOnly}
                  passengerCount={passengerCount}
                  setPassengerCount={setPassengerCount}
                  date={date}
                  setDate={setDate}
                  userGender={userData?.gender}
                  // Pass current search locations to pre-populate the form
                  initialFrom={searchParams.from}
                  initialTo={searchParams.to}
                  initialFromCoordinates={{
                    lat: searchParams.fromLat,
                    lng: searchParams.fromLng,
                  }}
                  initialToCoordinates={{
                    lat: searchParams.toLat,
                    lng: searchParams.toLng,
                  }}
                  initialDate={searchParams.date}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default SearchResultsScreen;