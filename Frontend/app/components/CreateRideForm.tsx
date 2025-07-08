import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Switch, Pressable, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from './DateTimePickerModal';
import auth from '@react-native-firebase/auth';
import { router, useGlobalSearchParams, useFocusEffect } from 'expo-router';

const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://10.128.24.33:3000';

interface LocationData {
  name: string;
  lat: number;
  lng: number;
}

const CreateRideForm: React.FC = () => {
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
  const [stopovers, setStopovers] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  // Handle location data from location picker
  useFocusEffect(
    useCallback(() => {
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
        });
      }
    }, [params])
  );

  const formattedDateTime = dateTime
    ? `${dateTime.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}, ${String(
        dateTime.getHours(),
      ).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`
    : 'Select date & time';

  const updateStopover = (index: number, value: string) => {
    const updated = [...stopovers];
    updated[index] = value;
    setStopovers(updated);
  };

  const addStopover = () => {
    if (stopovers.length < 3) {
      setStopovers([...stopovers, '']);
    }
  };

  const navigateToLocationPicker = (type: 'pickup' | 'dropoff') => {
    // Save current locations to global state before navigating
    const state = {
      currentPickup: fromLocation ? JSON.stringify(fromLocation) : undefined,
      currentDropoff: toLocation ? JSON.stringify(toLocation) : undefined,
      currentPickupName: from,
      currentDropoffName: to,
    };
    
    router.push({ 
      pathname: '/(modals)/location-picker', 
      params: { type, ...state } 
    });
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

    const token = await auth().currentUser?.getIdToken();
    if (!token) {
      Alert.alert('Error', 'Unable to authenticate user');
      return;
    }

    const filteredStopovers = stopovers.filter((s) => s.trim() !== '');

    const dateStr = dateTime.toISOString().split('T')[0];
    const timeStr = dateTime.toTimeString().slice(0, 5);

    const ridePayload = {
      startLocation: from,
      startPoint: { lat: fromLocation.lat, lng: fromLocation.lng },
      endLocation: to,
      endPoint: { lat: toLocation.lat, lng: toLocation.lng },
      date: dateStr,
      time: timeStr,
      pricePerSeat: Number(price),
      availableSeats: Number(passengerCount),
      femaleOnly,
      waypoints: filteredStopovers.length > 0 ? filteredStopovers : undefined,
      comment: comment.trim() || undefined,
    };

    try {
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
        throw new Error(errorText);
      }

      Alert.alert('Success', 'Ride created successfully!', [
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
        }}
      ]);
    } catch (err: any) {
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

            {/* Rest of the form remains the same... */}
            {stopovers.map((stop, idx) => (
              <View key={idx} className="mb-3 mx-4">
                <View className="flex-row items-center border-b border-gray-400">
                  <Ionicons name="location-outline" size={18} color="#00BD5F" />
                  <TextInput
                    placeholder={`Stopover ${idx + 1}`}
                    placeholderTextColor="#A0AEC0"
                    value={stop}
                    onChangeText={(text) => updateStopover(idx, text)}
                    className="ml-2 flex-1 text-lg font-[Afacad]"
                  />
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
                  className="ml-2 flex-1 text-lg font-[Afacad]"
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
                  className="ml-2 flex-1 text-lg font-[Afacad]"
                />
              </View>
            </View>

            {/* Female-only toggle */}
            <View className="flex-row justify-between items-center mt-4 mx-4">
              <Text className="text-xl font-[Afacad] text-gray-700">Female-only</Text>
              <Switch
                value={femaleOnly}
                onValueChange={setFemaleOnly}
                thumbColor={femaleOnly ? '#00BD5F' : '#f4f3f4'}
                trackColor={{ false: '#ccc', true: '#A8E2C5' }}
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
                />
              </View>
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