// components/UpcomingRideCard.tsx - i18n integrated
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

interface UpcomingRideCardProps {
  rideId: string;
  departureTime: string;
  from: string;
  to: string;
  userRole: 'driver' | 'passenger';
  status?: string;
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
  status,
  vehicle,
  passengerCount
}) => {
  const router = useRouter();
  const { t } = useTranslation('components/UpcomingRideCard');

  // Get dynamic title and color based on status
  const getRideStatusInfo = () => {
    switch (status) {
      case 'departed':
      case 'ongoing':
        return {
          title: t('status.active'),
          iconColor: '#FF6B35',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-700'
        };
      case 'completed':
        return {
          title: t('status.completed'),
          iconColor: '#4CAF50',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700'
        };
      case 'in-progress':
      default:
        return {
          title: t('status.upcoming'),
          iconColor: '#00BD5F',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700'
        };
    }
  };

  const statusInfo = getRideStatusInfo();

  const handleCardPress = () => {
    console.log('🚗 UpcomingRideCard pressed:', { rideId, userRole, status });
    
    router.push({
      pathname: '/ride-details',
      params: {
        rideId,
        userRole,
        status,
        vehicle: vehicle ? JSON.stringify(vehicle) : undefined,
        passengerCount: passengerCount?.toString(),
      },
    });
  };

  // Format time from ISO string or timestamp
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return timeString;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return timeString;
    }
  };

  // Format date from ISO string or timestamp  
  const formatDate = (timeString: string) => {
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return '';
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      if (date.toDateString() === today.toDateString()) return t('dates.today');
      if (date.toDateString() === tomorrow.toDateString()) return t('dates.tomorrow');
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Truncate long addresses
  const truncateAddress = (address: string, maxLength: number = 30) => {
    if (!address || typeof address !== 'string') return t('unknownLocation');
    return address.length > maxLength ? `${address.substring(0, maxLength)}...` : address;
  };

  // Safe string conversion
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  console.log('🚗 UpcomingRideCard rendering:', {
    rideId,
    userRole,
    status,
    title: statusInfo.title,
    from: safeString(from),
    to: safeString(to),
    hasVehicle: !!vehicle,
    passengerCount
  });

  return (
    <Pressable
      onPress={handleCardPress}
      className="self-center w-[80%] bg-white rounded-xl p-4 mb-6 shadow-md border border-gray-200 active:bg-gray-50"
    >
      {/* Header - ✨ UPDATED: Dynamic title and colors */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons name="car-outline" size={20} color={statusInfo.iconColor} />
          <Text className="ml-2 text-lg font-semibold text-black font-[Afacad]">
            {statusInfo.title}
          </Text>
        </View>
        <View className={`${statusInfo.bgColor} px-3 py-1 rounded-full`}>
          <Text className={`${statusInfo.textColor} text-sm font-[Afacad] font-medium`}>
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
          {truncateAddress(safeString(from))}
        </Text>
        
        {/* Arrow immediately after starting address */}
        <View className="px-2 justify-center items-center">
          <Ionicons name="arrow-forward" size={16} color="#666" />
        </View>
        
        {/* Destination address - takes remaining space */}
        <View className="flex-1">
          <Text className="text-black text-base font-[Afacad] font-medium" numberOfLines={1}>
            {truncateAddress(safeString(to))}
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
                {safeString(vehicle.make)} {safeString(vehicle.model)} • {safeString(vehicle.plateNumber)}
              </Text>
            </>
          )}
          {userRole === 'driver' && passengerCount !== undefined && (
            <>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text className="ml-2 text-gray-600 font-[Afacad] text-sm">
                {passengerCount} {passengerCount === 1 ? t('passenger') : t('passengers')}
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
