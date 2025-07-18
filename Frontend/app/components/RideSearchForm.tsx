import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Switch, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useGlobalSearchParams, useFocusEffect } from 'expo-router';
import { RideSearchFormProps } from '../../interfaces/interfaces';
import DateTimePickerModal from './DateTimePickerModal';
import { saveRecentSearch } from '../../utils/recentSearchStorage';
import auth from '@react-native-firebase/auth';
import { BASE_URL } from '@/config';

interface LocationData {
  name: string;
  lat: number;
  lng: number;
}

const RideSearchForm: React.FC<RideSearchFormProps> = ({
  femaleOnly,
  setFemaleOnly,
  passengerCount,
  setPassengerCount,
}) => {
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromLocation, setFromLocation] = useState<LocationData | null>(null);
  const [toLocation, setToLocation] = useState<LocationData | null>(null);
  
  const router = useRouter();
  const params = useGlobalSearchParams();

  // Handle location data from location picker - only for search context
  useFocusEffect(
    useCallback(() => {
      // Only process if the context is 'search'
      if (params.context !== 'search') return;

      // Handle pickup location
      if (params.pickupName && params.pickupLat && params.pickupLng) {
        const locationData: LocationData = {
          name: params.pickupName as string,
          lat: parseFloat(params.pickupLat as string),
          lng: parseFloat(params.pickupLng as string),
        };
        setFrom(locationData.name);
        setFromLocation(locationData);
        
        // Clear pickup params to prevent re-processing
        router.setParams({
          pickupName: undefined,
          pickupLat: undefined,
          pickupLng: undefined,
          context: undefined,
        });
      }

      // Handle dropoff location
      if (params.dropoffName && params.dropoffLat && params.dropoffLng) {
        const locationData: LocationData = {
          name: params.dropoffName as string,
          lat: parseFloat(params.dropoffLat as string),
          lng: parseFloat(params.dropoffLng as string),
        };
        setTo(locationData.name);
        setToLocation(locationData);
        
        // Clear dropoff params to prevent re-processing
        router.setParams({
          dropoffName: undefined,
          dropoffLat: undefined,
          dropoffLng: undefined,
          context: undefined,
        });
      }
    }, [params])
  );

  const formattedDateTime = dateTime
    ? `${dateTime.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}, ${String(
        dateTime.getHours(),
      ).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`
    : 'Select date & time';

  const navigateToLocationPicker = (type: 'pickup' | 'dropoff') => {
    // Save current locations to global state before navigating
    const state = {
      currentPickup: fromLocation ? JSON.stringify(fromLocation) : undefined,
      currentDropoff: toLocation ? JSON.stringify(toLocation) : undefined,
      currentPickupName: from,
      currentDropoffName: to,
      context: 'search', // Add context to differentiate from create form
    };
    
    router.push({ 
      pathname: '/(modals)/location-picker', 
      params: { type, ...state } 
    });
  };

  const handleSearch = async () => {
    // Validation
    if (!from || !to) {
      Alert.alert('Missing Information', 'Please select pickup and destination locations');
      return;
    }

    if (!fromLocation || !toLocation) {
      Alert.alert('Missing Location', 'Please select locations from the map');
      return;
    }

    if (!dateTime) {
      Alert.alert('Missing Information', 'Please select a date and time');
      return;
    }

    if (!passengerCount || parseInt(passengerCount) < 1) {
      Alert.alert('Invalid Input', 'Please enter a valid number of passengers');
      return;
    }

    // Get authentication token
    const token = await auth().currentUser?.getIdToken();
    if (!token) {
      Alert.alert('Authentication Error', 'Please log in to search for rides');
      return;
    }

    setIsSearching(true);

    try {
      // Prepare search payload according to SearchRidesDto from backend
      const dateStr = dateTime.toISOString().split('T')[0]; // YYYY-MM-DD format
      const timeStr = dateTime.toTimeString().slice(0, 5); // HH:MM format

      const searchPayload = {
        startPoint: {
          lat: fromLocation.lat,
          lng: fromLocation.lng,
        },
        endPoint: {
          lat: toLocation.lat,
          lng: toLocation.lng,
        },
        date: dateStr,
        time: timeStr,
        requestedSeats: parseInt(passengerCount),
        femaleOnly: femaleOnly || undefined, // Send only if true
      };

      console.log('BASE_URL:', BASE_URL);
      console.log('Full URL:', `${BASE_URL}/rides/search`);
      console.log('Searching with payload:', searchPayload);

      // Make API call to search rides - Updated endpoint
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
        console.error('Search API error response:', errorText);
        throw new Error(errorText || 'Failed to search rides');
      }

      const searchResults = await response.json();
      console.log('Search results from backend:', searchResults);

      // Backend now returns enriched ride data with driver and vehicle info
      // The response structure is: [{ ride: {...}, driver: {...}, vehicle: {...} }, ...]

      // Save recent search with coordinates
      await saveRecentSearch({
        from,
        to,
        passengers: parseInt(passengerCount),
        date: dateTime.toISOString(),
        femaleOnly,
        fromCoordinates: { lat: fromLocation.lat, lng: fromLocation.lng },
        toCoordinates: { lat: toLocation.lat, lng: toLocation.lng },
      });

      // Navigate to search results screen with the results
      router.push({
        pathname: '/SearchResultsScreen',
        params: {
          from,
          to,
          fromLat: fromLocation.lat.toString(),
          fromLng: fromLocation.lng.toString(),
          toLat: toLocation.lat.toString(),
          toLng: toLocation.lng.toString(),
          date: dateTime.toISOString(),
          passengerCount: passengerCount,
          femaleOnly: femaleOnly ? '1' : '0',
          searchResults: JSON.stringify(searchResults), // Pass the enriched results
        },
      });

    } catch (error: any) {
      console.error('Search error:', error);
      Alert.alert(
        'Search Failed', 
        error.message || 'Unable to search for rides. Please try again.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="w-full items-center"
      >
        <View className="w-[80%] bg-[#F3F3F3] shadow-md rounded-xl p-4 mb-6 border border-gray-200">
          {/* From */}
          <View className="mb-3 mx-4">
            <View className="flex-row items-center border-b border-gray-400">
              <Ionicons name="radio-button-on" size={16} color="#00BD5F" />
              <Pressable
                onPress={() => navigateToLocationPicker('pickup')}
                className="ml-2 flex-1"
              >
                <Text className={`ml-2 text-lg font-[Afacad] py-3 ${from ? 'text-black' : 'text-[#A0AEC0]'}`}>
                  {from || 'Select starting point'}
                </Text>
              </Pressable>
              {from && (
                <Ionicons name="checkmark-circle" size={20} color="#00BD5F" />
              )}
            </View>
          </View>

          {/* To */}
          <View className="mb-3 mx-4">
            <View className="flex-row items-center border-b border-gray-400">
              <Ionicons name="radio-button-on" size={16} color="#00BD5F" />
              <Pressable
                onPress={() => navigateToLocationPicker('dropoff')}
                className="ml-2 flex-1"
              >
                <Text className={`ml-2 text-lg font-[Afacad] py-3 ${to ? 'text-black' : 'text-[#A0AEC0]'}`}>
                  {to || 'Select destination'}
                </Text>
              </Pressable>
              {to && (
                <Ionicons name="checkmark-circle" size={20} color="#00BD5F" />
              )}
            </View>
          </View>

          {/* Date & Time */}
          <View className="mb-3 mx-4">
            <View className="flex-row items-center border-b border-gray-400 pt-3 pb-3">
              <Ionicons name="calendar-outline" size={18} color="#00BD5F" />
              <Pressable onPress={() => setPickerVisible(true)} className="ml-2 flex-1">
                <Text className={`text-lg font-[Afacad] ml-1 ${dateTime ? 'text-black' : 'text-gray-400'}`}>
                  {formattedDateTime}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Passenger Count */}
          <View className="mb-3 mx-4">
            <View className="flex-row items-center border-b border-gray-400">
              <Ionicons name="person-outline" size={18} color="#00BD5F" />
              <TextInput
                value={passengerCount}
                onChangeText={setPassengerCount}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor="#A0AEC0"
                className="ml-2 flex-1 text-lg font-[Afacad] py-3"
              />
            </View>
          </View>

          {/* Female-only Toggle */}
          <View className="flex-row justify-between items-center mt-4 mx-4">
            <Text className="text-xl font-[Afacad] text-gray-700">Female-only</Text>
            <Switch
              value={femaleOnly}
              onValueChange={setFemaleOnly}
              thumbColor={femaleOnly ? '#00BD5F' : '#f4f3f4'}
              trackColor={{ false: '#ccc', true: '#A8E2C5' }}
            />
          </View>

          {/* Search Button */}
          <Pressable
            onPress={handleSearch}
            style={{ 
              backgroundColor: isSearching ? '#A8E2C5' : '#00BD5F',
              opacity: isSearching ? 0.7 : 1 
            }}
            className="rounded-xl py-3 items-center mt-3"
            disabled={isSearching}
          >
            <View className="flex-row items-center">
              {isSearching && (
                <Ionicons name="sync" size={18} color="white" style={{ marginRight: 8 }} />
              )}
              <Text className="text-white text-xl text-base font-[Afacad]">
                {isSearching ? 'Searching...' : 'Search Rides'}
              </Text>
            </View>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Date & Time Picker Modal */}
      <DateTimePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onConfirm={(dt) => {
          setDateTime(dt);
          setPickerVisible(false);
        }}
      />
    </>
  );
};

export default RideSearchForm;