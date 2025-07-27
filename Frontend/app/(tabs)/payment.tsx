import React, { useState } from 'react';
import { View, Button, Alert, Pressable, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CardField, CardFieldInput, useConfirmPayment } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { BASE_URL } from '@/config';

const PaymentScreen = () => {
  const { clientSecret, paymentIntentId, rideId, seats, price } = useLocalSearchParams<{
    clientSecret: string;
    paymentIntentId: string;
    rideId: string;
    seats: string;
    price: string;
  }>();
  const [cardDetails, setCardDetails] = useState<CardFieldInput.Details | null>(null);
  const { confirmPayment, loading } = useConfirmPayment();
  const router = useRouter();

  const handlePayPress = async () => {
    if (!clientSecret || !paymentIntentId || !rideId || !seats || !price) {
      Alert.alert('Error', 'Missing payment or booking details.');
      return;
    }

    const { error, paymentIntent } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
    });

    if (error) {
      Alert.alert('❌ Payment failed', error.message);
      return;
    }

    if (!paymentIntent) {
      Alert.alert('❌ Payment failed', 'No payment intent returned.');
      return;
    }

    try {
      const token = await auth().currentUser?.getIdToken();
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again.');
        return;
      }

      // 👇 Post booking only AFTER payment is authorized
      const response = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rideId,
          seatsBooked: Number(seats),
          bookingPrice: Number(price),
          paymentIntentId,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Booking creation failed after payment.');
      }

      const result = await response.json();

      Alert.alert(
        '✅ Payment Authorized',
        'Your payment was authorized and your booking is now created. You’ll only be charged if the driver accepts it.',
        [
          {
            text: 'Go to Bookings',
            onPress: () => router.replace('/profile/BookingDashboard'),
          },
        ]
      );

    } catch (err: any) {
      console.error('❌ Booking creation failed:', err);
      Alert.alert('Booking Failed', err.message || 'Something went wrong after payment.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 20 }}>

    {/* 🔙 Back button and Header */}
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
      <Pressable onPress={() => router.back()} style={{ marginRight: 8 }}>
        <Ionicons name="arrow-back" size={24} color="#00BD5F" />
      </Pressable>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>Confirm Payment</Text>
    </View>

    {/* ℹ️ Booking Info */}
    <View style={{
      borderWidth: 1,
      borderColor: '#eee',
      borderRadius: 10,
      padding: 16,
      marginBottom: 20,
      backgroundColor: '#FAFAFA',
    }}>
      <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8 }}>
        Seats Booked:
      </Text>
      <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
        {seats || 'N/A'}
      </Text>

      <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8 }}>
        Amount to be Authorized:
      </Text>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#00BD5F' }}>
        {price ? `${price} AED` : 'N/A'}
      </Text>

      <Text style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
        💡 This is a delayed payment. You will only be charged if the driver accepts your booking.
      </Text>
    </View>

    {/* 💳 Card Input */}
    <CardField
      postalCodeEnabled={false}
      placeholders={{ number: '4242 4242 4242 4242' }}
      cardStyle={{
        backgroundColor: '#ffffff',
        textColor: '#000000',
      }}
      style={{
        height: 50,
        marginBottom: 30,
      }}
      onCardChange={(cardDetails) => {
        setCardDetails(cardDetails);
      }}
    />

    {/* ✅ Pay Button */}
    <Button
      title={loading ? 'Processing...' : 'Confirm & Authorize Payment'}
      onPress={handlePayPress}
      color="#00BD5F"
      disabled={loading}
    />
  </View>
  );
};

export default PaymentScreen;
