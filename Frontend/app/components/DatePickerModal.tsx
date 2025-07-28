// i18n integration for DatePickerModal.tsx
import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TouchableWithoutFeedback } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedDate: Date) => void;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({ visible, onClose, onConfirm }) => {
  const { t } = useTranslation('components/DatePickerModal');
  const today = new Date();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const generateDays = () => {
    const days = [];
    for (let i = 0; i <= 30; i++) {
      const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      const label =
        i === 0
          ? t('today')
          : i === 1
          ? t('tomorrow')
          : date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
      days.push({ label, date });
    }
    return days;
  };

  const dayOptions = generateDays();

  const handleDone = () => {
    const selectedDate = dayOptions[selectedDayIndex].date;
    const finalDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      0, 0, 0
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
              <Text className="text-center text-base font-semibold text-gray-800 font-[Afacad] mb-4">
                {t('header')}
              </Text>

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

              <Pressable onPress={handleDone} className="bg-brand py-3 rounded-xl items-center">
                <Text className="text-white text-base font-[Afacad]">{t('done')}</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default DatePickerModal;
