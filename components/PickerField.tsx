import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

type Props = {
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export default function PickerField({ value, icon, onPress }: Props) {
  return (
    <View style={styles.fieldOuter}>
      <Pressable style={styles.fieldInner} onPress={onPress}>
        <Ionicons
          name={icon}
          size={22}
          color={COLORS.primary}
          style={styles.icon}
        />
        <Text style={styles.value}>{value}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldOuter: {
    width: '100%',
    marginBottom: 14,
  },
  fieldInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  icon: { paddingRight: 10 },
  value: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
});
