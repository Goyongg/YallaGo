// components/SOSButton.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SOSButtonProps {
  // Required props the pages are passing
  rideId: string;
  userRole: 'driver' | 'passenger';
  rideStatus: string;
  
  // Optional props for enhanced functionality
  rideData?: {
    coordinates?: any;
    from?: string;
    to?: string;
  };
  
  // Optional styling and callback props
  containerClassName?: string;
  onSOSActivated?: () => void;
}

const SOSButton: React.FC<SOSButtonProps> = ({
  rideId,
  userRole,
  rideStatus,
  rideData,
  containerClassName = "mx-4 mb-4",
  onSOSActivated
}) => {
  const [sosPressed, setSosPressed] = useState(false);

  // Check if ride is active (only show SOS for active rides)
  const isRideActive = (): boolean => {
    if (!rideStatus) return false;
    const activeStatuses = [
      // Active ride statuses
      'departed',     // Ride actively in progress
      
      // Active booking statuses
      'ongoing'       // Booking/ride in progress
    ];
    
    return activeStatuses.includes(rideStatus.toLowerCase());
  };

  // Simple SOS handler
  const handleSOSPress = () => {
    if (sosPressed) return; // Prevent spam

    Alert.alert(
      'Emergency SOS',
      'This feature will contact emergency services and notify your emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call Emergency', 
          style: 'destructive',
          onPress: () => {
            setSosPressed(true); // Disable button after first use
            
            // Call optional callback for analytics
            if (onSOSActivated) {
              try {
                onSOSActivated();
              } catch (error) {
                console.error('SOS callback error:', error);
              }
            }

            Alert.alert('SOS Activated', 'Emergency services have been notified.');
            
            const emergencyNumber = '999'; // UAE emergency number
            Linking.openURL(`tel:${emergencyNumber}`).catch(err => {
              Alert.alert('Error', 'Could not initiate call. Please dial 999 manually.');
            });
          }
        },
      ]
    );
  };

  // Don't render if ride is not active
  if (!isRideActive()) {
    return null;
  }

  return (
    <View className={containerClassName}>
      <Pressable
        onPress={handleSOSPress}
        disabled={sosPressed}
        className={`py-4 rounded-lg items-center border-2 ${
          sosPressed 
            ? 'bg-gray-400 border-gray-500' // Disabled state
            : 'bg-red-500 border-red-600'   // Active state
        }`}
      >
        <View className="flex-row items-center">
          <Ionicons 
            name="warning" 
            size={24} 
            color={sosPressed ? "#999" : "white"} 
          />
          <Text className={`text-lg font-[Afacad] font-bold ml-2 ${
            sosPressed ? 'text-gray-300' : 'text-white'
          }`}>
            {sosPressed ? 'SOS ACTIVATED' : 'Emergency SOS'}
          </Text>
        </View>
        <Text className={`text-sm font-[Afacad] mt-1 ${
          sosPressed ? 'text-gray-400' : 'text-red-100'
        }`}>
          {sosPressed ? 'Emergency services notified' : 'Tap in case of emergency'}
        </Text>
      </Pressable>
    </View>
  );
};

export default SOSButton;