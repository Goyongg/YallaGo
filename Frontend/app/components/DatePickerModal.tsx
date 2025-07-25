import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TouchableWithoutFeedback } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedDate: Date) => void;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const today = new Date();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const generateDays = () => {
    const days = [];
    for (let i = 0; i <= 30; i++) {
      // Create a base date set to today at 00:00 (midnight)
      const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Clone the base date and add `i` days to it
      // This is to avoid modifying the baseDate in the loop
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      const label =
        i === 0
          ? 'Today'
          : i === 1
          ? 'Tomorrow'
          : date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
      days.push({ label, date });
    }
    return days;
  };

  const dayOptions = generateDays();

  const handleDone = () => {
    // Get the selected base date from the day options
    const selectedDate = dayOptions[selectedDayIndex].date;
    
    // Return the date at midnight (00:00:00)
    const finalDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      0, // hour = 0
      0, // minute = 0
      0  // second = 0
    );

    onConfirm(finalDate);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/30">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-3xl px-4 pt-4 pb-8">
              {/* Header */}
              <Text className="text-center text-base font-semibold text-gray-800 font-[Afacad] mb-4">
                Date of ride
              </Text>

              {/* Day Picker */}
              <View className="flex-row justify-center items-center mb-4">
                <View className="w-48">
                  <Picker
                    selectedValue={selectedDayIndex}
                    onValueChange={(itemValue) => setSelectedDayIndex(itemValue)}
                    style={{ width: '100%' }}
                    itemStyle={{ fontFamily: 'Afacad', fontSize: 18, color: '#000', textAlign: 'center' }}
                  >
                    {dayOptions.map((day, index) => (
                      <Picker.Item key={index} label={day.label} value={index} />
                    ))}
                  </Picker>
                </View>
              </View>

              <Pressable
                onPress={handleDone}
                className="bg-brand py-3 rounded-xl items-center"
              >
                <Text className="text-white text-base font-[Afacad]">Done</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default DatePickerModal;