import React from 'react';
import { View, Text, TextInput, Switch, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RideSearchFormProps } from '../../interfaces/interfaces';

const RideSearchForm: React.FC<RideSearchFormProps> = ({
  femaleOnly,
  setFemaleOnly,
  passengerCount,
  setPassengerCount,
}) => (
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

    {/* Date */}
    <View className="mb-3">
      <View className="flex-row items-center border border-gray-300 rounded-md px-3 py-2">
        <Ionicons name="calendar-outline" size={18} color="#00BD5F" />
        <TextInput
          placeholder="Select date"
          placeholderTextColor="#A0AEC0"
          className="ml-2 flex-1 text-lg font-[Afacad]"
        />
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
      <Text className=" text-xl font-[Afacad] text-gray-700">Female-only</Text>
      <Switch
        value={femaleOnly}
        onValueChange={setFemaleOnly}
        thumbColor={femaleOnly ? '#00BD5F' : '#f4f3f4'}
        trackColor={{ false: '#ccc', true: '#A8E2C5' }}
      />
    </View>

    {/* Search Button */}
    <Pressable
      onPress={() => {}}
      style={{ backgroundColor: '#00BD5F' }}
      className="rounded-xl py-3 items-center mt-4"
    >
      <Text className="text-white text-xl text-base font-[Afacad]">Search Rides</Text>
    </Pressable>
  </View>
);

export default RideSearchForm;