import { Stack } from 'expo-router';
import { RegistrationProvider } from '@/context/RegistrationContext';

export default function AuthLayout() {
  return (
    <RegistrationProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true, 
        }}
      />
    </RegistrationProvider>
  );
}
