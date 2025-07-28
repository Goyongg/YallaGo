import React, { useState } from 'react';
import { View, Alert, Pressable, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CardField, CardFieldInput, useConfirmPayment } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { BASE_URL } from '@/config';
import { useTranslation } from 'react-i18next';

const PaymentScreen = () => {
  const { t } = useTranslation('(tabs)/payment');
  const { clientSecret, paymentIntentId, rideId, seats, price, from, to } = useLocalSearchParams<{
    clientSecret: string;
    paymentIntentId: string;
    rideId: string;
    seats: string;
    price: string;
    from: string;
    to: string;
  }>();
  const pricePerSeat = Number(price) || 0;
  const numberOfSeats = Number(seats) || 1;
  const totalAmount = pricePerSeat * numberOfSeats;

  const [cardDetails, setCardDetails] = useState<CardFieldInput.Details | null>(null);
  const { confirmPayment, loading } = useConfirmPayment();
  const router = useRouter();

  const handlePayPress = async () => {
    if (!clientSecret || !paymentIntentId || !rideId || !seats || !price) {
      Alert.alert(t('alerts.error.title'), t('alerts.error.missingDetails'));
      return;
    }

    const { error, paymentIntent } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
    });

    if (error) {
      Alert.alert(t('alerts.paymentFailed.title'), error.message);
      return;
    }

    if (!paymentIntent) {
      Alert.alert(t('alerts.paymentFailed.title'), t('alerts.paymentFailed.noIntent'));
      return;
    }

    try {
      const token = await auth().currentUser?.getIdToken();
      if (!token) {
        Alert.alert(t('alerts.error.title'), t('alerts.error.authError'));
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
          seatsBooked: numberOfSeats,
          bookingPrice: totalAmount,
          paymentIntentId,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Booking creation failed after payment.');
      }

      const result = await response.json();

      Alert.alert(
        t('alerts.success.title'),
        t('alerts.success.message'),
        [
          {
            text: t('buttons.goToBookings'),
            onPress: () => router.replace('/profile/BookingDashboard'),
          },
        ]
      );

    } catch (err: any) {
      console.error('❌ Booking creation failed:', err);
      Alert.alert(t('alerts.bookingFailed.title'), err.message || t('alerts.error.bookingFailed'));
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-5 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={24} color="#00BD5F" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">{t('header.title')}</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Trip Summary Card with Timeline Design */}
        <View className="bg-white rounded-2xl p-5 mt-5 shadow-sm">
          <View className="flex-row items-center mb-5">
            <Ionicons name="location" size={20} color="#00BD5F" />
            <Text className="text-base font-semibold text-gray-900 ml-2">{t('trip.title')}</Text>
          </View>
          
          <View className="flex-row items-center justify-start mb-5">
            <View className="items-center mx-2">
              <Ionicons name="ellipse" size={10} color="#00BD5F" />
              <View className="w-px h-12" style={{ backgroundColor: '#00BD5F' }} />
              <Ionicons name="ellipse" size={10} color="#00BD5F" />
            </View>

            <View className="ml-2 flex-1">
              <View className="mb-1">
                <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                  {from || t('fallback.notAvailable')}
                </Text>
                <Text className="text-sm text-gray-500">
                  {t('trip.pickupLocation')}
                </Text>
              </View>
              <View className="h-2" />
              <View className="mt-1">
                <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                  {to || t('fallback.notAvailable')}
                </Text>
                <Text className="text-sm text-gray-500">
                  {t('trip.dropoffLocation')}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row justify-center items-center pt-4 border-t border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="people" size={16} color="#666" />
              <Text className="text-sm text-gray-500 ml-2 mr-2">{t('trip.seats')}</Text>
              <Text className="text-sm font-semibold text-gray-900">{seats || t('fallback.notAvailable')}</Text>
            </View>
          </View>
        </View>

        {/* Payment Card */}
        <View className="bg-white rounded-2xl p-5 mt-4 shadow-sm">
          <View className="flex-row items-center mb-5">
            <Ionicons name="card" size={20} color="#00BD5F" />
            <Text className="text-base font-semibold text-gray-900 ml-2">{t('payment.title')}</Text>
          </View>
          
          <Text className="text-sm font-medium text-gray-700 mb-2">{t('payment.cardInfo')}</Text>
          <View className="border border-gray-200 rounded-xl bg-gray-50">
            <CardField
              postalCodeEnabled={false}
              placeholders={{ number: t('payment.cardPlaceholder') }}
              cardStyle={{
                backgroundColor: '#ffffff',
                textColor: '#000000',
                borderColor: '#E5E5E5',
                borderWidth: 1,
                borderRadius: 8,
              }}
              style={{ height: 50 }}
              onCardChange={(cardDetails) => {
                setCardDetails(cardDetails);
              }}
            />
          </View>
        </View>

        {/* Amount Card with calculation breakdown */}
        <View className="bg-white rounded-2xl p-5 mt-4 mb-5 shadow-sm">
          {/* Show price breakdown */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-500">{t('amount.pricePerSeat')}</Text>
              <Text className="text-sm text-gray-700">{t('amount.currency')} {pricePerSeat}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-500">{t('amount.numberOfSeats')}</Text>
              <Text className="text-sm text-gray-700">×{numberOfSeats}</Text>
            </View>
            <View className="h-px bg-gray-200 my-2" />
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-base font-medium text-gray-700">{t('amount.totalAmount')}</Text>
            <View className="flex-row items-baseline">
              <Text className="text-base font-medium text-green-500 mr-1">{t('amount.currency')}</Text>
              <Text className="text-2xl font-bold text-green-500">{totalAmount}</Text>
            </View>
          </View>
          
          <View className="flex-row items-start bg-green-50 p-3 rounded-lg">
            <Ionicons name="information-circle" size={16} color="#00BD5F" />
            <Text className="text-xs text-green-600 ml-2 flex-1 leading-4">
              {t('amount.preAuthInfo')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Section */}
      <View className="bg-white px-5 pt-5 pb-10 border-t border-gray-100">
        <Pressable
          className={`${loading ? 'bg-gray-400' : 'bg-green-500'} rounded-xl py-4 flex-row items-center justify-center shadow-lg`}
          onPress={handlePayPress}
          disabled={loading}
        >
          {loading ? (
            <Text className="text-white text-base font-semibold">{t('buttons.processing')}</Text>
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="white" />
              <Text className="text-white text-base font-semibold ml-2">{t('buttons.authorize')}</Text>
            </>
          )}
        </Pressable>
        
        <View className="flex-row items-center justify-center mt-3">
          <Ionicons name="lock-closed" size={14} color="#999" />
          <Text className="text-xs text-gray-400 ml-1">{t('security.message')}</Text>
        </View>
      </View>
    </View>
  );
};

export default PaymentScreen;