import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';

export default function Index() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const checkAuth = async () => {
      const user = auth().currentUser;

      if (user) {
        try {
          const uid = user.uid;
          const email = user.email;
          const idToken = await user.getIdToken();

          console.log('User is signed in');
          console.log('UID:', uid);
          console.log('Email:', email);
          console.log('Token:', idToken);

          router.replace('/(tabs)/home');
        } catch (error) {
          console.error('Failed to get ID token:', error);
        }
      } else {
        console.log('No user signed in');
        router.replace('/(auth)/onboarding/greeting');
      }
    };

    checkAuth();
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Animated.Image
        source={require('../assets/images/adaptive-icon.png')}
        style={{ width: 180, height: 180, opacity: fadeAnim }}
      />
    </View>
  );
}
