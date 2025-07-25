import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RideResultCard from '../components/RideResultCard';
import RideSearchForm from '../components/RideSearchForm';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useHomeUserData from '../../hooks/useHomeUserData';

// Updated interface to match backend response structure
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
    waypoints?: any[];
    polyline?: string;
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
      
      console.log('Parsed departure time:', departure.toISOString());
      
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
      
      console.log('Formatted times - Departure:', depTime, 'Arrival:', arrTime, 'Duration:', duration);
      
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
            /* Ride Results - Updated to handle enriched data structure */
            rides.map((enrichedRide, index) => {
              const { ride, driver, vehicle } = enrichedRide;
              console.log('Ride coordinates:', ride.coordinates);
              console.log('Ride endGeo:', ride.endGeo);
              
              if (!ride) {
                console.warn('Missing ride data for index:', index);
                return null;
              }
              
              const { depTime, arrTime, duration } = formatRideTime(ride.departureTime, ride.durationSeconds);
              
              // Get driver name and rating with fallbacks
              const driverName = driver?.name || 'Driver';
              const driverRating = driver?.averageRating || 0;
              
              // Get vehicle info for display
              const vehicleInfo = vehicle ? `${vehicle.make} ${vehicle.model}` : '';
              
              return (
                <RideResultCard
                  key={ride.rideId || index}
                  departureTime={depTime}
                  arrivalTime={arrTime}
                  duration={duration}
                  from={ride.startLocation}
                  fromLat={ride.coordinates._latitude.toString()}
                  fromLng={ride.coordinates._longitude.toString()}
                  to={ride.endLocation}
                  toLat={ride.endGeo._latitude.toString()}
                  toLng={ride.endGeo._longitude.toString()}
                  price={ride.pricePerSeat.toString()}
                  polyline={ride.polyline} // send polyline
                  driverName={driverName}
                  driverRating={driverRating}
                  driverImage=""
                  availableSeats={ride.availableSeats}
                  femaleOnly={ride.femaleOnly}
                  rideId={ride.rideId}
                  // Pass vehicle information for RideDetailsScreen
                  vehicleMake={vehicle?.make}
                  vehicleModel={vehicle?.model}
                  vehicleColor={vehicle?.color}
                  vehiclePlateNumber={vehicle?.plateNumber}
                  userGender={userData?.gender}
                />
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