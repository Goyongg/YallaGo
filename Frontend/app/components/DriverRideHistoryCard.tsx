import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DriverHistoryRideCardProps } from '@/interfaces/interfaces';

const DriverRideHistoryCard: React.FC<DriverHistoryRideCardProps> = ({
  departureTime,
  arrivalTime,
  duration,
  from,
  to,
  price,
}) => {
  return (
    <View className="bg-[#F3F3F3] rounded-2xl mb-4 overflow-hidden w-full">
      {/* Time & Route */}
      <View className="flex-row justify-between px-4 pt-4">
        <View className="items-start">
          <Text className="font-[Afacad] text-black text-base">{departureTime}</Text>
          <Text className="text-xs text-gray-500 font-[Afacad]">{duration}</Text>
          <Text className="font-[Afacad] text-black text-base mt-1">{arrivalTime}</Text>
        </View>
        <View className="justify-center items-center">
          <Ionicons name="ellipsis-vertical" size={24} color="#00BD5F" />
        </View>
        <View className="items-end">
          <Text className="font-[Afacad] text-black text-base">{from}</Text>
          <Text className="text-base font-[Afacad]">➜</Text>
          <Text className="font-[Afacad] text-black text-base">{to}</Text>
        </View>
      </View>

      {/* Divider */}
      <View className="h-[1px] bg-gray-300 my-3 mx-4" />

      {/* Price */}
      <View className="flex-row justify-between items-center px-4 pb-4">
        <Text className="font-[Afacad] text-sm text-gray-500">Ride completed</Text>
        <Text className="text-black font-[Afacad] text-lg">{price} AED</Text>
      </View>
    </View>
  );
};

export default DriverRideHistoryCard;
