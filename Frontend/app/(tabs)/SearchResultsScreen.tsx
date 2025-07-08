import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RideResultCard from '../components/RideResultCard';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface RideResult {
  rideId: string;
  driverId: string;
  startLocation: string;
  endLocation: string;
  departureTime: {
    toDate: () => Date;
  };
  durationSeconds: number;
  pricePerSeat: number;
  availableSeats: number;
  femaleOnly?: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  endGeo: {
    latitude: number;
    longitude: number;
  };
}

const SearchResultsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [rides, setRides] = useState<RideResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
    // Parse search results from params
    try {
      const searchResults = params.searchResults ? JSON.parse(params.searchResults as string) : [];
      console.log('Raw search results:', searchResults);
      
      // Log the first ride's data structure for debugging
      if (searchResults.length > 0) {
        console.log('First ride data:', searchResults[0]);
        console.log('departureTime type:', typeof searchResults[0].departureTime);
        console.log('departureTime value:', searchResults[0].departureTime);
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

  // Format ride time
  const formatRideTime = (departureTime: any, durationSeconds: number) => {
    let departure: Date;
    
    try {
      // Handle Firestore Timestamp with _seconds property
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
        {/* Header Row */}
        <View className="flex-row justify-between items-center mb-4 px-2 py-3 rounded-xl border border-black">
          {/* Left Side: Back Arrow and Text */}
          <View className="flex-row items-center gap-2">
            <Pressable onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color="#00BD5F" />
            </Pressable>
            <View>
              <Text className="text-xl font-[Afacad]">
                {searchParams.from} → {searchParams.to}
              </Text>
              <Text className="text-md text-gray-500 font-[Afacad]">
                {weekday} {monthDay}, {searchParams.passengerCount} passenger(s)
                {searchParams.femaleOnly && ' • Female-only'}
              </Text>
            </View>
          </View>
        </View>

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
                onPress={() => router.back()}
                className="bg-[#00BD5F] px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-[Afacad] text-base font-semibold">
                  Try New Search
                </Text>
              </Pressable>
            </View>
          ) : (
            /* Ride Results */
            rides.map((ride, index) => {
              const { depTime, arrTime, duration } = formatRideTime(ride.departureTime, ride.durationSeconds);
              
              return (
                <RideResultCard
                  key={ride.rideId || index}
                  departureTime={depTime}
                  arrivalTime={arrTime}
                  duration={duration}
                  from={ride.startLocation}
                  to={ride.endLocation}
                  price={ride.pricePerSeat.toString()}
                  driverName="Driver" // You'll need to fetch driver info separately
                  driverRating={4.5} // Placeholder - fetch from driver profile
                  driverImage=""
                  availableSeats={ride.availableSeats}
                  femaleOnly={ride.femaleOnly}
                  rideId={ride.rideId}
                />
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default SearchResultsScreen;