import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileMenu from './ProfileMenu';

const Header = () => {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View>
      {/* Top Bar */}
      <View className="px-8 flex-row items-center justify-between mb-4">
        <Pressable onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={34} color="black" />
        </Pressable>
        <Text className="text-5xl font-bold text-black font-[Afacad]">YallaGo</Text>
        <View className="w-6" />
      </View>

      {/* Bottom Sheet Modal */}
      <ProfileMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        userName="Bekhruz"
        rating={5}
      />
    </View>
  );
};

export default Header;
