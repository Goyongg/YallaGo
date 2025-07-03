import React from 'react';
import { View, Text, Image } from 'react-native';
import { GreetingCardProps } from '../../interfaces/interfaces';

const GreetingCard: React.FC<GreetingCardProps> = ({ userName, ecoPoints }) => (
  <View
    style={{ backgroundColor: '#A8E2C5' }}
    className="self-center w-[80%] rounded-xl p-4 mb-6 justify-center"
  >
    <Text className="text-3xl font-semibold text-black font-[Afacad]">
      Good Morning, {`${userName}\u00A0👋`}
    </Text>
    <View className="flex-row items-center">
      <Image
        source={require('../../assets/icons/eco-icon.png')}
        className="w-5 h-5"
        resizeMode="contain"
      />
      <Text className="ml-2 text-green-900 text-xl font-[Afacad]">{ecoPoints} Eco Points</Text>
    </View>
    <Text className="text-md text-black mt-2 font-[Afacad]">
      Get rewarded for every eco-friendly trip you take.
    </Text>
  </View>
);

export default GreetingCard;