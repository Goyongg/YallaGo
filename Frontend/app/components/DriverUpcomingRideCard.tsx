// components/DriverUpcomingRideCard.tsx - i18n integrated with preserved comments
import React, { useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DriverUpcomingRideCardProps } from '../../interfaces/interfaces';
import useRideActions from '../../hooks/useRideActions';
import { useTranslation } from 'react-i18next';

interface EnhancedDriverUpcomingRideCardProps extends DriverUpcomingRideCardProps {
  bookedSeats?: number;
  hasBookings?: boolean;
  onRideUpdated?: () => void;
}

const DriverUpcomingRideCard: React.FC<EnhancedDriverUpcomingRideCardProps> = ({
  id,
  departureTime,
  arrivalTime,
  duration,
  from,
  to,
  price,
  availableSeats,
  status,
  bookedSeats = 0,
  hasBookings = false,
  onRideUpdated,
}) => {
  const router = useRouter();
  const { startRide, endRide, deleteRide, loading } = useRideActions();
  const [actionLoading, setActionLoading] = useState<'start' | 'end' | 'delete' | null>(null);
  const { t } = useTranslation('components/DriverUpcomingRideCard');

  const truncateText = (text: string | any, maxLength: number = 12) => {
    if (text === null || text === undefined) return t('unknown');
    const safeText = String(text);
    if (safeText.length <= maxLength) return safeText;
    return safeText.substring(0, maxLength) + '...';
  };

  const handleCardPress = () => {
    // Navigate to the new driver-specific ride details page
    router.push({ pathname: '/(tabs)/driver-ride-details', params: { rideId: String(id) } });
  };

  const handleStartRide = async () => {
    Alert.alert(
      t('alerts.start.title'),
      t('alerts.start.message'),
      [
        { text: t('alerts.cancel'), style: 'cancel' },
        {
          text: t('alerts.start.confirm'),
          style: 'default',
          onPress: async () => {
            setActionLoading('start');
            const result = await startRide(String(id));
            setActionLoading(null);
            Alert.alert(result.success ? t('alerts.success') : t('alerts.error'), result.message);
            if (result.success) onRideUpdated?.();
          },
        },
      ]
    );
  };

  const handleEndRide = async () => {
    Alert.alert(
      t('alerts.end.title'),
      t('alerts.end.message'),
      [
        { text: t('alerts.cancel'), style: 'cancel' },
        {
          text: t('alerts.end.confirm'),
          style: 'destructive',
          onPress: async () => {
            setActionLoading('end');
            const result = await endRide(String(id));
            setActionLoading(null);
            Alert.alert(result.success ? t('alerts.success') : t('alerts.error'), result.message);
            if (result.success) onRideUpdated?.();
          },
        },
      ]
    );
  };

  const handleDeleteRide = async () => {
    if (hasBookings || bookedSeats > 0) {
      Alert.alert(t('alerts.delete.titleBlocked'), t('alerts.delete.messageBlocked'), [{ text: 'OK' }]);
      return;
    }

    Alert.alert(
      t('alerts.delete.title'),
      t('alerts.delete.message'),
      [
        { text: t('alerts.cancel'), style: 'cancel' },
        {
          text: t('alerts.delete.confirm'),
          style: 'destructive',
          onPress: async () => {
            setActionLoading('delete');
            const result = await deleteRide(String(id));
            setActionLoading(null);
            Alert.alert(result.success ? t('alerts.success') : t('alerts.error'), result.message);
            if (result.success) onRideUpdated?.();
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string | undefined) => {
    switch (String(status || '').toLowerCase()) {
      case 'upcoming': return 'bg-[#00BD5F]';
      case 'departed': return 'bg-orange-500';
      default: return 'bg-[#00BD5F]';
    }
  };

  const safeId = id ?? 'unknown';
  const safeDepartureTime = departureTime ?? '00:00';
  const safeArrivalTime = arrivalTime ?? '00:00';
  const safeDuration = duration ?? '0m';
  const safeFrom = from ?? t('unknown');
  const safeTo = to ?? t('unknown');
  const safePrice = price ?? '0';
  const safeAvailableSeats = typeof availableSeats === 'number' ? availableSeats : 0;
  const safeBookedSeats = typeof bookedSeats === 'number' ? bookedSeats : 0;
  const safeStatus = status ?? 'unknown';

  console.log('Status value:', status, typeof status);

  const normalizedStatus = safeStatus.toLowerCase();
  const shouldShowEndButton = normalizedStatus === 'departed';
  const shouldShowDeleteButton = normalizedStatus === 'upcoming' && !hasBookings && safeBookedSeats === 0;
  const shouldShowActionSection = shouldShowEndButton || shouldShowDeleteButton || safeBookedSeats > 0;

  return (
    <Pressable
      onPress={handleCardPress}
      className="bg-[#F3F3F3] rounded-2xl p-4 mb-6 shadow-sm border border-gray-200"
    >
      {/* Ride Route Info */}
      <View className="flex-row justify-between items-start min-h-[70px]">
        <View className="flex-row items-center flex-1 mr-3">
          {/* Left: Time */}
          <View className="items-end pr-2">
            <Text className="text-md font-bold text-gray-900">{safeDepartureTime}</Text>
            <Text className="text-xs text-gray-500">{safeDuration}</Text>
            <Text className="text-md font-bold text-gray-900 mt-1">{safeArrivalTime}</Text>
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
              {truncateText(safeFrom, 15)}
            </Text>
            <View className="h-5" />
            <Text className="text-md font-semibold text-gray-900" numberOfLines={1}>
              {truncateText(safeTo, 15)}
            </Text>
          </View>
        </View>

        {/* Right: Price */}
        <View className="items-end">
          <Text className="text-lg font-bold text-gray-900">{safePrice}</Text>
          <Text className="text-xs text-gray-500">AED</Text>
        </View>
      </View>

      {/* Divider Line */}
      <View className="h-[1px] bg-gray-300 my-3" />

      {/* Footer */}
      <View className="flex-col space-y-3">
        {/* Seats & Status Row */}
        <View className="flex-row justify-between items-center pb-3">
          <View className="flex-row items-center flex-wrap">
            <Text className="text-sm text-gray-600 font-[Afacad]">
              🧍 {t('seats.available', { count: safeAvailableSeats })}
            </Text>
            {safeBookedSeats > 0 && (
              <Text className="text-sm text-blue-600 font-[Afacad] ml-2">
                • {t('seats.booked', { count: safeBookedSeats })}
              </Text>
            )}
          </View>
          {safeStatus && (
            <View className="flex-grow items-end">
              <Text
                className={`text-center text-sm text-white px-3 py-1 rounded-full font-semibold ${getStatusColor(safeStatus)}`}
                style={{ minWidth: 85 }}
              >
                {t(`status.${normalizedStatus}`)}
              </Text>
            </View>
          )}
        </View>

        {/* Tap to view details hint with action buttons - FIXED CONDITION */}
        {shouldShowActionSection && (
          <View className="pt-2 border-t border-gray-200 flex-row justify-between items-center">
            <Text className="text-xs text-gray-500 font-[Afacad] flex-1 text-center">
              {t('tapToView')}
            </Text>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              {shouldShowDeleteButton && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteRide();
                  }}
                  disabled={loading || actionLoading !== null}
                  className={`px-2 py-1 rounded-lg flex-row items-center ${
                    loading || actionLoading !== null ? 'bg-gray-300' : 'bg-red-500'
                  }`}
                >
                  {actionLoading === 'delete' ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="trash-outline" size={18} color="white" />
                  )}
                </Pressable>
              )}

              {shouldShowEndButton && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEndRide();
                  }}
                  disabled={loading || actionLoading !== null}
                  className={`px-4 py-2 rounded-lg flex-row items-center ${
                    loading || actionLoading !== null ? 'bg-gray-300' : 'bg-blue-500'
                  }`}
                >
                  {actionLoading === 'end' ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="stop" size={14} color="white" />
                      <Text className="text-white text-xs font-bold ml-1 font-[Afacad]">
                        {t('actions.endRide')}
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
};

export default DriverUpcomingRideCard;
