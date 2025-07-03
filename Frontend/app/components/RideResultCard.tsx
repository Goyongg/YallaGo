import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RideResultCardProps } from '../../interfaces/interfaces';

const RideResultCard: React.FC<RideResultCardProps> = ({
  departureTime,
  arrivalTime,
  duration,
  from,
  to,
  price,
  driverName,
  driverRating,
  driverImage,
}) => {
  return (
    <View className="bg-[#F3F3F3] rounded-2xl p-4 mb-8 shadow border border-gray-100">
      {/* Top Row: Ride Info */}
      <View className="flex-row justify-between items-start min-h-[70px]">
        {/* Ride Route Details */}
        <View className="flex-row items-center justify-start">
          {/* Left: Time & Duration */}
          <View className="items-end pr-2">
            <Text className="text-md font-bold">{departureTime}</Text>
            <Text className="text-xs text-gray-500">{duration}</Text>
            <Text className="text-md font-bold mt-1">{arrivalTime}</Text>
          </View>

          {/* Center: Line & Circles */}
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

        {/* Price */}
        <Text className="text-lg font-bold text-black">{price} AED</Text>
      </View>

      <View className="border-t border-gray-300 mt-2 pt-4 pl-4 flex-row items-center">
        <View className="w-10 h-10 rounded-full items-center justify-center overflow-hidden">
          <Ionicons name="person" size={22} color="green" />
        </View>
        <View className="pl-2">
          <Text className="font-[Afacad] text-base">{driverName}</Text>
          <Text className="text-sm text-gray-500">★ {driverRating.toFixed(1)}</Text>
        </View>
      </View>
    </View>
  );
};

export default RideResultCard;
