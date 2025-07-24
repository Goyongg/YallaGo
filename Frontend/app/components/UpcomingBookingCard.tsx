// components/UpcomingBookingCard.tsx - Fixed syntax error
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface UpcomingBookingCardProps {
  id: string;
  rideId: string;
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
  vehicle?: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  stopovers?: string[];
}

const UpcomingBookingCard: React.FC<UpcomingBookingCardProps> = ({
  id,
  rideId,
  from,
  to,
  departureTime,
  arrivalTime,
  duration,
  totalCost,
  seatsBooked,
  status,
  driver,
  vehicle,
  stopovers,
}) => {
  const router = useRouter();

  const truncateText = (text: string, maxLength: number = 12) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleCardPress = () => {
    // ✅ Navigate to the new booking-details page
    console.log('🎯 Navigating to booking details with bookingId:', id);
    
    router.push({
      pathname: '/booking-details',
      params: {
        bookingId: id, // Use the real booking ID from Firebase
      },
    });
  };

  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          text: 'Pending',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700'
        };
      case 'confirmed':
        return {
          text: 'Confirmed',
          bgColor: 'bg-[#00BD5F]',
          textColor: 'text-white'
        };
      case 'ongoing':
        return {
          text: 'In Progress',
          bgColor: 'bg-blue-500',
          textColor: 'text-white'
        };
      default:
        return {
          text: 'Confirmed',
          bgColor: 'bg-[#00BD5F]',
          textColor: 'text-white'
        };
    }
  };

  const statusConfig = getStatusDisplay(status);
  // Don't modify location names - show them as-is from backend
  const fromLocation = from;
  const toLocation = to;

  return (
    <Pressable
      onPress={handleCardPress}
      className="bg-[#F3F3F3] rounded-2xl p-4 mb-6 shadow-sm border border-gray-200 active:bg-gray-50"
    >
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
              {truncateText(fromLocation, 15)}
            </Text>
            <View className="h-5" />
            <Text className="text-md font-semibold text-gray-900" numberOfLines={1}>
              {truncateText(toLocation, 15)}
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

      {/* Driver and Vehicle Info */}
      <View className="mb-3">
        {/* Driver Info */}
        <View className="flex-row items-center mb-2">
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

        {/* Vehicle Info - Only show if available */}
        {vehicle && (
          <View className="flex-row items-center mt-1">
            <Ionicons name="car-sport-outline" size={20} color="#6B7280" />
            <Text className="text-sm text-gray-600 font-[Afacad] ml-2">
              {vehicle.make} {vehicle.model} • {vehicle.color} • {vehicle.plateNumber}
            </Text>
          </View>
        )}

        {/* Stopovers - Only show if available */}
        {stopovers && stopovers.length > 0 && (
          <View className="flex-row items-center mt-1">
            <Ionicons name="flag-outline" size={16} color="#6B7280" />
            <Text className="text-xs text-gray-500 font-[Afacad] ml-2">
              {stopovers.length} stopover{stopovers.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Text className="text-sm text-gray-600 font-[Afacad]">
            🪑 {seatsBooked} seat{seatsBooked > 1 ? 's' : ''} booked
          </Text>
          <Text className="text-xs text-gray-500 font-[Afacad] ml-3">
            • Tap to view details
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <Text className={`text-sm px-3 py-1 rounded-full font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}>
            {statusConfig.text}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#00BD5F" className="ml-2" />
        </View>
      </View>
    </Pressable>
  );
};

export default UpcomingBookingCard;