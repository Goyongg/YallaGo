import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, TouchableWithoutFeedback, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface DateTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedDate: Date) => void;
}

const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const today = new Date();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedHour, setSelectedHour] = useState(today.getHours());

  // This rounds current minute to 5 (when picker opens), instead of always showing 00 when not divisible by 5
  const roundToNearestFive = (minutes: number) => Math.round(minutes / 5) * 5;
  const [selectedMinute, setSelectedMinute] = useState(roundToNearestFive(today.getMinutes()));

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
    const baseDate = dayOptions[selectedDayIndex].date;

    // Extract day, month, and year from the selected base date
    let day = baseDate.getDate();
    let month = baseDate.getMonth();
    let year = baseDate.getFullYear();

    // Fix for early morning bug:
    // If time is between 00:00 and 03:55, adjust the date forward
    if (selectedHour < 4) {
      const correctedDate = new Date(baseDate);
      correctedDate.setDate(correctedDate.getDate() + 1);
      day = correctedDate.getDate();
      month = correctedDate.getMonth();
      year = correctedDate.getFullYear();
    }

    const selected = new Date(year, month, day, selectedHour, selectedMinute, 0);

    onConfirm(selected);
    onClose();
  };


  return (
    <Modal transparent visible={visible} animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-3xl px-4 pt-4 pb-8">
              {/* Header */}
              <Text className="text-center text-base font-semibold text-gray-800 font-[Afacad] mb-2">
                Date and time of ride
              </Text>

              {/* Pickers */}
              <View className="flex-row justify-between items-center">
                {/* Day Picker */}
                <Picker
                  selectedValue={selectedDayIndex}
                  onValueChange={(itemValue) => setSelectedDayIndex(itemValue)}
                  style={{ flex: 1 }}
                  itemStyle={{ fontFamily: 'Afacad', fontSize: 18, color: '#000' }}
                >
                  {dayOptions.map((day, index) => (
                    <Picker.Item key={index} label={day.label} value={index} />
                  ))}
                </Picker>

                {/* Hour Picker */}
                <Picker
                  selectedValue={selectedHour}
                  onValueChange={(itemValue) => setSelectedHour(itemValue)}
                  style={{ flex: 1 }}
                  itemStyle={{ fontFamily: 'Afacad', fontSize: 18, color: '#000' }}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <Picker.Item key={i} label={String(i).padStart(2, '0')} value={i} />
                  ))}
                </Picker>

                {/* Minute Picker */}
                <Picker
                  selectedValue={selectedMinute}
                  onValueChange={(itemValue) => setSelectedMinute(itemValue)}
                  style={{ flex: 1 }}
                  itemStyle={{ fontFamily: 'Afacad', fontSize: 18, color: '#000' }}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const val = i * 5;
                    return (
                      <Picker.Item
                        key={val}
                        label={String(val).padStart(2, '0')}
                        value={val}
                      />
                    );
                  })}
                </Picker>
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

export default DateTimePickerModal;