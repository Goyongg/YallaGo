import { useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { HomeUserData } from '../interfaces/interfaces';
import { Platform } from 'react-native';

// This should be checked to match the current IP address
// Uni: 10.45.49.69
// Home: 10.128.24.33
const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

const useHomeUserData = () => {
  const [userData, setUserData] = useState<HomeUserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth().currentUser;
        if (!user) return;

        const idToken = await user.getIdToken();
        const response = await axios.get(`${BASE_URL}/users/home`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching home user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return { userData, loading };
};

export default useHomeUserData;
