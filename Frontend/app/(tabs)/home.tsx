import React, { useState } from 'react';
import { ScrollView, ImageBackground, KeyboardAvoidingView, Platform } from 'react-native';
import Header from '../components/Header';
import GreetingCard from '../components/GreetingCard';
import RideSearchForm from '../components/RideSearchForm';
import RecentSearches from '../components/RecentSearches';
import useHomeUserData from '../../hooks/useHomeUserData';
import useRecentSearches from '@/hooks/useRecentSearches';

export const unstable_settings = {
  gestureEnabled: false,
  headerBackVisible: false,
};

const Home = () => {
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [passengerCount, setPassengerCount] = useState('');
  const [date, setDate] = useState('');
  const { recentSearches } = useRecentSearches();

  const { userData, loading } = useHomeUserData();

  if (loading || !userData) {
    return null;
  }
  
  return (
    <ImageBackground
      source={require('../../assets/images/background_image_1.png')}
      resizeMode="cover"
      className="flex-1"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView className="flex-1 pt-[70px]" keyboardShouldPersistTaps="handled">
          <Header userName={userData.name} rating={userData.averageRating} />
          <GreetingCard userName={userData.name} ecoPoints={userData.ecoPoints} />
          <RideSearchForm
            femaleOnly={femaleOnly}
            setFemaleOnly={setFemaleOnly}
            passengerCount={passengerCount}
            setPassengerCount={setPassengerCount}
            date={date}
            setDate={setDate}
          />
          <RecentSearches recentSearches={recentSearches} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default Home;