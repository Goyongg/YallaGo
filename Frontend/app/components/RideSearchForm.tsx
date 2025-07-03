import React, { useState } from 'react';
import { View, Text, TextInput, Switch, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RideSearchFormProps } from '../../interfaces/interfaces';
import DateTimePickerModal from './DateTimePickerModal';
import { saveRecentSearch } from '../../utils/recentSearchStorage';

const RideSearchForm: React.FC<RideSearchFormProps> = ({
  femaleOnly,
  setFemaleOnly,
  passengerCount,
  setPassengerCount,
}) => {
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const router = useRouter();

  const formattedDateTime = dateTime
    ? `${dateTime.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}, ${String(
        dateTime.getHours(),
      ).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`
    : 'Select date & time';

  const handleSearch = async () => {
    if (!from || !to) {
      // TODO: Show some validation feedback if necessary
      return;
    }

    await saveRecentSearch({
      from,
      to,
      passengers: Number(passengerCount || '1'),
      date: dateTime?.toISOString(),
      femaleOnly,
    });

    router.push({
      pathname: '/SearchResultsScreen',
      params: {
        from,
        to,
        date: dateTime?.toISOString() || '',
        passengerCount: passengerCount || '1',
        femaleOnly: femaleOnly ? '1' : '0',
      },
    });
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="w-full items-center"
      >
        <View className="w-[80%] bg-[#F3F3F3] shadow-md rounded-xl p-4 mb-6 border border-gray-200">
          {/* From */}
          <View className="mb-3">
            <View className="flex-row items-center border border-gray-300 rounded-md px-3 h-14 min-h-[56px]">
              <Ionicons name="radio-button-on" size={16} color="#00BD5F" />
              <TextInput
                placeholder="Enter starting point"
                value={from}
                onChangeText={setFrom}
                className="ml-2 flex-1 text-lg font-[Afacad]"
              />
            </View>
          </View>

          {/* To */}
          <View className="mb-3">
            <View className="flex-row items-center border border-gray-300 rounded-md px-3 h-14 min-h-[56px]">
              <Ionicons name="radio-button-on" size={16} color="#00BD5F" />
              <TextInput
                placeholder="Enter destination"
                value={to}
                onChangeText={setTo}
                className="ml-2 flex-1 text-lg font-[Afacad]"
              />
            </View>
          </View>

          {/* Date & Time Picker Trigger */}
          <View className="mb-3">
            <View className="flex-row items-center border border-gray-300 rounded-md px-3 h-14 min-h-[56px]">
              <Ionicons name="calendar-outline" size={18} color="#00BD5F" />
              <Pressable onPress={() => setPickerVisible(true)} className="ml-2 flex-1">
                <Text className="text-lg font-[Afacad] text-black">{formattedDateTime}</Text>
              </Pressable>
            </View>
          </View>

          {/* Passengers */}
          <View className="mb-3">
            <View className="flex-row items-center border border-gray-300 rounded-md px-3 h-14 min-h-[56px]">
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
          <View className="flex-row justify-between items-center mt-1">
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
            style={{ backgroundColor: '#00BD5F' }}
            className="rounded-xl py-3 items-center mt-3"
          >
            <Text className="text-white text-xl text-base font-[Afacad]">Search Rides</Text>
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
