import { Stack } from 'expo-router';

export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // prevent swiping back from home
      }}
    >
      <Stack.Screen name="home" />
    </Stack>
  );
}