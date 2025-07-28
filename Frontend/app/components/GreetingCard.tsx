// i18n update for GreetingCard.tsx
import React from 'react';
import { View, Text, Image } from 'react-native';
import { GreetingCardProps } from '../../interfaces/interfaces';
import { useTranslation } from 'react-i18next';

const GreetingCard: React.FC<GreetingCardProps> = ({ userName, ecoPoints }) => {
  const { t } = useTranslation('components/GreetingCard');

  return (
    <View
      style={{ backgroundColor: '#A8E2C5' }}
      className="self-center w-[80%] rounded-xl p-4 mb-6 justify-center"
    >
      {/* Greeting line */}
      <Text className="text-3xl font-semibold text-black font-[Afacad]">
        {t('greeting', { userName })}
      </Text>

      {/* Eco Points */}
      <View className="flex-row items-center">
        <Image
          source={require('../../assets/icons/eco-icon.png')}
          className="w-5 h-5"
          resizeMode="contain"
        />
        <Text className="ml-2 text-green-900 text-xl font-[Afacad]">
          {ecoPoints} {t('ecoPoints')}
        </Text>
      </View>

      {/* Subtitle line */}
      <Text className="text-md text-black mt-2 font-[Afacad]">
        {t('subtitle')}
      </Text>
    </View>
  );
};

export default GreetingCard;
