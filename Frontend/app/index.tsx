import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';

// index.tsx should be treated as a logic router, not a UI screen
// - Check if the user is logged in
// - Redirect to /home if logged in
// - Redirect to /onboarding/greeting if not
export default function Index() {
  return (
    <View className="flex-1 justify-around items-start bg-white p-8">
      <Text className="text-6xl mb-4 font-bold leading-[70px] tracking-wide">Welcome to
        <Text className="text-brand text-7xl italic"> YallaGo!</Text>
      </Text>
      <Link href="./(auth)/onboarding/greeting" asChild>
        <Pressable className="bg-brand px-6 py-5 rounded-xl w-full flex items-center">
          <Text className="text-white font-semibold text-2xl">Get Started</Text>
        </Pressable>
      </Link>
    </View>
  );
}
