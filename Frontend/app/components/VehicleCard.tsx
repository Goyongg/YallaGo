// components/VehicleCard.tsx - Reusable vehicle card component
import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Vehicle } from '@/interfaces/interfaces';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicleId: string) => void;
  canDelete: boolean;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ 
  vehicle, 
  onEdit, 
  onDelete, 
  canDelete 
}) => {
  const handleDelete = () => {
    if (!canDelete) {
      Alert.alert(
        'Cannot Delete Last Vehicle',
        'You cannot delete your last vehicle. You need at least one vehicle to create rides. Please add a new vehicle before deleting this one.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicle.make} ${vehicle.model}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(vehicle.id),
        },
      ]
    );
  };

  return (
    <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <Ionicons name="car" size={20} color="#007AFF" />
            <Text className="text-lg font-bold font-[Afacad] ml-2">
              {vehicle.make} {vehicle.model}
            </Text>
          </View>
          
          <View className="space-y-1">
            <View className="flex-row items-center">
              <Ionicons name="card-outline" size={16} color="#666" />
              <Text className="text-gray-600 font-[Afacad] ml-2">
                {vehicle.plateNumber}
              </Text>
            </View>
            
            {vehicle.color && (
              <View className="flex-row items-center">
                <Ionicons name="color-palette-outline" size={16} color="#666" />
                <Text className="text-gray-600 font-[Afacad] ml-2">
                  {vehicle.color}
                </Text>
              </View>
            )}
            
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text className="text-gray-600 font-[Afacad] ml-2">
                {vehicle.seats} seats
              </Text>
            </View>
          </View>
        </View>
        
        <View className="flex-row space-x-2">
          <Pressable
            onPress={() => onEdit(vehicle)}
            className="p-2 bg-blue-50 rounded-lg"
          >
            <Ionicons name="create-outline" size={20} color="#007AFF" />
          </Pressable>
          
          <Pressable
            onPress={handleDelete}
            className={`p-2 rounded-lg ${canDelete ? 'bg-red-50' : 'bg-gray-100'}`}
          >
            <Ionicons 
              name="trash-outline" 
              size={20} 
              color={canDelete ? "#FF3B30" : "#CCC"} 
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default VehicleCard;