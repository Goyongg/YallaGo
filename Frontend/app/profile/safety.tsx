// app/safety.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  ScrollView, 
  Alert, 
  Linking, 
  TextInput,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { BASE_URL } from '@/config';
import { useTranslation } from 'react-i18next';

interface EmergencyContact {
  name: string;
  phoneNumber: string;
}

const SafetyScreen = () => {
  const { t } = useTranslation('profile/safety');

  const router = useRouter();
  
  // State
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch emergency contact from backend
  const fetchEmergencyContact = async () => {
    try {
      setLoading(true);
      const user = auth().currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const idToken = await user.getIdToken();
      const response = await axios.get(`${BASE_URL}/users/emergency-contact`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        timeout: 10000,
      });

      if (response.data && response.data.name && response.data.phoneNumber) {
        setEmergencyContact({
          name: response.data.name,
          phoneNumber: response.data.phoneNumber
        });
      }
    } catch (error: any) {
      console.error('Error fetching emergency contact:', error);
      if (error.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load emergency contact');
      }
    } finally {
      setLoading(false);
    }
  };

  // Save emergency contact
  const saveEmergencyContact = async () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      Alert.alert('Error', 'Please fill in both name and phone number');
      return;
    }

    try {
      setSaving(true);
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const idToken = await user.getIdToken();
      const contactData = {
        name: newContactName.trim(),
        phoneNumber: newContactPhone.trim()
      };

      await axios.post(`${BASE_URL}/users/emergency-contact`, contactData, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        timeout: 10000,
      });

      setEmergencyContact(contactData);
      setNewContactName('');
      setNewContactPhone('');
      setShowContactModal(false);
      Alert.alert(t('saveSuccess'), t('updateSuccess'));
    } catch (error: any) {
      console.error('Error saving emergency contact:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save emergency contact');
    } finally {
      setSaving(false);
    }
  };

  // Update emergency contact
  const updateEmergencyContact = async () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      Alert.alert('Error', 'Please fill in both name and phone number');
      return;
    }

    try {
      setSaving(true);
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const idToken = await user.getIdToken();
      const contactData = {
        name: newContactName.trim(),
        phoneNumber: newContactPhone.trim()
      };

      await axios.put(`${BASE_URL}/users/emergency-contact`, contactData, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        timeout: 10000,
      });

      setEmergencyContact(contactData);
      setNewContactName('');
      setNewContactPhone('');
      setShowContactModal(false);
      Alert.alert(t('saveSuccess'), t('updateSuccess'));
    } catch (error: any) {
      console.error('Error updating emergency contact:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update emergency contact');
    } finally {
      setSaving(false);
    }
  };

  // Delete emergency contact
  const deleteEmergencyContact = () => {
    Alert.alert(
      t('removeContactTitle'),
      t('removeContactText'),
      [
        { text: "{t('cancel')}", style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth().currentUser;
              if (!user) return;

              const idToken = await user.getIdToken();
              await axios.delete(`${BASE_URL}/users/emergency-contact`, {
                headers: {
                  Authorization: `Bearer ${idToken}`,
                },
                timeout: 10000,
              });

              setEmergencyContact(null);
              Alert.alert(t('saveSuccess'), t('updateSuccess'));
            } catch (error: any) {
              console.error('Error deleting emergency contact:', error);
              Alert.alert('Error', 'Failed to remove emergency contact');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    fetchEmergencyContact();
  }, []);

  // Emergency call handler
  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Call',
      'This will immediately call UAE emergency services (999)',
      [
        { text: "{t('cancel')}", style: 'cancel' },
        {
          text: 'Call 999',
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:999').catch(() => {
              Alert.alert('Error', 'Could not place emergency call');
            });
          }
        }
      ]
    );
  };

  const callEmergencyContact = () => {
    if (!emergencyContact) return;
    
    Alert.alert(
      t('callUser', { name: emergencyContact.name }),
      t('confirmCall', { phone: emergencyContact.phoneNumber }),
      [
        { text: "{t('cancel')}", style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${emergencyContact.phoneNumber}`).catch(() => {
              Alert.alert('Error', 'Could not place call');
            });
          }
        }
      ]
    );
  };

  const openContactModal = (isEdit: boolean = false) => {
    if (isEdit && emergencyContact) {
      setNewContactName(emergencyContact.name);
      setNewContactPhone(emergencyContact.phoneNumber);
    } else {
      setNewContactName('');
      setNewContactPhone('');
    }
    setShowContactModal(true);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-6 pt-[70px] pb-4 shadow-sm">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <Text className="text-xl ml-4 font-bold font-[Afacad]">{t('title')}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Emergency Services */}
        <View className="mt-6">
          <Text className="text-xl font-bold font-[Afacad] text-black mb-4">
            {t('emergencyServices')}
          </Text>

          {/* Emergency Button */}
          <Pressable 
            onPress={handleEmergencyCall}
            className="bg-red-500 p-5 rounded-2xl mb-4 shadow-lg"
            style={{
              shadowColor: '#DC2626',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4">
                <Ionicons name="call" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-bold font-[Afacad]">
                  {t('emergencyCall')}
                </Text>
                <Text className="text-red-100 text-sm font-[Afacad]">
                  {t('dial999')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </View>
          </Pressable>
        </View>

        {/* Emergency Contact */}
        <View className="mt-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold font-[Afacad] text-black">
              {t('emergencyContact')}
            </Text>
          </View>

          {loading ? (
            <View className="bg-gray-50 p-6 rounded-xl items-center">
              <ActivityIndicator size="large" color="#00BD5F" />
              <Text className="text-gray-600 font-[Afacad] mt-2">	{t('loading')}</Text>
            </View>
          ) : emergencyContact ? (
            <View className="bg-gray-50 p-4 rounded-xl shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-lg font-bold font-[Afacad] text-black">
                    {emergencyContact.name}
                  </Text>
                  <Text className="text-gray-600 font-[Afacad]">
                    {emergencyContact.phoneNumber}
                  </Text>
                </View>
                <View className="flex-row">
                  <Pressable
                    onPress={callEmergencyContact}
                    className="bg-green-500 p-2 rounded-full mr-2"
                  >
                    <Ionicons name="call" size={16} color="white" />
                  </Pressable>
                  <Pressable
                    onPress={() => openContactModal(true)}
                    className="bg-blue-500 p-2 rounded-full mr-2"
                  >
                    <Ionicons name="pencil" size={16} color="white" />
                  </Pressable>
                  <Pressable
                    onPress={deleteEmergencyContact}
                    className="bg-red-500 p-2 rounded-full"
                  >
                    <Ionicons name="trash" size={16} color="white" />
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <View className="bg-gray-50 p-6 rounded-xl items-center">
              <Ionicons name="person-add" size={48} color="#9CA3AF" />
              <Text className="text-lg font-bold font-[Afacad] text-gray-800 mt-3">
                {t('noContact')}
              </Text>
              <Text className="text-gray-600 font-[Afacad] text-center mt-1 mb-4">
                {t('noContactText')}
              </Text>
              <Pressable
                onPress={() => openContactModal(false)}
                className="bg-[#00BD5F] px-6 py-3 rounded-full"
              >
                <Text className="text-white font-[Afacad] font-medium">
                  {t('addContact')}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Safety Tips */}
        <View className="mt-6 mb-8">
          <Text className="text-xl font-bold font-[Afacad] text-black mb-4">
            {t('tipsTitle')}
          </Text>
          <View className="bg-blue-50 p-4 rounded-xl">
            <Text className="text-blue-800 font-[Afacad] font-medium mb-2">
              {t('tipHeader')}
            </Text>
            <Text className="text-blue-700 font-[Afacad] text-sm leading-5">
              {t('tipBody')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit Contact Modal */}
      <Modal
        visible={showContactModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowContactModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold font-[Afacad] text-black">
                {emergencyContact ? "{t('editContact')}" : "{t('addContact')}"}
              </Text>
              <Pressable onPress={() => setShowContactModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <TextInput
              placeholder={t('contactNamePlaceholder')}
              value={newContactName}
              onChangeText={setNewContactName}
              className="border border-gray-300 rounded-xl px-4 py-3 mb-4 font-[Afacad]"
            />

            <TextInput
              placeholder={t('contactPhonePlaceholder')}
              value={newContactPhone}
              onChangeText={setNewContactPhone}
              keyboardType="phone-pad"
              className="border border-gray-300 rounded-xl px-4 py-3 mb-6 font-[Afacad]"
            />

            <View className="flex-row space-x-3">
              <Pressable
                onPress={() => setShowContactModal(false)}
                disabled={saving}
                className="flex-1 bg-gray-200 p-4 rounded-xl"
              >
                <Text className="text-center font-bold font-[Afacad] text-gray-700">
                  {t('cancel')}
                </Text>
              </Pressable>
              <Pressable
                onPress={emergencyContact ? updateEmergencyContact : saveEmergencyContact}
                disabled={saving}
                className="flex-1 bg-[#00BD5F] p-4 rounded-xl"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-center font-bold font-[Afacad] text-white">
                    {emergencyContact ? "	{t('update')}" : "{t('add')}"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SafetyScreen;