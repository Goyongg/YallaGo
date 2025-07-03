import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RideResultCard from '../components/RideResultCard';
import { useRouter } from 'expo-router';

const SearchResultsScreen = () => {
  const router = useRouter();

  const searchParams = {
    from: 'Dubai',
    to: 'AbuDhabi',
    date: '2025-07-05',
    passengers: 1,
  };

  const rideDate = new Date(searchParams.date);
  const weekday = rideDate.toLocaleDateString(undefined, { weekday: 'short' });
  const dayMonth = rideDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  });
  const monthDay = rideDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  const year = rideDate.toLocaleDateString(undefined, { year: 'numeric' });

  const sampleRides = Array(6).fill({
    departureTime: '11:00',
    arrivalTime: '12:20',
    duration: '1 h 20',
    from: searchParams.from,
    to: searchParams.to,
    price: '52.0',
    driverName: 'Muhammad',
    driverRating: 4.9,
    driverImage: '',
  });

  return (
    <View className="flex-1 bg-white pt-[70px] items-center">
      {/* Inner content wrapper */}
      <View className="w-[80%] gap-3">
        {/* Header Row */}
        <View className="flex-row justify-between items-center mb-4 px-2 py-3 rounded-xl border border-black">
          {/* Left Side: Back Arrow and Text */}
          <View className="flex-row items-center gap-2">
            <Pressable onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color="green" />
            </Pressable>
            <View>
              <Text className="text-xl font-[Afacad]">
                {searchParams.from} → {searchParams.to}
              </Text>
              <Text className="text-md text-gray-500 font-[Afacad]">
                {weekday} {monthDay}, {searchParams.passengers} passenger(s)
              </Text>
            </View>
          </View>
        </View>

        {/* Date Label */}
        <Text className="text-xl mb-2">{dayMonth} {year}</Text>

        {/* List of Results */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {sampleRides.map((ride, idx) => (
            <RideResultCard key={idx} {...ride} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default SearchResultsScreen;
