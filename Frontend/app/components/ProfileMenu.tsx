import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, Modal, Pressable, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileMenuProps } from '../../interfaces/interfaces';
import { useTranslation } from 'react-i18next';

const ProfileMenu: React.FC<ProfileMenuProps> = ({ visible, onClose, userName, rating, userRole }) => {
  const router = useRouter();
  const { t } = useTranslation('components/ProfileMenu');

  const allMenuItems = [
    { label: t('menu.manage'), route: '../profile/manage' },
    { label: t('menu.rides'), route: '../profile/DriverDashboard', driverOnly: true },
    { label: t('menu.requests'), route: '../profile/BookingRequests', driverOnly: true },
    { label: t('menu.gifts'), sub: t('menu.giftsSub'), route: '../profile/gifts' },
    { label: t('menu.bookings'), sub: t('menu.bookingsSub'), route: '../profile/BookingDashboard' },
    { label: t('menu.info'), route: '../profile/info' },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (item.driverOnly) {
      return userRole === 'driver';
    }
    return true;
  });

  const handleMenuPress = async (item: any) => {
    onClose();
    if (item.route) {
      router.push(item.route);
    }
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/30">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-3xl pt-6 pb-12 px-6">
              <Pressable onPress={onClose} className="absolute top-4 right-4 z-10">
                <Ionicons name="close" size={28} color="black" />
              </Pressable>

              {/* Avatar & Name */}
              <View className="items-center mb-6">
                <View className="w-20 h-20 rounded-full bg-gray-200 justify-center items-center relative">
                  <Ionicons name="camera" size={28} color="gray" />
                  <View className="absolute bottom-0 right-0 bg-red-500 w-5 h-5 rounded-full items-center justify-center">
                    <Ionicons name="add" size={10} color="white" />
                  </View>
                </View>
                <Text className="mt-3 text-xl font-bold font-[Afacad]">{userName}</Text>
                <Text className="text-gray-400 font-[Afacad]">
                  {t('rating', { rating: (rating || 0).toFixed(2) })}
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row justify-around items-center mb-6">
                  <Pressable
                    onPress={() => {
                      onClose();
                      router.push('/profile/safety');
                    }}
                    className="items-center"
                  >
                    <Ionicons name="shield-checkmark" size={26} color="#444" />
                    <Text className="text-sm font-[Afacad] mt-1">{t('safety')}</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      onClose();
                      router.push('/profile/settings');
                    }}
                    className="items-center"
                  >
                    <Ionicons name="settings" size={26} color="#444" />
                    <Text className="text-sm font-[Afacad] mt-1">{t('settings')}</Text>
                  </Pressable>
                </View>

                {menuItems.map((item, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleMenuPress(item)}
                    className="flex-row justify-between items-center py-4 border-b border-gray-200"
                  >
                    <View>
                      <Text className="text-base font-[Afacad] text-black">{item.label}</Text>
                      {item.sub && (
                        <Text className="text-sm text-gray-400 font-[Afacad]">{item.sub}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#aaa" />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ProfileMenu;
