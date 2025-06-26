import React, { useState } from 'react';
import { ScrollView, ImageBackground } from 'react-native';
import Header from '../components/Header';
import GreetingCard from '../components/GreetingCard';
import RideSearchForm from '../components/RideSearchForm';
import RecentSearches from '../components/RecentSearches';

export const unstable_settings = {
  gestureEnabled: false,
  headerBackVisible: false,
};

const Home = () => {
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [passengerCount, setPassengerCount] = useState('');
  const [date, setDate] = useState('');
  
  return (
    <ImageBackground
      source={require('../../assets/images/background_image_1.png')}
      resizeMode="cover"
      className="flex-1"
    >
      <ScrollView className="flex-1 pt-[70px]">
        <Header />
        <GreetingCard userName="Ahmed" ecoPoints={325} />
        <RideSearchForm
          femaleOnly={femaleOnly}
          setFemaleOnly={setFemaleOnly}
          passengerCount={passengerCount}
          setPassengerCount={setPassengerCount}
          date={date}
          setDate={setDate}
        />
        <RecentSearches
          recentSearches={[
            { from: 'Dubai', to: 'AbuDhabi', passengers: 1 },
            { from: 'Dubai', to: 'Sharjah', passengers: 2 },
          ]}
        />
      </ScrollView>
    </ImageBackground>
  );
};

export default Home;