import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecentSearchesProps } from '../../interfaces/interfaces';

const RecentSearches: React.FC<RecentSearchesProps> = ({ recentSearches }) => {
  return (
    <View className="px-12 mb-8">
      <Text className="text-2xl font-[Afacad] mb-4">Recent Searches</Text>

      {recentSearches.map((item, idx) => (
        <View
          key={idx}
          className="self-center w-full h-[58px] flex-row justify-between items-center border-b border-gray-200"
        >
          <View className="flex-row items-center">
            <Ionicons name="refresh" size={26} color="#00BD5F" />
            <View className="ml-2">
              <Text className="font-[Afacad] text-black text-xl">
                {item.from} → {item.to}
              </Text>
              <Text className="text-md text-gray-500 font-[Afacad] -mt-[2px]">
                {item.passengers} passenger{item.passengers > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#00BD5F" />
        </View>
      ))}
    </View>
  );
};

export default RecentSearches;