// components/UpcomingRideCard.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface UpcomingRideCardProps {
  rideId: string;
  departureTime: string;
  from: string;
  to: string;
  userRole: 'driver' | 'passenger';
  // For passengers
  vehicle?: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  // For drivers
  passengerCount?: number;
}

const UpcomingRideCard: React.FC<UpcomingRideCardProps> = ({
  rideId,
  departureTime,
  from,
  to,
  userRole,
  vehicle,
  passengerCount
}) => {
  const router = useRouter();

  const handleCardPress = () => {
    router.push({
      pathname: '/ride-details',
      params: {
        rideId,
        userRole,
        vehicle: vehicle ? JSON.stringify(vehicle) : undefined,
        passengerCount: passengerCount?.toString(),
      },
    });
  };

  // Format time from ISO string or timestamp
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  // Format date from ISO string or timestamp  
  const formatDate = (timeString: string) => {
    try {
      const date = new Date(timeString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  // Truncate long addresses
  const truncateAddress = (address: string, maxLength: number = 30) => {
    return address.length > maxLength ? `${address.substring(0, maxLength)}...` : address;
  };

  return (
    <Pressable 
      onPress={handleCardPress}
      className="self-center w-[80%] bg-white rounded-xl p-4 mb-6 shadow-md border border-gray-200 active:bg-gray-50"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons name="car-outline" size={20} color="#00BD5F" />
          <Text className="ml-2 text-lg font-semibold text-black font-[Afacad]">
            Upcoming Ride
          </Text>
        </View>
        <View className="bg-green-100 px-3 py-1 rounded-full">
          <Text className="text-green-700 text-sm font-[Afacad] font-medium">
            {formatDate(departureTime)}
          </Text>
        </View>
      </View>

      {/* Time and Route */}
      <View className="flex-row items-center mb-2">
        <Text className="text-2xl font-bold text-black font-[Afacad]">
          {formatTime(departureTime)}
        </Text>
        <View className="flex-1 mx-3">
          <View className="flex-row items-center">
            <View className="w-2 h-2 bg-green-500 rounded-full" />
            <View className="flex-1 h-0.5 bg-gray-300 mx-2" />
            <Ionicons name="location-sharp" size={16} color="#00BD5F" />
          </View>
        </View>
      </View>

      {/* Route Details - Arrow follows starting address dynamically */}
      <View className="flex-row items-center mb-3">
        {/* Starting address - only takes space it needs */}
        <Text className="text-black text-base font-[Afacad] font-medium" numberOfLines={1}>
          {truncateAddress(from)}
        </Text>
        
        {/* Arrow immediately after starting address */}
        <View className="px-2 justify-center items-center">
          <Ionicons name="arrow-forward" size={16} color="#666" />
        </View>
        
        {/* Destination address - takes remaining space */}
        <View className="flex-1">
          <Text className="text-black text-base font-[Afacad] font-medium" numberOfLines={1}>
            {truncateAddress(to)}
          </Text>
        </View>
      </View>

      {/* Role-specific Information - Inline */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          {userRole === 'passenger' && vehicle && (
            <>
              <Ionicons name="car-sport-outline" size={16} color="#666" />
              <Text className="ml-2 text-gray-600 font-[Afacad] text-sm">
                {vehicle.make} {vehicle.model} • {vehicle.plateNumber}
              </Text>
            </>
          )}
          {userRole === 'driver' && passengerCount !== undefined && (
            <>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text className="ml-2 text-gray-600 font-[Afacad] text-sm">
                {passengerCount} {passengerCount === 1 ? 'passenger' : 'passengers'}
              </Text>
            </>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#00BD5F" />
      </View>
    </Pressable>
  );
};

export default UpcomingRideCard;