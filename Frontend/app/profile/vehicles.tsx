import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useHomeUserData from '@/hooks/useHomeUserData';
import useVehicles from '@/hooks/useVehicles';

const VehiclesPage = () => {
  const router = useRouter();
  const { userData, refetch } = useHomeUserData();
  const { vehicles, loading, error, hasVehicle, addVehicle, updateVehicle, deleteVehicle } = useVehicles();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    plateNumber: '',
    color: '',
    seats: ''
  });

  const hasFetchedRef = useRef(false);
      useEffect(() => {
      if (!hasFetchedRef.current) {
        refetch();
        hasFetchedRef.current = true;
      }
    }, []);

  // Redirect if not a driver
  React.useEffect(() => {
    if (userData && userData.role !== 'driver') {
      router.back();
    }
  }, [userData]);

  const resetForm = () => {
    setFormData({
      make: '',
      model: '',
      plateNumber: '',
      color: '',
      seats: ''
    });
  };

  const handleAddVehicle = async () => {
    if (!formData.make || !formData.model || !formData.plateNumber || !formData.seats) {
      Alert.alert('Error', 'Please fill in all required fields (make, model, plate number, and seats)');
      return;
    }

    const seatsNum = parseInt(formData.seats);
    if (isNaN(seatsNum) || seatsNum < 1 || seatsNum > 8) {
      Alert.alert('Error', 'Seats must be a number between 1 and 8');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const vehicleData = {
        make: formData.make.trim(),
        model: formData.model.trim(),
        plateNumber: formData.plateNumber.trim().toUpperCase(),
        color: formData.color.trim() || undefined,
        seats: seatsNum
      };

      const response = await addVehicle(vehicleData);
      
      setShowAddModal(false);
      resetForm();
      Alert.alert('Success', response.message || 'Vehicle added successfully!');
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVehicle = async () => {
    setIsSubmitting(true);
    
    try {
      const updateData = {
        color: formData.color.trim() || undefined
      };

      const response = await updateVehicle(updateData);
      
      setShowEditModal(false);
      resetForm();
      Alert.alert('Success', response.message || 'Vehicle updated successfully!');
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = () => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete your vehicle? You will not be able to create rides until you add a new vehicle.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const response = await deleteVehicle();
              Alert.alert('Success', response.message || 'Vehicle deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete vehicle');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const openEditModal = () => {
    if (!hasVehicle || vehicles.length === 0) return;
    
    const vehicle = vehicles[0];
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      plateNumber: vehicle.plateNumber,
      color: vehicle.color || '',
      seats: vehicle.seats.toString()
    });
    setShowEditModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg font-[Afacad]">Loading...</Text>
      </View>
    );
  }

  const vehicleData = hasVehicle && vehicles.length > 0 ? vehicles[0] : null;

  return (
    <View className="flex-1 bg-white px-6 pt-[70px]">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <Text className="text-xl ml-4 font-bold font-[Afacad]">My Vehicle</Text>
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <Text className="font-[Afacad] text-red-700">{error}</Text>
        </View>
      )}

      <ScrollView className="flex-1">
        {!hasVehicle ? (
          // No vehicle - show add vehicle UI
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="car" size={80} color="#ccc" />
            <Text className="text-xl text-gray-600 mt-6 font-bold font-[Afacad]">No Vehicle Added</Text>
            <Text className="text-sm text-gray-400 text-center mt-2 mb-8 px-4 font-[Afacad]">
              You need to add a vehicle to create and offer rides to passengers
            </Text>
            <Pressable 
              onPress={openAddModal} 
              className="bg-green-500 px-8 py-4 rounded-lg"
              disabled={isSubmitting}
            >
              <Text className="text-white font-[Afacad] font-semibold text-lg">
                {isSubmitting ? 'Adding...' : 'Add My Vehicle'}
              </Text>
            </Pressable>
          </View>
        ) : (
          // Has vehicle - show vehicle details
          <View>
            <View className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
              <View className="flex-row items-center mb-4">
                <Ionicons name="car" size={24} color="#00BD5F" />
                <Text className="text-lg font-bold font-[Afacad] ml-2">Your Vehicle</Text>
              </View>
              
              <View className="space-y-3">
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-600 font-[Afacad]">Make & Model</Text>
                  <Text className="font-semibold font-[Afacad]">
                    {vehicleData?.make} {vehicleData?.model}
                  </Text>
                </View>
                
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-600 font-[Afacad]">Plate Number</Text>
                  <Text className="font-semibold font-[Afacad] font-mono">
                    {vehicleData?.plateNumber}
                  </Text>
                </View>
                
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-600 font-[Afacad]">Color</Text>
                  <Text className="font-semibold font-[Afacad]">
                    {vehicleData?.color || 'Not specified'}
                  </Text>
                </View>
                
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-600 font-[Afacad]">Seats</Text>
                  <Text className="font-semibold font-[Afacad]">
                    {vehicleData?.seats} seats
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-3">
              <Pressable 
                onPress={openEditModal}
                className="bg-green-500 rounded-lg py-4 flex-row items-center justify-center"
                disabled={isSubmitting}
              >
                <Ionicons name="pencil" size={20} color="white" />
                <Text className="text-white font-[Afacad] font-semibold text-lg ml-2">
                  {isSubmitting ? 'Updating...' : 'Edit Vehicle'}
                </Text>
              </Pressable>

              <Pressable 
                onPress={handleDeleteVehicle}
                className="bg-red-500 rounded-lg py-4 flex-row items-center justify-center"
                disabled={isSubmitting}
              >
                <Ionicons name="trash" size={20} color="white" />
                <Text className="text-white font-[Afacad] font-semibold text-lg ml-2">
                  {isSubmitting ? 'Deleting...' : 'Delete Vehicle'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Vehicle Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white pt-[70px] px-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold font-[Afacad]">Add Vehicle</Text>
            <Pressable onPress={() => setShowAddModal(false)} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color="black" />
            </Pressable>
          </View>

          <ScrollView className="flex-1">
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2 font-[Afacad]">
                Make <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={formData.make}
                onChangeText={(text) => setFormData(prev => ({ ...prev, make: text }))}
                className="border border-gray-300 rounded-lg px-4 py-3 font-[Afacad]"
                placeholder="e.g., Toyota, BMW, Honda"
                editable={!isSubmitting}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2 font-[Afacad]">
                Model <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={formData.model}
                onChangeText={(text) => setFormData(prev => ({ ...prev, model: text }))}
                className="border border-gray-300 rounded-lg px-4 py-3 font-[Afacad]"
                placeholder="e.g., Camry, X3, Civic"
                editable={!isSubmitting}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2 font-[Afacad]">
                Plate Number <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={formData.plateNumber}
                onChangeText={(text) => setFormData(prev => ({ ...prev, plateNumber: text }))}
                className="border border-gray-300 rounded-lg px-4 py-3 font-[Afacad]"
                placeholder="e.g., ABC-123"
                autoCapitalize="characters"
                editable={!isSubmitting}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2 font-[Afacad]">Color</Text>
              <TextInput
                value={formData.color}
                onChangeText={(text) => setFormData(prev => ({ ...prev, color: text }))}
                className="border border-gray-300 rounded-lg px-4 py-3 font-[Afacad]"
                placeholder="e.g., White, Black, Blue (optional)"
                editable={!isSubmitting}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2 font-[Afacad]">
                Number of Seats <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={formData.seats}
                onChangeText={(text) => setFormData(prev => ({ ...prev, seats: text }))}
                className="border border-gray-300 rounded-lg px-4 py-3 font-[Afacad]"
                placeholder="e.g., 4"
                keyboardType="numeric"
                editable={!isSubmitting}
              />
              <Text className="text-xs text-gray-500 mt-1 font-[Afacad]">
                Enter a number between 1 and 8
              </Text>
            </View>

            <Pressable 
              onPress={handleAddVehicle}
              className="bg-green-500 rounded-lg py-4 mb-6"
              disabled={isSubmitting}
            >
              <Text className="text-white text-center font-semibold text-lg font-[Afacad]">
                {isSubmitting ? 'Adding Vehicle...' : 'Add Vehicle'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white pt-[70px] px-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold font-[Afacad]">Edit Vehicle</Text>
            <Pressable onPress={() => setShowEditModal(false)} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color="black" />
            </Pressable>
          </View>

          <ScrollView className="flex-1">
            <View className="mb-6 p-4 bg-gray-50 rounded-lg">
              <Text className="text-lg font-bold font-[Afacad] mb-2">
                {vehicleData?.make} {vehicleData?.model}
              </Text>
              <Text className="text-gray-600 font-[Afacad]">
                Plate: {vehicleData?.plateNumber}
              </Text>
              <Text className="text-gray-600 font-[Afacad]">
                Seats: {vehicleData?.seats}
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2 font-[Afacad]">
                Color
              </Text>
              <TextInput
                value={formData.color}
                onChangeText={(text) => setFormData(prev => ({ ...prev, color: text }))}
                className="border border-gray-300 rounded-lg px-4 py-3 font-[Afacad]"
                placeholder="e.g., White, Black, Blue"
                editable={!isSubmitting}
              />
              <Text className="text-xs text-gray-500 mt-1 font-[Afacad]">
                Currently only the color can be updated
              </Text>
            </View>

            <Pressable 
              onPress={handleEditVehicle}
              className="bg-green-500 rounded-lg py-4 mb-6"
              disabled={isSubmitting}
            >
              <Text className="text-white text-center font-semibold text-lg font-[Afacad]">
                {isSubmitting ? 'Updating Vehicle...' : 'Update Vehicle'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default VehiclesPage;