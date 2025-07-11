import React, { useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecentSearch } from '../../interfaces/interfaces';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';
import { clearRecentSearches } from '../../utils/recentSearchStorage';

// This should be checked to match the current IP address
// Uni: 10.45.49.69
// Home: 10.128.24.33
const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

const RecentSearches: React.FC<{ recentSearches: RecentSearch[] }> = ({ recentSearches }) => {
  const router = useRouter();
  const [searchingIndex, setSearchingIndex] = useState<number | null>(null);

  const handleRecentSearchPress = async (recentSearch: RecentSearch, index: number) => {
    try {
      setSearchingIndex(index);

      // Get authentication token
      const token = await auth().currentUser?.getIdToken();
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in to search for rides');
        return;
      }

      // Create current date and time (add 1 hour from now to ensure it's in the future)
      const currentDate = new Date();
      currentDate.setHours(currentDate.getHours() + 1);
      
      const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const timeStr = currentDate.toTimeString().slice(0, 5); // HH:MM format

      // Check if we have coordinates stored (for newer recent searches)
      if (recentSearch.fromCoordinates && recentSearch.toCoordinates) {
        // We have coordinates, proceed with search using updated backend payload
        const searchPayload = {
          startPoint: {
            lat: recentSearch.fromCoordinates.lat,
            lng: recentSearch.fromCoordinates.lng,
          },
          endPoint: {
            lat: recentSearch.toCoordinates.lat,
            lng: recentSearch.toCoordinates.lng,
          },
          date: dateStr,
          time: timeStr, // Added time field as required by backend
          requestedSeats: recentSearch.passengers,
          femaleOnly: recentSearch.femaleOnly || undefined,
        };

        console.log('Searching with recent search payload:', searchPayload);

        // Make API call to search rides using updated endpoint
        const response = await fetch(`${BASE_URL}/rides/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(searchPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to search rides');
        }

        const searchResults = await response.json();
        console.log('Recent search results:', searchResults);

        // Navigate to search results with enriched data
        router.push({
          pathname: '/SearchResultsScreen',
          params: {
            from: recentSearch.from,
            to: recentSearch.to,
            fromLat: recentSearch.fromCoordinates.lat.toString(),
            fromLng: recentSearch.fromCoordinates.lng.toString(),
            toLat: recentSearch.toCoordinates.lat.toString(),
            toLng: recentSearch.toCoordinates.lng.toString(),
            date: currentDate.toISOString(),
            passengerCount: recentSearch.passengers.toString(),
            femaleOnly: recentSearch.femaleOnly ? '1' : '0',
            searchResults: JSON.stringify(searchResults),
          },
        });

      } else {
        // No coordinates stored, need to select locations manually
        Alert.alert(
          'Location Selection Required',
          `To search for rides from ${recentSearch.from} to ${recentSearch.to}, you'll need to select the exact locations on the map.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Select Locations', 
              onPress: () => {
                // Navigate to home and pre-fill the search form
                // This is a fallback for older recent searches without coordinates
                router.push({
                  pathname: '/(tabs)/home',
                  params: {
                    prefillFrom: recentSearch.from,
                    prefillTo: recentSearch.to,
                    prefillPassengers: recentSearch.passengers.toString(),
                    prefillFemaleOnly: recentSearch.femaleOnly ? '1' : '0',
                  }
                });
              }
            }
          ]
        );
      }

    } catch (error: any) {
      console.error('Error handling recent search:', error);
      Alert.alert(
        'Search Failed', 
        error.message || 'Unable to search for rides. Please try again.'
      );
    } finally {
      setSearchingIndex(null);
    }
  };

  if (recentSearches.length === 0) {
    return (
      <View className="px-12 mb-8">
        <Text className="text-2xl font-[Afacad] mb-4">Recent Searches</Text>
        <View className="items-center py-8">
          <Ionicons name="search-outline" size={32} color="#ccc" />
          <Text className="text-gray-500 font-[Afacad] text-center mt-2">
            No recent searches yet.{'\n'}Start searching to see your history here!
          </Text>
        </View>
      </View>
    );
  }

  // Add this function for testing - remove in production
  const handleClearSearches = async () => {
    await clearRecentSearches();
    Alert.alert('Success', 'Recent searches cleared!');
    // Optionally reload the page or refresh recent searches
  };

  return (
    <View className="px-12 mb-8">
      <Text className="text-2xl font-[Afacad] mb-4">Recent Searches</Text>

      {/* Temporary button for testing - remove in production */}
      <Pressable 
        onPress={handleClearSearches}
        className="bg-red-500 mx-4 py-2 px-4 rounded-lg mb-4"
      >
        <Text className="text-white text-center font-[Afacad]">
          Clear Recent Searches (Temporary)
        </Text>
      </Pressable>

      {recentSearches.map((item, idx) => (
        <Pressable
          key={idx}
          onPress={() => handleRecentSearchPress(item, idx)}
          disabled={searchingIndex === idx}
          className={`self-center w-full h-[58px] flex-row justify-between items-center border-b border-gray-200 ${
            searchingIndex === idx ? 'bg-gray-100' : 'active:bg-gray-100'
          }`}
        >
          <View className="flex-row items-center">
            <Ionicons name="refresh" size={26} color="#00BD5F" />
            <View className="ml-2">
              <Text className="font-[Afacad] text-black text-xl">
                {item.from} → {item.to}
              </Text>
              <Text className="text-md text-gray-500 font-[Afacad] -mt-[2px]">
                {item.passengers} passenger{item.passengers > 1 ? 's' : ''}
                {item.femaleOnly && ' • Female-only'}
                {!item.fromCoordinates && ' • Needs location selection'}
              </Text>
            </View>
          </View>
          
          {searchingIndex === idx ? (
            <ActivityIndicator size="small" color="#00BD5F" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#00BD5F" />
          )}
        </Pressable>
      ))}
    </View>
  );
};

export default RecentSearches;