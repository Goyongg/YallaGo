import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

const Greeting = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      router.push('/onboarding/name-contact');
      setLoading(false);
    }, 250); // just enough to flash the spinner
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <View className="flex-1 justify-around items-start bg-white p-8">
      {/* Heading Section */}
      <View>
        <Text className="text-6xl font-bold leading-[70px] tracking-wide">
          Welcome to
          <Text className="text-brand text-7xl italic"> YallaGo!</Text>
        </Text>

        <Text className="text-xl text-gray-600 pl-3 leading-[24px] mt-3">
          In order to use this app, let us know more about you.
        </Text>
      </View>

      {/* Bottom Section */}
      <View className="w-full">
        <Pressable
          className={`px-6 py-5 rounded-xl w-full flex items-center ${
            !loading ? 'bg-brand' : 'bg-gray-300'
          }`}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text adjustsFontSizeToFit className="text-white font-semibold text-2xl">Next</Text>
          )}
        </Pressable>

        <View className="mt-6 flex-row justify-center items-center">
          <Text className="text-gray-600 text-base">Already have an account? </Text>
          <Pressable onPress={handleLogin}>
            <Text adjustsFontSizeToFit className="text-brand font-semibold text-base underline">Log in</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default Greeting;