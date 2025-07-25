// components/BookingHistoryCard.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BookingHistoryCardProps {
  id: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  totalCost: string;
  seatsBooked: number;
  status: string;
  driver: {
    name: string;
    rating: number;
    phoneNumber: string;
  };
}

const BookingHistoryCard: React.FC<BookingHistoryCardProps> = ({
  id,
  from,
  to,
  departureTime,
  arrivalTime,
  duration,
  totalCost,
  seatsBooked,
  status,
  driver,
}) => {
  const truncateText = (text: string, maxLength: number = 15) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Helper function to clean up coordinate-based location names
  const cleanLocationName = (location: string) => {
    // Check if location looks like coordinates (contains comma and numbers)
    if (/^\d+\.\d+,\s*\d+\.\d+$/.test(location.trim())) {
      return 'Location'; // Replace coordinates with generic name
    }
    return location;
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
      case 'in-progress':
        return {
          text: 'In Progress',
          bgColor: 'bg-blue-500',
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
  const cleanFromLocation = cleanLocationName(from);
  const cleanToLocation = cleanLocationName(to);

  return (
    <View className="bg-[#F3F3F3] rounded-2xl p-4 mb-6 shadow-sm border border-gray-200">
      {/* Ride Route Info */}
      <View className="flex-row justify-between items-start min-h-[70px]">
        <View className="flex-row items-center flex-1 mr-3">
          {/* Left: Time */}
          <View className="items-end pr-2">
            <Text className="text-md font-bold text-gray-900">{departureTime}</Text>
            {duration !== 'N/A' && (
              <Text className="text-xs text-gray-500">{duration}</Text>
            )}
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
              {truncateText(cleanFromLocation, 15)}
            </Text>
            <View className="h-5" />
            <Text className="text-md font-semibold text-gray-900" numberOfLines={1}>
              {truncateText(cleanToLocation, 15)}
            </Text>
          </View>
        </View>

        {/* Right: Total Cost */}
        <View className="items-end">
          <Text className="text-lg font-bold text-gray-900">{totalCost}</Text>
          <Text className="text-xs text-gray-500">AED</Text>
        </View>
      </View>

      {/* Divider Line */}
      <View className="h-[1px] bg-gray-300 my-3" />

      {/* Driver Info (Simplified - No Vehicle Info) */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Ionicons name="person-circle-outline" size={20} color="#6B7280" />
            <Text className="text-sm text-gray-700 font-semibold font-[Afacad] ml-2">
              {driver.name}
            </Text>
            <View className="flex-row items-center ml-2">
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text className="text-xs text-gray-600 font-[Afacad] ml-1">
                {driver.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Text className="text-sm text-gray-600 font-[Afacad]">
            🪑 {seatsBooked} seat{seatsBooked > 1 ? 's' : ''} booked
          </Text>
        </View>
        
        <Text className={`text-sm px-3 py-1 rounded-full font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}>
          {statusConfig.text}
        </Text>
      </View>
    </View>
  );
};

export default BookingHistoryCard;