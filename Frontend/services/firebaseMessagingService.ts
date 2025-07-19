import messaging from '@react-native-firebase/messaging';

export async function getDeviceToken() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    const token = await messaging().getToken();
    return token;
  } else {
    throw new Error('Notification permission not granted');
  }
}