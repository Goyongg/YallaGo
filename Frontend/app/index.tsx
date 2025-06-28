import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Index() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo fade-in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Check login state
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ✅ User is already logged in
        const idToken = await user.getIdToken(); // Optional: for backend use
        console.log('User is authenticated, token:', idToken);

        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/onboarding/greeting');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Animated.Image
        source={require('../assets/images/adaptive-icon.png')}
        style={{
          width: 180,
          height: 180,
          opacity: fadeAnim,
        }}
      />
    </View>
  );
}