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
    <View className="bg-[#F3F3F3] rounded-2xl p-4 mb-6 shadow border border-gray-100">
      {/* Ride Route Info */}
      <View className="flex-row justify-between items-start min-h-[70px]">
        <View className="flex-row items-center">
          {/* Left: Time */}
          <View className="items-end pr-2">
            <Text className="text-md font-bold">{departureTime}</Text>
            <Text className="text-xs text-gray-500">{duration}</Text>
            <Text className="text-md font-bold mt-1">{arrivalTime}</Text>
          </View>

          {/* Middle: Line */}
          <View className="items-center mx-2">
            <Ionicons name="ellipse-outline" size={10} color="black" />
            <View className="w-px h-8 bg-black" />
            <Ionicons name="ellipse-outline" size={10} color="black" />
          </View>

          {/* Right: Locations */}
          <View className="ml-2">
            <Text className="text-md font-semibold">{from}</Text>
            <View className="h-5" />
            <Text className="text-md font-semibold">{to}</Text>
          </View>
        </View>

        {/* Right: Price */}
        <Text className="text-lg font-bold text-black">{price} AED</Text>
      </View>

      {/* Divider Line */}
      <View className="h-[1px] bg-gray-300 my-3" />

      {/* Footer: Completed Label */}
      <View className="flex-row justify-end px-1">
        <Text className="text-sm text-white bg-gray-400 px-2 py-1 rounded-full font-[Afacad]">
          Ride completed
        </Text>
      </View>
    </View>
  );
};

export default DriverRideHistoryCard;
