// i18n integration for RecentSearches.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecentSearch } from '../../interfaces/interfaces';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { BASE_URL } from '@/config';
import { useTranslation } from 'react-i18next';

const RecentSearches: React.FC<{ recentSearches: RecentSearch[] }> = ({ recentSearches }) => {
  const router = useRouter();
  const { t } = useTranslation('components/RecentSearches');
  const [searchingIndex, setSearchingIndex] = useState<number | null>(null);

  const limitedRecentSearches = recentSearches.slice(0, 3);

  const handleRecentSearchPress = async (recentSearch: RecentSearch, index: number) => {
    try {
      setSearchingIndex(index);
      const token = await auth().currentUser?.getIdToken();
      if (!token) {
        Alert.alert(t('errors.authTitle'), t('errors.authMessage'));
        return;
      }

      const currentDate = new Date();
      currentDate.setHours(currentDate.getHours() + 1);
      const dateStr = currentDate.toISOString().split('T')[0];
      const timeStr = currentDate.toTimeString().slice(0, 5);

      if (recentSearch.fromCoordinates && recentSearch.toCoordinates) {
        const searchPayload = {
          startPoint: {
            lat: recentSearch.fromCoordinates.lat,
            lng: recentSearch.fromCoordinates.lng,
          },
          endPoint: {
            lat: recentSearch.toCoordinates.lat,
            lng: recentSearch.toCoordinates.lng,
          },
          date: dateStr,
          time: timeStr,
          requestedSeats: recentSearch.passengers,
          femaleOnly: recentSearch.femaleOnly || undefined,
        };

        const response = await fetch(`${BASE_URL}/rides/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(searchPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || t('errors.searchFallback'));
        }

        const searchResults = await response.json();
        router.push({
          pathname: '/SearchResultsScreen',
          params: {
            from: recentSearch.from,
            to: recentSearch.to,
            fromLat: recentSearch.fromCoordinates.lat.toString(),
            fromLng: recentSearch.fromCoordinates.lng.toString(),
            toLat: recentSearch.toCoordinates.lat.toString(),
            toLng: recentSearch.toCoordinates.lng.toString(),
            date: currentDate.toISOString(),
            passengerCount: recentSearch.passengers.toString(),
            femaleOnly: recentSearch.femaleOnly ? '1' : '0',
            searchResults: JSON.stringify(searchResults),
          },
        });
      } else {
        Alert.alert(
          t('locationRequiredTitle'),
          t('locationRequiredBody', { from: recentSearch.from, to: recentSearch.to }),
          [
            { text: t('cancel'), style: 'cancel' },
            {
              text: t('selectLocations'),
              onPress: () => {
                router.push({
                  pathname: '/(tabs)/home',
                  params: {
                    prefillFrom: recentSearch.from,
                    prefillTo: recentSearch.to,
                    prefillPassengers: recentSearch.passengers.toString(),
                    prefillFemaleOnly: recentSearch.femaleOnly ? '1' : '0',
                  },
                });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error handling recent search:', error);
      Alert.alert(t('errors.searchTitle'), error.message || t('errors.searchFallback'));
    } finally {
      setSearchingIndex(null);
    }
  };

  if (limitedRecentSearches.length === 0) {
    return (
      <View className="px-12 mb-8">
        <Text className="text-2xl font-[Afacad] mb-4">{t('title')}</Text>
        <View className="items-center py-8">
          <Ionicons name="search-outline" size={32} color="#ccc" />
          <Text className="text-gray-500 font-[Afacad] text-center mt-2">
            {t('emptyMessage')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="px-12 mb-8">
      <Text className="text-2xl font-[Afacad] mb-4">{t('title')}</Text>

      {limitedRecentSearches.map((item, idx) => {
        const shortFrom = item.from;
        const shortTo = item.to;

        return (
          <Pressable
            key={idx}
            onPress={() => handleRecentSearchPress(item, idx)}
            disabled={searchingIndex === idx}
            className={`self-center w-full h-[58px] flex-row justify-between items-center border-b border-gray-200 ${
              searchingIndex === idx ? 'bg-gray-100' : 'active:bg-gray-100'
            }`}
          >
            <View className="flex-row items-center flex-1">
              <Ionicons name="refresh" size={26} color="#00BD5F" />
              <View className="ml-2 flex-1">
                <Text className="font-[Afacad] text-black text-xl" numberOfLines={1} ellipsizeMode="tail">
                  {shortFrom} → {shortTo}
                </Text>
                <Text className="text-md text-gray-500 font-[Afacad] -mt-[2px]">
                  {item.passengers} {t('passenger', { count: item.passengers })}
                  {item.femaleOnly && ` • ${t('femaleOnly')}`}
                  {!item.fromCoordinates && ` • ${t('needsLocation')}`}
                </Text>
              </View>
            </View>

            {searchingIndex === idx ? (
              <ActivityIndicator size="small" color="#00BD5F" />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#00BD5F" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

export default RecentSearches;
