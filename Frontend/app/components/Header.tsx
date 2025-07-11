import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileMenu from './ProfileMenu';

interface HeaderProps {
  userName: string;
  rating: number;
  isDriver?: boolean;
  isCreateMode?: boolean;
  toggleCreateMode?: () => void;
  userRole: string; // Added userRole prop
}

const Header: React.FC<HeaderProps> = ({
  userName,
  rating,
  isDriver = false,
  isCreateMode = false,
  toggleCreateMode,
  userRole, // Added userRole to destructured props
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View>
      {/* Top Bar */}
      <View className="px-8 flex-row items-center justify-between mb-4">
        <Pressable onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={34} color="black" />
        </Pressable>
        <Text className="text-5xl font-bold text-black font-[Afacad]">YallaGo</Text>
        {isDriver ? (
          <Pressable onPress={toggleCreateMode}>
            <Ionicons
              name={isCreateMode ? 'search' : 'add-circle-outline'}
              size={30}
              color="black"
            />
          </Pressable>
        ) : (
          <View className="w-6" /> // Keeps spacing consistent
        )}
      </View>

      {/* Bottom Sheet Modal */}
      <ProfileMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        userName={userName}
        rating={rating}
        userRole={userRole} // Pass userRole to ProfileMenu
      />
    </View>
  );
};

export default Header;