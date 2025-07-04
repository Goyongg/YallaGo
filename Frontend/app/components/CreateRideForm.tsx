import React, { useState } from 'react';
import { View, Text, TextInput, Switch, Pressable, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from './DateTimePickerModal';

const CreateRideForm: React.FC = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [passengerCount, setPassengerCount] = useState('');
  const [price, setPrice] = useState('');
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [stopovers, setStopovers] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const formattedDateTime = dateTime
    ? `${dateTime.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}, ${String(
        dateTime.getHours(),
      ).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`
    : 'Select date & time';

  // Helper to update specific stopover
  const updateStopover = (index: number, value: string) => {
    const updated = [...stopovers];
    updated[index] = value;
    setStopovers(updated);
  };

  // Add Stopover Field
  const addStopover = () => {
    if (stopovers.length < 3) {
      setStopovers([...stopovers, '']);
    }
  };

  const handleCreate = () => {
    if (!from || !to || !dateTime || !passengerCount || !price) {
      Alert.alert('Missing Info', 'Please fill all the fields');
      return;
    }

    const filteredStopovers = stopovers.filter((s) => s.trim() !== '');

    // TODO: Replace with backend logic
    console.log({
      from,
      to,
      stopovers: filteredStopovers,
      date: dateTime.toISOString(),
      passengerCount: Number(passengerCount),
      price: Number(price),
      femaleOnly,
      comment,
    });

    Alert.alert('Success', 'Ride created successfully!');
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
                <TextInput
                  placeholder="Enter starting point"
                  placeholderTextColor="#A0AEC0"
                  value={from}
                  onChangeText={setFrom}
                  className="ml-2 flex-1 text-lg font-[Afacad]"
                />
              </View>
            </View>

            {/* To */}
            <View className="mb-3 mx-4">
              <View className="flex-row items-center border-b border-gray-400">
                <Ionicons name="radio-button-on" size={16} color="#00BD5F" />
                <TextInput
                  placeholder="Enter destination"
                  placeholderTextColor="#A0AEC0"
                  value={to}
                  onChangeText={setTo}
                  className="ml-2 flex-1 text-lg font-[Afacad]"
                />
              </View>
            </View>

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
                  placeholder="Price per seat"
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
              {/* Label with icon */}
              <View className="flex-row items-center mb-2">
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#00BD5F" />
                <Text className="ml-2 text-[16px] text-black font-[Afacad]">
                  Leave a comment <Text className="text-gray-400">(optional)</Text>
                </Text>
              </View>

              {/* Multiline input */}
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
