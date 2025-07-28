import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, Switch, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useGlobalSearchParams, useFocusEffect } from 'expo-router';
import { RideSearchFormProps } from '../../interfaces/interfaces';
import DatePickerModal from './DatePickerModal'; // Updated import
import { saveRecentSearch } from '../../utils/recentSearchStorage';
import auth from '@react-native-firebase/auth';
import { BASE_URL } from '@/config';
import { useTranslation } from 'react-i18next';

interface LocationData {
  name: string;
  lat: number;
  lng: number;
}

// Extended interface to include the new props
interface ExtendedRideSearchFormProps extends RideSearchFormProps {
  initialFrom?: string;
  initialTo?: string;
  initialFromCoordinates?: {lat: number, lng: number};
  initialToCoordinates?: {lat: number, lng: number};
  initialDate?: string; // Add date prop
}

// Static time to use for all searches (you can adjust this as needed)
const STATIC_SEARCH_TIME = { hour: 9, minute: 0 }; // 09:00

const RideSearchForm: React.FC<ExtendedRideSearchFormProps> = ({
  femaleOnly,
  setFemaleOnly,
  passengerCount,
  setPassengerCount,
  userGender,
  initialFrom,
  initialTo,
  initialFromCoordinates,
  initialToCoordinates,
  initialDate,
}) => {
  const { t } = useTranslation('components/RideSearchForm');

  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Changed from dateTime to selectedDate
  const [pickerVisible, setPickerVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromLocation, setFromLocation] = useState<LocationData | null>(null);
  const [toLocation, setToLocation] = useState<LocationData | null>(null);

  const isFemale = userGender?.toLowerCase() === 'female';
  
  const router = useRouter();
  const params = useGlobalSearchParams();

  // Pre-populate form with initial data when provided (only when coming from SearchResultsScreen)
  useEffect(() => {
    // Only pre-populate if we have initial data (indicating we're in the modal from SearchResultsScreen)
    if (initialFrom || initialTo || initialFromCoordinates || initialToCoordinates || initialDate) {
      if (initialFrom) {
        setFrom(initialFrom);
      }
      if (initialTo) {
        setTo(initialTo);
      }
      if (initialFromCoordinates) {
        setFromLocation({
          name: initialFrom || '',
          lat: initialFromCoordinates.lat,
          lng: initialFromCoordinates.lng,
        });
      }
      if (initialToCoordinates) {
        setToLocation({
          name: initialTo || '',
          lat: initialToCoordinates.lat,
          lng: initialToCoordinates.lng,
        });
      }
      if (initialDate) {
        // Convert ISO string back to Date object
        const date = new Date(initialDate);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
        }
      }
    }
  }, [initialFrom, initialTo, initialFromCoordinates, initialToCoordinates, initialDate]);

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

  // Updated to show only date, no time
  const formattedDate = selectedDate
    ? selectedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })
    : t('datePlaceholder');

  // Add this useEffect to reset femaleOnly if user is not female
  useEffect(() => {
    if (!isFemale && femaleOnly) {
      setFemaleOnly(false);
    }
  }, [isFemale, femaleOnly, setFemaleOnly]);

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
      Alert.alert(t('errors.missingTitle'), t('errors.pickupDropoff'));
      return;
    }

    if (!fromLocation || !toLocation) {
      Alert.alert(t('errors.locationTitle'), t('errors.locationDetails'));
      return;
    }

    if (!selectedDate) {
      Alert.alert(t('errors.missingTitle'), t('errors.dateMissing'));
      return;
    }

    if (!passengerCount || parseInt(passengerCount) < 1) {
      Alert.alert(t('errors.invalidTitle'), t('errors.passengerInvalid'));
      return;
    }

    // Get authentication token
    const token = await auth().currentUser?.getIdToken();
    if (!token) {
      Alert.alert(t('errors.authTitle'), t('errors.authMessage'));
      return;
    }

    setIsSearching(true);

    try {
      // Create a datetime object using the selected date with static time
      const searchDateTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        STATIC_SEARCH_TIME.hour,
        STATIC_SEARCH_TIME.minute,
        0
      );

      // Prepare search payload according to SearchRidesDto from backend
      const dateStr = searchDateTime.toISOString().split('T')[0]; // YYYY-MM-DD format
      const timeStr = searchDateTime.toTimeString().slice(0, 5); // HH:MM format

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

      // Save recent search with coordinates (using the search datetime)
      await saveRecentSearch({
        from,
        to,
        passengers: parseInt(passengerCount),
        date: searchDateTime.toISOString(), // Use the datetime with static time
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
          date: searchDateTime.toISOString(), // Use the datetime with static time
          passengerCount: passengerCount,
          femaleOnly: femaleOnly ? '1' : '0',
          searchResults: JSON.stringify(searchResults), // Pass the enriched results
          userGender: userGender,
        },
      });

    } catch (error: any) {
      console.error('Search error:', error);
      Alert.alert(t('errors.searchTitle'), error.message || t('errors.searchFallback'));
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
                  {from || t('fromPlaceholder')}
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
                  {to || t('toPlaceholder')}
                </Text>
              </Pressable>
              {to && (
                <Ionicons name="checkmark-circle" size={20} color="#00BD5F" />
              )}
            </View>
          </View>

          {/* Date Only - Updated */}
          <View className="mb-3 mx-4">
            <View className="flex-row items-center border-b border-gray-400 pt-3 pb-3">
              <Ionicons name="calendar-outline" size={18} color="#00BD5F" />
              <Pressable onPress={() => setPickerVisible(true)} className="ml-2 flex-1">
                <Text className={`text-lg font-[Afacad] ml-1 ${selectedDate ? 'text-black' : 'text-gray-400'}`}>
                  {formattedDate}
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

          {/* Female-only Toggle - Show but disable for non-female users */}
          <View className="flex-row justify-between items-center mt-4 mx-4">
            <View className="flex-1">
              <Text className="text-xl font-[Afacad] text-gray-700">{t('femaleOnly')}</Text>
              {!isFemale && (
                <Text className="text-sm font-[Afacad] text-gray-500 mt-1">
                  {t('femaleOnlyNote')}
                </Text>
              )}
            </View>
            <Switch
              value={femaleOnly}
              onValueChange={isFemale ? setFemaleOnly : undefined}
              thumbColor={femaleOnly ? '#00BD5F' : '#f4f3f4'}
              trackColor={{ false: '#ccc', true: '#A8E2C5' }}
              disabled={!isFemale}
              style={{ opacity: isFemale ? 1 : 0.5 }}
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
                {isSearching ? t('searching') : t('search')}
              </Text>
            </View>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Date Picker Modal - Updated */}
      <DatePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onConfirm={(date) => {
          setSelectedDate(date);
          setPickerVisible(false);
        }}
      />
    </>
  );
};

export default RideSearchForm;