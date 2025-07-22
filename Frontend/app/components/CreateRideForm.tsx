import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Switch, Pressable, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from './DateTimePickerModal';
import auth from '@react-native-firebase/auth';
import { router, useGlobalSearchParams, useFocusEffect } from 'expo-router';
import { BASE_URL } from '@/config';

interface LocationData {
  name: string;
  lat: number;
  lng: number;
}

interface StopoverData {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

const CreateRideForm: React.FC<{ userGender?: string }> = ({ userGender }) => {
  const params = useGlobalSearchParams();
  
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromLocation, setFromLocation] = useState<LocationData | null>(null);
  const [toLocation, setToLocation] = useState<LocationData | null>(null);
  const [passengerCount, setPassengerCount] = useState('');
  const [price, setPrice] = useState('');
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [stopovers, setStopovers] = useState<StopoverData[]>([]);
  const [comment, setComment] = useState('');
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [recommendedPrice, setRecommendedPrice] = useState<number | null>(null);

  const isFemale = userGender?.toLowerCase() === 'female';

  // Handle location data from location picker - only for create context
  useFocusEffect(
    useCallback(() => {
      // If all location params are undefined, do nothing
      if (
        !params.pickupName &&
        !params.dropoffName &&
        !params.stopoverName &&
        !params.currentStopovers
      ) {
        return;
      }
      console.log('useFocusEffect triggered with params:', params);

      // Only process if the context is 'create' or undefined (for backward compatibility)
      if (params.context === 'search') return;

      let shouldClearParams = false;

      // Restore stopovers from params if present
      let latestStopovers: StopoverData[] = stopovers;
      if (params.currentStopovers) {
        try {
          const parsed = JSON.parse(params.currentStopovers as string);
          if (Array.isArray(parsed)) {
            latestStopovers = parsed;
            setStopovers(parsed);
          }
        } catch (e) {
          console.warn('Failed to parse currentStopovers', e);
        }
      }

      // Handle pickup location
      if (params.pickupName && params.pickupLat && params.pickupLng) {
        const locationData: LocationData = {
          name: params.pickupName as string,
          lat: parseFloat(params.pickupLat as string),
          lng: parseFloat(params.pickupLng as string),
        };
        setFrom(locationData.name);
        setFromLocation(locationData);
        shouldClearParams = true;
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
        shouldClearParams = true;
      }

      // Handle stopover location
      if (
        params.stopoverName &&
        params.stopoverLat &&
        params.stopoverLng &&
        params.stopoverIndex
      ) {
        const stopoverIndex = parseInt(params.stopoverIndex as string, 10);
        const stopoverData: StopoverData = {
          name: params.stopoverName as string,
          coordinates: {
            lat: parseFloat(params.stopoverLat as string),
            lng: parseFloat(params.stopoverLng as string),
          },
        };

        // Use latestStopovers array from params (if any)
        setStopovers(prev => {
          const arr = Array.isArray(latestStopovers) ? [...latestStopovers] : [...prev];
          if (stopoverIndex < arr.length) {
            arr[stopoverIndex] = stopoverData;
          } else if (stopoverIndex === arr.length) {
            arr.push(stopoverData);
          } else {
            console.warn("Trying to set a stopover at a too high index");
            return prev;
          }
          return arr;
        });
        shouldClearParams = true;
      }

      // Clear all location params at once to prevent re-processing
      if (shouldClearParams) {
        router.setParams({
          pickupName: undefined,
          pickupLat: undefined,
          pickupLng: undefined,
          dropoffName: undefined,
          dropoffLat: undefined,
          dropoffLng: undefined,
          stopoverName: undefined,
          stopoverLat: undefined,
          stopoverLng: undefined,
          stopoverIndex: undefined,
          currentStopovers: undefined,
        });
      }
    }, [params])
  );

  const formattedDateTime = dateTime
    ? `${dateTime.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}, ${String(
        dateTime.getHours(),
      ).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`
    : 'Select date & time';

  useEffect(() => {
    if (!isFemale && femaleOnly) {
      setFemaleOnly(false);
    }
  }, [isFemale, femaleOnly]);

  const addStopover = () => {
    if (stopovers.length < 3) {
      console.log('Adding new stopover. Current length:', stopovers.length);
      const newStopover = { name: '', coordinates: { lat: 0, lng: 0 } };
      setStopovers(prev => {
        const updated = [...prev, newStopover];
        console.log('Stopovers after adding:', updated);
        return updated;
      });
    } else {
      console.log('Cannot add more stopovers. Maximum of 3 reached.');
      Alert.alert('Maximum Reached', 'You can add up to 3 stopovers only.');
    }
  };

  const removeStopover = (index: number) => {
    setStopovers(prev => {
      const updated = prev.filter((_, idx) => idx !== index);
      console.log('Stopovers after removing index', index, ':', updated);
      return updated;
    });
  };

  const navigateToLocationPicker = (type: 'pickup' | 'dropoff' | 'stopover', stopoverIndex?: number) => {
    // Save current locations to global state before navigating
    const state: any = {
      currentPickup: fromLocation ? JSON.stringify(fromLocation) : undefined,
      currentDropoff: toLocation ? JSON.stringify(toLocation) : undefined,
      currentPickupName: from,
      currentDropoffName: to,
      context: 'create', // Add context to differentiate from search form
      currentStopovers: JSON.stringify(stopovers),
    };

    // Add stopover index if it's a stopover selection
    if (type === 'stopover' && stopoverIndex !== undefined) {
      state.stopoverIndex = stopoverIndex.toString();
    }
    
    router.push({ 
      pathname: '/(modals)/location-picker', 
      params: { type, ...state } 
    });
  };

  const getRecommendedPrice = async () => {
    if (!fromLocation || !toLocation || !dateTime) {
      return; // Don't show errors, just return silently
    }

    const token = await auth().currentUser?.getIdToken();
    if (!token) return;

    setIsLoadingPrice(true);
    setRecommendedPrice(null);

    try {
      const dateStr = dateTime.toISOString().split('T')[0];
      const timeStr = dateTime.toTimeString().slice(0, 5);

      // Updated payload to match RidePlanDto from backend
      const pricePayload = {
        startPoint: { lat: fromLocation.lat, lng: fromLocation.lng },
        endPoint: { lat: toLocation.lat, lng: toLocation.lng },
        date: dateStr,
        time: timeStr,
      };

      console.log('Getting price recommendation for:', pricePayload);

      const response = await fetch(`${BASE_URL}/rides/recommend-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pricePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Price recommendation failed:', errorText);
        return;
      }

      const result = await response.json();
      console.log('Price recommendation result:', result);

      if (result.recommendedPrice) {
        setRecommendedPrice(result.recommendedPrice);
        // Don't auto-fill the price - just show recommendation
      }
    } catch (error: any) {
      console.error('Price recommendation error:', error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Auto-calculate price when all required data is available
  useEffect(() => {
    if (fromLocation && toLocation && dateTime) {
      getRecommendedPrice();
    } else {
      setRecommendedPrice(null);
    }
  }, [fromLocation, toLocation, dateTime]);

  // Ride Conflict Check
  const checkRideConflict = async (date: string, time: string) => {
    try {
      const token = await auth().currentUser?.getIdToken();
      if (!token) return { hasConflict: false };

      const response = await fetch(
        `${BASE_URL}/rides/check-conflict?date=${date}&time=${time}`,
        {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        }
      );

      if (!response.ok) {
        // If there's an error, it might be a conflict
        const errorData = await response.json();
        if (response.status === 400) {
          // Bad request usually means conflict
          return { hasConflict: true, message: errorData.message };
        }
        return { hasConflict: false };
      }

      const result = await response.json();
      return { hasConflict: false, message: result.message };
    } catch (error) {
      console.error('Error checking ride conflict:', error);
      return { hasConflict: false }; // Don't block creation if check fails
    }
  };

  const handleCreate = async () => {
    if (!from || !to || !dateTime || !passengerCount || !price) {
      Alert.alert('Missing Info', 'Please fill all the fields');
      return;
    }

    if (!fromLocation || !toLocation) {
      Alert.alert('Missing Location', 'Please select pickup and dropoff locations from the map');
      return;
    }

    // Validate stopovers - ensure all added stopovers have coordinates
    const validStopovers = stopovers.filter(stopover => 
      stopover.name.trim() !== '' && stopover.coordinates.lat !== 0 && stopover.coordinates.lng !== 0
    );

    if (stopovers.some(stopover => stopover.name.trim() !== '' && (stopover.coordinates.lat === 0 || stopover.coordinates.lng === 0))) {
      Alert.alert('Invalid Stopover', 'Please select all stopover locations from the map');
      return;
    }

    const token = await auth().currentUser?.getIdToken();
    if (!token) {
      Alert.alert('Error', 'Unable to authenticate user');
      return;
    }

    const dateStr = dateTime.toISOString().split('T')[0];
    const timeStr = dateTime.toTimeString().slice(0, 5);

    // NEW: Check for ride conflicts before creating
    const conflictCheck = await checkRideConflict(dateStr, timeStr);
    if (conflictCheck.hasConflict) {
      Alert.alert(
        'Schedule Conflict', 
        conflictCheck.message || 'You have another ride scheduled around this time',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Create Anyway', 
            style: 'destructive',
            onPress: () => proceedWithRideCreation(dateStr, timeStr, validStopovers, token)
          }
        ]
      );
      return;
    }

    // No conflict, proceed with creation
    await proceedWithRideCreation(dateStr, timeStr, validStopovers, token);
  };

  // Extract the actual ride creation logic into a separate function
  const proceedWithRideCreation = async (dateStr: string, timeStr: string, validStopovers: any[], token: string) => {
    try {
      // Prepare waypoints in the correct format for backend (Waypoint objects)
      const waypoints = validStopovers.length > 0 ? validStopovers.map(stopover => ({
        coordinates: {
          lat: stopover.coordinates.lat,
          lng: stopover.coordinates.lng
        },
        label: stopover.name
      })) : undefined;

      // Updated payload structure to match CreateRideDto from backend
      const ridePayload = {
        // From RidePlanDto
        startPoint: { lat: fromLocation!.lat, lng: fromLocation!.lng },
        endPoint: { lat: toLocation!.lat, lng: toLocation!.lng },
        date: dateStr,
        time: timeStr,
        
        // From CreateRideDto
        startLocation: from,
        endLocation: to,
        pricePerSeat: Number(price),
        availableSeats: Number(passengerCount),
        femaleOnly: femaleOnly || undefined, // Only send if true
        waypoints: waypoints,
        comments: comment.trim() || undefined, // Backend expects 'comments' not 'comment'
      };

      console.log('Creating ride with payload:', ridePayload);

      const response = await fetch(`${BASE_URL}/rides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ridePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create ride error:', errorText);
        throw new Error(errorText);
      }

      const result = await response.json();
      console.log('Ride created successfully:', result);

      Alert.alert('Success', result.message || 'Ride created successfully!', [
        { text: 'OK', onPress: () => {
          // Reset form
          setFrom('');
          setTo('');
          setFromLocation(null);
          setToLocation(null);
          setPassengerCount('');
          setPrice('');
          setFemaleOnly(false);
          setDateTime(null);
          setStopovers([]);
          setComment('');
          setRecommendedPrice(null);
        }}
      ]);
    } catch (err: any) {
      console.error('Create ride failed:', err);
      Alert.alert('Error', err.message || 'Ride creation failed');
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="w-full items-center"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 120 }}
          className="w-full"
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

            {/* Stopovers */}
            {stopovers.map((stopover, idx) => (
              <View key={idx} className="mb-3 mx-4">
                <View className="flex-row items-center border-b border-gray-400">
                  <Ionicons name="location-outline" size={18} color="#00BD5F" />
                  <Pressable
                    onPress={() => navigateToLocationPicker('stopover', idx)}
                    className="ml-2 flex-1"
                  >
                    <Text className={`text-lg font-[Afacad] py-3 ${
                      stopover.name ? 'text-black' : 'text-[#A0AEC0]'
                    }`}>
                      {stopover.name || `Select stopover ${idx + 1}`}
                    </Text>
                  </Pressable>
                  <View className="flex-row items-center">
                    {stopover.name && stopover.coordinates.lat !== 0 && (
                      <Ionicons name="checkmark-circle" size={20} color="#00BD5F" style={{ marginRight: 8 }} />
                    )}
                    <Pressable onPress={() => removeStopover(idx)}>
                      <Ionicons name="close-circle" size={20} color="#ccc" />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}

            {stopovers.length < 3 && (
              <Pressable onPress={addStopover} className="mb-3 mx-4">
                <Text className="text-[#00BD5F] font-[Afacad] text-base">+ Add Stopover</Text>
              </Pressable>
            )}

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
                  placeholder="Max passengers"
                  placeholderTextColor="#A0AEC0"
                  className="ml-2 flex-1 text-lg font-[Afacad] py-3"
                />
              </View>
            </View>

            {/* Price */}
            <View className="mb-1 mx-4">
              <View className="flex-row items-center border-b border-gray-400">
                <Ionicons name="pricetag-outline" size={18} color="#00BD5F" />
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  placeholder="Price per seat (AED)"
                  placeholderTextColor="#A0AEC0"
                  className="ml-2 flex-1 text-lg font-[Afacad] py-3"
                />
              </View>
              
              {/* Recommended Price Display */}
              <View className="mt-2 ml-2">
                {isLoadingPrice ? (
                  <View className="flex-row items-center">
                    <Ionicons name="sync" size={14} color="#666" />
                    <Text className="text-sm text-gray-500 font-[Afacad] ml-2">
                      Calculating recommended price...
                    </Text>
                  </View>
                ) : recommendedPrice ? (
                  <Text className="text-sm font-[Afacad] font-medium">
                    <Text className="text-black">Recommended price: </Text>
                    <Text className="text-[#00BD5F]">{recommendedPrice} AED</Text>
                  </Text>
                ) : (fromLocation && toLocation && dateTime) && !isLoadingPrice ? (
                  <Text className="text-sm text-gray-400 font-[Afacad]">
                    Unable to calculate recommended price
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Female-only Toggle - Show but disable for non-female users */}
            <View className="flex-row justify-between items-center mt-4 mx-4">
              <View className="flex-1">
                <Text className="text-xl font-[Afacad] text-gray-700">Female-only</Text>
                {!isFemale && (
                  <Text className="text-sm font-[Afacad] text-gray-500 mt-1">
                    Only available for female users
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

            {/* Comment Field */}
            <View className="m-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#00BD5F" />
                <Text className="ml-2 text-[16px] text-black font-[Afacad]">
                  Leave a comment <Text className="text-gray-400">(optional)</Text>
                </Text>
              </View>

              <View className="border border-gray-300 rounded-md px-3 py-2 bg-white">
                <TextInput
                  placeholder="Add any notes for passengers (e.g. okay with kids, no heavy luggage)"
                  placeholderTextColor="#A0AEC0"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="text-lg font-[Afacad] text-black"
                  maxLength={200}
                />
              </View>
              <Text className="text-xs text-gray-500 mt-1 font-[Afacad]">
                {comment.length}/200 characters
              </Text>
            </View>

            {/* Create Ride Button */}
            <Pressable
              onPress={handleCreate}
              style={{ backgroundColor: '#00BD5F' }}
              className="rounded-xl py-3 items-center mt-3"
            >
              <Text className="text-white text-xl text-base font-[Afacad]">Create Ride</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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

export default CreateRideForm;