import { Slot } from "expo-router";
import './globals.css'
import { useFonts } from 'expo-font';
import { Platform, View } from 'react-native';
// import { RegistrationProvider } from "../context/RegistrationContext";
import { useEffect, useRef } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import { BASE_URL } from "@/config";
import axios from "axios";
import auth from '@react-native-firebase/auth';
import { getDeviceToken } from "@/services/firebaseMessagingService";

export default function Layout() {
  const [fontsLoaded] = useFonts({
    'Afacad': require('../assets/fonts/Afacad-Regular.ttf'),
    'Afacad-Bold': require('../assets/fonts/Afacad-Bold.ttf'),
    'Afacad-Italic': require('../assets/fonts/Afacad-Italic.ttf'),
    'Afacad-BoldItalic': require('../assets/fonts/Afacad-BoldItalic.ttf'),
  });

  // 🔐 Registers FCM device token with backend:
  // - Runs on app start
  // - Listens for token refresh
  // - Sends token only if user is logged in
  let hasSentToken = false;
  const deleteTokenOnce = false; // 👈 Set to true temporarily during testing
  let tokenDeleted = false;

  useEffect(() => {
    const sendFCMToken = async () => {
      if (hasSentToken) return;
      hasSentToken = true;

      const user = auth().currentUser;
      if (!user) {
        console.warn('[App Start] No authenticated user. Skipping token send.');
        return;
      }

      try {
        if (deleteTokenOnce && !tokenDeleted) {
          await messaging().deleteToken();
          console.log('[App Start] 🧹 Old FCM token deleted.');
          tokenDeleted = true; // ✅ Prevent future deletes
        }

        const token = await getDeviceToken();
        const idToken = await user.getIdToken();

        await axios.post(`${BASE_URL}/users/save-device-token`, { fcmToken: token }, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        console.log('[App Start] ✅ FCM token sent to backend.');
      } catch (err) {
        console.error('[App Start] ❌ Failed to send FCM token:', err);
      }
    };

    sendFCMToken();

    const unsubscribe = messaging().onTokenRefresh(async newToken => {
      console.log('[FCM] 🔁 Token refreshed:', newToken);
      hasSentToken = false;
      await sendFCMToken();
    });

    return unsubscribe;
  }, []);



  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      if (remoteMessage?.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'Notification',
          remoteMessage.notification.body || ''
        );
      }
    });

    return unsubscribe;
  }, []);

  if (!fontsLoaded) return <View />;

  // return (
  //   <RegistrationProvider>
  //     <Slot />
  //   </RegistrationProvider>
  // );
  return <Slot />;
}
