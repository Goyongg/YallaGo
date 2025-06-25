import { Slot } from "expo-router";
import './globals.css'
import { useFonts } from 'expo-font';
import { View } from 'react-native';
// import { RegistrationProvider } from "../context/RegistrationContext";

export default function Layout() {
  const [fontsLoaded] = useFonts({
    'Afacad': require('../assets/fonts/Afacad-Regular.ttf'),
    'Afacad-Bold': require('../assets/fonts/Afacad-Bold.ttf'),
    'Afacad-Italic': require('../assets/fonts/Afacad-Italic.ttf'),
    'Afacad-BoldItalic': require('../assets/fonts/Afacad-BoldItalic.ttf'),
  });

  if (!fontsLoaded) return <View />;

  // return (
  //   <RegistrationProvider>
  //     <Slot />
  //   </RegistrationProvider>
  // );
  return <Slot />;
}
