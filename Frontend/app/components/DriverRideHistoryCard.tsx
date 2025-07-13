import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DriverHistoryRideCardProps } from '@/interfaces/interfaces';

interface EnhancedDriverHistoryRideCardProps extends DriverHistoryRideCardProps {
  bookedSeats?: number;
  status?: string;
}

const DriverRideHistoryCard: React.FC<EnhancedDriverHistoryRideCardProps> = ({
  id,
  departureTime,
  arrivalTime,
  duration,
  from,
  to,
  price,
  bookedSeats = 0,
  status = 'completed',
}) => {
  const truncateText = (text: string, maxLength: number = 12) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return {
          text: 'Completed',
          bgColor: 'bg-[#00BD5F]',
          textColor: 'text-white'
        };
      case 'cancelled':
        return {
          text: 'Cancelled',
          bgColor: 'bg-red-500',
          textColor: 'text-white'
        };
      default:
        return {
          text: 'Completed',
          bgColor: 'bg-[#00BD5F]',
          textColor: 'text-white'
        };
    }
  };

  const statusConfig = getStatusDisplay(status);

  return (
    <View className="bg-[#F3F3F3] rounded-2xl p-4 mb-6 shadow-sm border border-gray-200">
      {/* Ride Route Info */}
      <View className="flex-row justify-between items-start min-h-[70px]">
        <View className="flex-row items-center flex-1 mr-3">
          {/* Left: Time */}
          <View className="items-end pr-2">
            <Text className="text-md font-bold text-gray-900">{departureTime}</Text>
            <Text className="text-xs text-gray-500">{duration}</Text>
            <Text className="text-md font-bold text-gray-900 mt-1">{arrivalTime}</Text>
          </View>

          {/* Middle: Line */}
          <View className="items-center mx-2">
            <Ionicons name="ellipse-outline" size={10} color="#374151" />
            <View className="w-px h-8 bg-gray-400" />
            <Ionicons name="ellipse-outline" size={10} color="#374151" />
          </View>

          {/* Right: Locations */}
          <View className="ml-2 flex-1">
            <Text className="text-md font-semibold text-gray-900" numberOfLines={1}>
              {truncateText(from, 15)}
            </Text>
            <View className="h-5" />
            <Text className="text-md font-semibold text-gray-900" numberOfLines={1}>
              {truncateText(to, 15)}
            </Text>
          </View>
        </View>

        {/* Right: Price */}
        <View className="items-end">
          <Text className="text-lg font-bold text-gray-900">{price}</Text>
          <Text className="text-xs text-gray-500">AED</Text>
        </View>
      </View>

      {/* Divider Line */}
      <View className="h-[1px] bg-gray-300 my-3" />

      {/* Footer */}
      <View className="flex-col space-y-2">
        {/* Passenger info and earnings */}
        <View className="flex-row justify-between items-center pb-3">
          <View className="flex-row items-center flex-wrap">
            <Text className="text-sm text-gray-600 font-[Afacad]">
              🧍 {bookedSeats > 0 ? `${bookedSeats} passenger${bookedSeats > 1 ? 's' : ''}` : 'No passengers'}
            </Text>
            {bookedSeats > 0 && (
              <Text className="text-sm text-[#00BD5F] font-semibold font-[Afacad] ml-2">
                • Earned {parseInt(price) * bookedSeats} AED
              </Text>
            )}
          </View>
          <Text className={`text-sm px-3 py-1 rounded-full font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}>
            {statusConfig.text}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default DriverRideHistoryCard;