import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DriverUpcomingRideCard from '../components/DriverUpcomingRideCard';
import DriverRideHistoryCard from '../components/DriverRideHistoryCard';

const mockRides = {
  upcoming: [
    {
      id: '1',
      from: 'Ajman',
      to: 'Dubai',
      departureTime: '14:00',
      arrivalTime: '16:30',
      duration: '2h 30m',
      price: '100',
      availableSeats: 3,
      status: 'Upcoming'
    },
    {
      id: '2',
      from: 'Sharjah',
      to: 'AbuDhabi',
      departureTime: '09:30',
      arrivalTime: '11:00',
      duration: '1h 30m',
      price: '70',
      availableSeats: 2,
      status: 'Upcoming'
    }
  ],
  history: [
    {
      id: '3',
      from: 'Dubai',
      to: 'Sharjah',
      departureTime: '13:45',
      arrivalTime: '15:00',
      duration: '1h 15m',
      price: '52',
      date: '2025-06-28',
    },
    {
      id: '4',
      from: 'AbuDhabi',
      to: 'Dubai',
      departureTime: '10:00',
      arrivalTime: '12:20',
      duration: '2h 20m',
      price: '60',
      date: '2025-06-28',
    },
  ]
};

const DriverDashboard = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const router = useRouter();

  const groupRidesByDate = (rides: typeof mockRides.history) => {
    return rides.reduce((groups: Record<string, typeof rides>, ride) => {
      const date = new Date(ride.date).toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(ride);
      return groups;
    }, {});
  };

  return (
    <View className="flex-1 bg-white px-6 pt-[70px]">
      <View className="w-[95%] self-center flex-1">
        {/* Back Arrow + Title */}
        <View className="flex-row items-center mb-6">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <Text className="text-xl ml-4 font-bold font-[Afacad]">Driver Dashboard</Text>
        </View>

        {/* Tabs */}
        <View className="flex-row mb-4">
          {(['upcoming', 'history'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 border-b-2 items-center ${
                activeTab === tab ? 'border-[#00BD5F] bg-gray-100 rounded-t-md' : 'border-gray-300'
              }`}
            >
              <Text
                className={`font-[Afacad] text-lg ${
                  activeTab === tab ? 'text-[#00BD5F]' : 'text-gray-400'
                }`}
              >
                {tab === 'upcoming' ? 'Upcoming Rides' : 'Ride History'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Ride List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {mockRides[activeTab].length === 0 ? (
            <Text className="text-center text-gray-400 mt-10 font-[Afacad]">
              No rides to display
            </Text>
          ) : activeTab === 'upcoming' ? (
            mockRides.upcoming.map((ride) => (
              <DriverUpcomingRideCard
                key={ride.id}
                id={ride.id}
                departureTime={ride.departureTime}
                arrivalTime={ride.arrivalTime}
                duration={ride.duration}
                from={ride.from}
                to={ride.to}
                price={ride.price}
                availableSeats={ride.availableSeats}
                status={ride.status}
              />
            ))
          ) : (
            Object.entries(groupRidesByDate(mockRides.history)).map(([dateLabel, rides]) => (
              <View key={dateLabel} className="mb-6">
                <Text className="text-lg font-[Afacad] mb-2">{dateLabel}</Text>
                {rides.map((ride) => (
                  <DriverRideHistoryCard
                    key={ride.id}
                    id={ride.id}
                    from={ride.from}
                    to={ride.to}
                    departureTime={ride.departureTime}
                    arrivalTime={ride.arrivalTime}
                    duration={ride.duration}
                    price={ride.price}
                  />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Floating Add Button */}
      {activeTab === 'upcoming' && (
        <Pressable
          onPress={() => router.push('/')}
          className="absolute bottom-8 right-8 bg-[#00BD5F] rounded-full p-4 shadow-lg"
        >
          <Ionicons name="add" size={28} color="white" />
        </Pressable>
      )}

    </View>
  );
};

export default DriverDashboard;
