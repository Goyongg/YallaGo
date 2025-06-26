import React, { useState } from 'react';
import { View, Text, TextInput, Switch, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RideSearchFormProps } from '../../interfaces/interfaces';
import DateTimePickerModal from './DateTimePickerModal';

const RideSearchForm: React.FC<RideSearchFormProps> = ({
  femaleOnly,
  setFemaleOnly,
  passengerCount,
  setPassengerCount,
}) => {
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const formattedDateTime = dateTime
    ? `${dateTime.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}, ${String(
        dateTime.getHours(),
      ).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`
    : 'Select date & time';

  return (
    <>
      <View className="self-center w-[80%] aspect-[303/313] bg-[#F3F3F3] shadow-md rounded-xl p-4 mb-6 border border-gray-200">
        {/* From */}
        <View className="mb-3">
          <View className="flex-row items-center border border-gray-300 rounded-md px-3 py-2">
            <Ionicons name="radio-button-on" size={16} color="#00BD5F" />
            <TextInput placeholder="Enter starting point" className="ml-2 flex-1 text-lg font-[Afacad]" />
          </View>
        </View>

        {/* To */}
        <View className="mb-3">
          <View className="flex-row items-center border border-gray-300 rounded-md px-3 py-2">
            <Ionicons name="radio-button-on" size={16} color="#00BD5F" />
            <TextInput placeholder="Enter destination" className="ml-2 flex-1 text-lg font-[Afacad]" />
          </View>
        </View>

        {/* Date & Time Picker Trigger */}
        <View className="mb-3">
          <View className="flex-row items-center border border-gray-300 rounded-md px-3 py-2">
            <Ionicons name="calendar-outline" size={18} color="#00BD5F" />
            <Pressable onPress={() => setPickerVisible(true)} className="ml-2 flex-1">
              <Text className="text-lg font-[Afacad] text-black">{formattedDateTime}</Text>
            </Pressable>
          </View>
        </View>

        {/* Passengers */}
        <View className="mb-3">
          <View className="flex-row items-center border border-gray-300 rounded-md px-3 py-2">
            <Ionicons name="person-outline" size={18} color="#00BD5F" />
            <TextInput
              value={passengerCount}
              onChangeText={setPassengerCount}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor="#A0AEC0"
              className="ml-2 flex-1 text-lg font-[Afacad]"
            />
          </View>
        </View>

        {/* Toggle */}
        <View className="flex-row justify-between items-center">
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
          onPress={() => {
            if (!dateTime) {
              setPickerVisible(true);
              return;
            }
            // TODO: Trigger your search with dateTime, passengerCount, femaleOnly, etc.
          }}
          style={{ backgroundColor: '#00BD5F' }}
          className="rounded-xl py-3 items-center mt-4"
        >
          <Text className="text-white text-xl text-base font-[Afacad]">Search Rides</Text>
        </Pressable>
      </View>

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
