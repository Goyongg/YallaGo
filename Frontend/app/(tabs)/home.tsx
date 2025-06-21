import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export const unstable_settings = {
  gestureEnabled: false,
  headerBackVisible: false,
};

const Home = () => {
  const router = useRouter();

  const handleLogout = () => {
    // TODO: Add backend/Firebase logout logic here
    router.replace('../(auth)/onboarding/greeting');
    console.log('Logged out');
  };

  const handleDeleteAccount = () => {
    // TODO: Add backend/Firebase delete logic here
    console.log('Account deleted');
  };

  return (
    <View className="flex-1 justify-around bg-white p-8">
      {/* Welcome Section */}
      <View>
        <Text className="text-5xl font-bold leading-[60px] tracking-wide mb-4">
          Welcome to
          <Text className="text-brand italic"> YallaGo</Text> 🚗
        </Text>

        <Text className="text-base text-gray-600 pl-1 leading-[24px]">
          This is the homepage. You are now signed in and have completed onboarding.
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="w-full">
        <Pressable
          className="bg-brand py-4 rounded-xl mb-4 items-center"
          onPress={handleLogout}
        >
          <Text className="text-white font-semibold text-lg">Log Out</Text>
        </Pressable>

        <Pressable
          className="border border-red-500 py-4 rounded-xl items-center"
          onPress={handleDeleteAccount}
        >
          <Text className="text-red-500 font-semibold text-lg">Delete Account</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Home;