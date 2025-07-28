// i18n integration for SOSButton.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface SOSButtonProps {
  rideId: string;
  userRole: 'driver' | 'passenger';
  rideStatus: string;
  rideData?: {
    coordinates?: any;
    from?: string;
    to?: string;
  };
  containerClassName?: string;
  onSOSActivated?: () => void;
}

const SOSButton: React.FC<SOSButtonProps> = ({
  rideId,
  userRole,
  rideStatus,
  rideData,
  containerClassName = 'mx-4 mb-4',
  onSOSActivated,
}) => {
  const { t } = useTranslation('components/SOSButton');
  const [sosPressed, setSosPressed] = useState(false);

  const isRideActive = (): boolean => {
    if (!rideStatus) return false;
    const activeStatuses = ['departed', 'ongoing'];
    return activeStatuses.includes(rideStatus.toLowerCase());
  };

  const handleSOSPress = () => {
    if (sosPressed) return;

    Alert.alert(
      t('alert.title'),
      t('alert.message'),
      [
        { text: t('alert.cancel'), style: 'cancel' },
        {
          text: t('alert.confirm'),
          style: 'destructive',
          onPress: () => {
            setSosPressed(true);
            if (onSOSActivated) {
              try {
                onSOSActivated();
              } catch (error) {
                console.error('SOS callback error:', error);
              }
            }
            Alert.alert(t('activated.title'), t('activated.message'));

            const emergencyNumber = '999';
            Linking.openURL(`tel:${emergencyNumber}`).catch(err => {
              Alert.alert(t('error.title'), t('error.message'));
            });
          },
        },
      ]
    );
  };

  if (!isRideActive()) return null;

  return (
    <View className={containerClassName}>
      <Pressable
        onPress={handleSOSPress}
        disabled={sosPressed}
        className={`py-4 rounded-lg items-center border-2 ${
          sosPressed ? 'bg-gray-400 border-gray-500' : 'bg-red-500 border-red-600'
        }`}
      >
        <View className="flex-row items-center">
          <Ionicons name="warning" size={24} color={sosPressed ? '#999' : 'white'} />
          <Text
            className={`text-lg font-[Afacad] font-bold ml-2 ${
              sosPressed ? 'text-gray-300' : 'text-white'
            }`}
          >
            {sosPressed ? t('activated.button') : t('button')}
          </Text>
        </View>
        <Text
          className={`text-sm font-[Afacad] mt-1 ${
            sosPressed ? 'text-gray-400' : 'text-red-100'
          }`}
        >
          {sosPressed ? t('activated.subtitle') : t('subtitle')}
        </Text>
      </Pressable>
    </View>
  );
};

export default SOSButton;
