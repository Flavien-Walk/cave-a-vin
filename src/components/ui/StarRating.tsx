import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants';

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value, onChange, size = 24, readonly = false,
}) => (
  <View style={styles.row} accessibilityRole="adjustable" accessibilityValue={{ now: value, min: 1, max: 5 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <TouchableOpacity
        key={i}
        onPress={() => !readonly && onChange?.(i)}
        disabled={readonly}
        activeOpacity={readonly ? 1 : 0.7}
        accessibilityLabel={`${i} étoile${i > 1 ? 's' : ''}`}
      >
        <Ionicons
          name={i <= value ? 'star' : 'star-outline'}
          size={size}
          color={i <= value ? Colors.ambreChaud : Colors.parchemin}
        />
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
