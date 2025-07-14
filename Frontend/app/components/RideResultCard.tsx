import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface RideResultCardProps {
  departureTime: string;
  arrivalTime: string;
  duration: string;
  from: string;
  to: string;
  price: string;
  driverName: string;
  driverRating: number;
  driverImage?: string;
  availableSeats?: number;
  femaleOnly?: boolean;
  rideId?: string;
  // Vehicle information from backend
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehiclePlateNumber?: string;
}

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
  availableSeats,
  femaleOnly,
  rideId,
  vehicleMake,
  vehicleModel,
  vehicleColor,
  vehiclePlateNumber,
}) => {
  const router = useRouter();

  const handleCardPress = () => {
    if (rideId) {
      // Navigate to ride details screen with vehicle information
      router.push({
        pathname: '/(tabs)/RideDetailsScreen',
        params: {
          rideId,
          departureTime,
          arrivalTime,
          duration,
          from,
          to,
          price,
          driverName,
          driverRating: driverRating.toString(),
          availableSeats: availableSeats?.toString(),
          femaleOnly: femaleOnly ? '1' : '0',
          // Pass vehicle information
          vehicleMake: vehicleMake || '',
          vehicleModel: vehicleModel || '',
          vehicleColor: vehicleColor || '',
          vehiclePlateNumber: vehiclePlateNumber || '',
        }
      });
    }
  };

  // Display vehicle info in the card if available
  const vehicleDisplay = vehicleMake && vehicleModel 
    ? `${vehicleColor} ${vehicleMake} ${vehicleModel} • ${vehiclePlateNumber}`
    : 'Vehicle details available';

  return (
    <Pressable 
      onPress={handleCardPress}
      className="bg-[#F3F3F3] rounded-2xl p-4 mb-4 shadow border border-gray-100 active:bg-gray-200"
    >
      {/* Top Row: Ride Info */}
      <View className="flex-row justify-between items-start min-h-[70px]">
        {/* Ride Route Details */}
        <View className="flex-row items-center justify-start flex-1">
          {/* Left: Time & Duration */}
          <View className="items-end pr-2">
            <Text className="text-md font-bold font-[Afacad]">{departureTime}</Text>
            <Text className="text-xs text-gray-500 font-[Afacad]">{duration}</Text>
            <Text className="text-md font-bold mt-1 font-[Afacad]">{arrivalTime}</Text>
          </View>

          {/* Center: Line & Circles */}
          <View className="items-center mx-2">
            <Ionicons name="ellipse-outline" size={10} color="#00BD5F" />
            <View className="w-px h-8 bg-[#00BD5F]" />
            <Ionicons name="ellipse-outline" size={10} color="#00BD5F" />
          </View>

          {/* Right: Locations */}
          <View className="ml-2 flex-1">
            <Text className="text-md font-semibold font-[Afacad]" numberOfLines={1}>
              {from}
            </Text>
            <View className="h-5" />
            <Text className="text-md font-semibold font-[Afacad]" numberOfLines={1}>
              {to}
            </Text>
          </View>
        </View>

        {/* Right Side: Price and Info */}
        <View className="items-end ml-4">
          <Text className="text-lg font-bold text-black font-[Afacad]">{price} AED</Text>
          {availableSeats && (
            <Text className="text-xs text-gray-500 font-[Afacad] mt-1">
              {availableSeats} seat{availableSeats !== 1 ? 's' : ''} left
            </Text>
          )}
        </View>
      </View>

      {/* Badges Row */}
      {femaleOnly && (
        <View className="flex-row mb-2">
          <View className="bg-pink-100 px-2 py-1 rounded-full">
            <Text className="text-xs text-pink-600 font-[Afacad] font-medium">Female-only</Text>
          </View>
        </View>
      )}

      {/* Bottom Row: Driver Info */}
      <View className="border-t border-gray-300 mt-2 pt-4 pl-4 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-full items-center justify-center overflow-hidden bg-[#00BD5F]">
            <Ionicons name="person" size={22} color="white" />
          </View>
          <View className="pl-2 flex-1">
            <View className="flex-row items-center">
              <Text className="font-[Afacad] text-base font-medium">{driverName}</Text>
              <View className="flex-row items-center ml-2">
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text className="text-sm text-gray-500 font-[Afacad] ml-1">
                  {(driverRating || 0).toFixed(1)}
                </Text>
              </View>
            </View>
            <Text className="text-sm text-gray-500 font-[Afacad]" numberOfLines={1}>
              {vehicleDisplay}
            </Text>
          </View>
        </View>

        {/* Book Now Button */}
        <Pressable 
          onPress={handleCardPress}
          className="bg-[#00BD5F] px-4 py-2 rounded-xl"
        >
          <Text className="text-white font-[Afacad] text-sm font-semibold">
            Book Now
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

export default RideResultCard;