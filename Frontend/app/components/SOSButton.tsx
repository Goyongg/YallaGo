// SOSButton.tsx - Connected to backend /sos-alerts endpoint
import React, { useState } from 'react';
import { View, Text, Pressable, Alert, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { BASE_URL } from '@/config';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRideActive = (): boolean => {
    if (!rideStatus) return false;
    const activeStatuses = ['departed', 'ongoing'];
    return activeStatuses.includes(rideStatus.toLowerCase());
  };

  // Function to send SOS alert to backend
  const sendSOSAlert = async (): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      console.log('🚨 Sending SOS alert to backend for rideId:', rideId);

      const user = auth().currentUser;
      if (!user) {
        console.error('🚨 No authenticated user found');
        Alert.alert('Error', 'You must be logged in to send an SOS alert');
        return false;
      }

      const idToken = await user.getIdToken();
      
      const response = await axios.post(
        `${BASE_URL}/sos-alerts?rideId=${rideId}`,
        {}, // Empty body since rideId is in query params
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('🚨 SOS alert sent successfully:', response.data);
      return true;

    } catch (error: any) {
      console.error('🚨 Error sending SOS alert:', error);
      
      let errorMessage = 'Failed to send SOS alert. Emergency services will still be contacted.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Emergency services will still be contacted.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Ride not found. Emergency services will still be contacted.';
      } else if (error.response?.data?.message) {
        errorMessage = `${error.response.data.message}. Emergency services will still be contacted.`;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Emergency services will still be contacted.';
      }
      
      // Show error but don't prevent calling emergency services
      Alert.alert('SOS Alert Error', errorMessage);
      return false;

    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSOSPress = () => {
    if (sosPressed || isSubmitting) return;

    Alert.alert(
      t('alert.title'),
      t('alert.message'),
      [
        { text: t('alert.cancel'), style: 'cancel' },
        {
          text: t('alert.confirm'),
          style: 'destructive',
          onPress: async () => {
            setSosPressed(true);
            
            // Call the onSOSActivated callback first
            if (onSOSActivated) {
              try {
                onSOSActivated();
              } catch (error) {
                console.error('🚨 SOS callback error:', error);
              }
            }

            // Send SOS alert to backend
            const alertSent = await sendSOSAlert();
            
            // Show appropriate success message
            const successMessage = alertSent 
              ? t('activated.messageWithBackend') 
              : t('activated.message');
            
            Alert.alert(t('activated.title'), successMessage);

            // Call emergency services
            const emergencyNumber = '999';
            try {
              await Linking.openURL(`tel:${emergencyNumber}`);
            } catch (err) {
              console.error('🚨 Error calling emergency services:', err);
              Alert.alert(t('error.title'), t('error.message'));
            }
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
        disabled={sosPressed || isSubmitting}
        className={`py-4 rounded-lg items-center border-2 ${
          sosPressed || isSubmitting 
            ? 'bg-gray-400 border-gray-500' 
            : 'bg-red-500 border-red-600'
        }`}
      >
        <View className="flex-row items-center">
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
          ) : (
            <Ionicons 
              name="warning" 
              size={24} 
              color={sosPressed || isSubmitting ? '#999' : 'white'} 
            />
          )}
          <Text
            className={`text-lg font-[Afacad] font-bold ml-2 ${
              sosPressed || isSubmitting ? 'text-gray-300' : 'text-white'
            }`}
          >
            {isSubmitting 
              ? t('sending.button') 
              : sosPressed 
                ? t('activated.button') 
                : t('button')
            }
          </Text>
        </View>
        <Text
          className={`text-sm font-[Afacad] mt-1 ${
            sosPressed || isSubmitting ? 'text-gray-400' : 'text-red-100'
          }`}
        >
          {isSubmitting 
            ? t('sending.subtitle') 
            : sosPressed 
              ? t('activated.subtitle') 
              : t('subtitle')
          }
        </Text>
      </Pressable>
    </View>
  );
};

export default SOSButton;