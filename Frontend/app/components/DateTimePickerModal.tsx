// i18n for DateTimePickerModal.tsx
import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TouchableWithoutFeedback, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';

interface DateTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedDate: Date) => void;
}

const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({ visible, onClose, onConfirm }) => {
  const { t } = useTranslation('components/DateTimePickerModal');
  const today = new Date();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedHour, setSelectedHour] = useState(today.getHours());

  const roundToNearestFive = (minutes: number) => Math.round(minutes / 5) * 5;
  const [selectedMinute, setSelectedMinute] = useState(roundToNearestFive(today.getMinutes()));

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
    const baseDate = dayOptions[selectedDayIndex].date;
    let day = baseDate.getDate();
    let month = baseDate.getMonth();
    let year = baseDate.getFullYear();

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
        <View className="flex-1 justify-end bg-black/30">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-3xl px-4 pt-4 pb-8">
              {/* Header */}
              <Text className="text-center text-base font-semibold text-gray-800 font-[Afacad] mb-2">
                {t('header')}
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
                      <Picker.Item key={val} label={String(val).padStart(2, '0')} value={val} />
                    );
                  })}
                </Picker>
              </View>
              <Pressable
                onPress={handleDone}
                className="bg-brand py-3 rounded-xl items-center"
              >
                <Text className="text-white text-base font-[Afacad]">{t('done')}</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default DateTimePickerModal;