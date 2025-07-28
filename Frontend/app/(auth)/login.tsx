import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, PixelRatio } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { isValidEmail, isValidPassword } from '@/utils/validation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

// Firebase login function
export const loginUser = async (email: string, password: string) => {
  const userCredential = await auth().signInWithEmailAndPassword(email, password);
  const idToken = await userCredential.user.getIdToken();

  return {
    token: idToken,
    user: userCredential.user,
  };
};

const Login = () => {
  const { t } = useTranslation('(auth)/login');

  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // ✅ Access current user + auth loading state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = isValidEmail(email) && isValidPassword(password);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.replace('/(tabs)/home');
    }
  }, [user, authLoading]);

  // Login handler
  const handleLogin = async () => {
    setLoading(true);
    try {
      const { token, user } = await loginUser(email, password);
      console.log("Login complete:");
      console.log("Token:", token);
      console.log("User:", user);
      console.log("User ID (UID):", user.uid);

      // Navigate to home tab on successful login
      router.replace("/(tabs)/home");
    } catch (err: any) {
      Alert.alert(t('loginFailedTitle'), t('loginFailedMessage'));
    } finally {
      setLoading(false);
    }
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
          {t('title')}
          <Text className="text-brand italic"> {t('highlight')}</Text>
        </Text>

        <View className="mb-4">
          <Text className="text-base font-semibold mb-1 text-gray-700">{t('emailLabel')}</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#A0AEC0"
          />
        </View>

        <View className="mb-2">
          <Text className="text-base font-semibold mb-1 text-gray-700">{t('passwordLabel')}</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder={t('passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#A0AEC0"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Should be added in the future */}
        {/* <Pressable onPress={() => {}}> 
          <Text className="text-brand text-sm mt-2">Forgot password?</Text>
        </Pressable> */}
      </View>

      {/* Log In Button */}
      <Pressable
        className={`py-5 rounded-xl w-full flex items-center ${
          isValid && !loading ? 'bg-brand' : 'bg-gray-300'
        }`}
        disabled={!isValid || loading}
        onPress={handleLogin}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text adjustsFontSizeToFit className="text-white font-semibold text-2xl">{t('loginButton')}</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
};

export default Login;