import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loginUser } from "@/services/login";
import { Alert } from "react-native";

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isValid = email.trim().length > 0 && password.trim().length > 0;

  const handleLogin = async () => {
    try {
      // const { token, user } = await loginUser(email, password);

      // console.log("Login complete:");
      // console.log("Token:", token);
      // console.log("User:", user);

      router.replace("/(tabs)/home");
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Invalid email or password");
    }
    router.replace("/(tabs)/home");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white justify-around p-8"
    >
      {/* Back Arrow */}
      <Pressable onPress={() => router.back()} className="absolute top-20 left-6 z-10">
        <Text>
          <Ionicons name="arrow-back" size={38} color="#00BD5F" />
        </Text>
      </Pressable>

      {/* Title + Inputs */}
      <View>
        <Text className="text-5xl font-bold leading-[60px] tracking-wide mb-6">
          Log in to your
          <Text className="text-brand italic"> account</Text>
        </Text>

        <View className="mb-4">
          <Text className="text-base font-semibold mb-1 text-gray-700">Email</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#A0AEC0"
          />
        </View>

        <View className="mb-2">
          <Text className="text-base font-semibold mb-1 text-gray-700">Password</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#A0AEC0"
            secureTextEntry
          />
        </View>

        {/* Should be added in the future */}
        <Pressable onPress={() => {}}> 
          <Text className="text-brand text-sm mt-2">Forgot password?</Text>
        </Pressable>
      </View>

      {/* Log In Button */}
      <Pressable
        className={`py-5 rounded-xl w-full flex items-center ${
          isValid ? 'bg-brand' : 'bg-gray-300'
        }`}
        disabled={!isValid}
        onPress={handleLogin}
      >
        <Text className="text-white font-semibold text-2xl">Log in</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
};

export default Login;