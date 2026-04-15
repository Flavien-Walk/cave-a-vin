import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator, StyleSheet,
  ViewStyle, TextStyle,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  label, onPress, variant = 'primary', loading, disabled, fullWidth, style, textStyle, icon,
}) => {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading
        ? <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? Colors.lieDeVin : Colors.white} size="small" />
        : <>
            {icon}
            <Text style={[styles.text, styles[`text_${variant}` as keyof typeof styles], textStyle]}>{label}</Text>
          </>
      }
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    minHeight: 48,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  primary:   { backgroundColor: Colors.lieDeVin },
  secondary: { backgroundColor: Colors.champagne, borderWidth: 1.5, borderColor: Colors.lieDeVin + '80' },
  ghost:     { backgroundColor: Colors.transparent },
  danger:    { backgroundColor: Colors.rougeAlerte },

  text:          { ...Typography.buttonText },
  text_primary:  { color: Colors.white },
  text_secondary:{ color: Colors.lieDeVin },
  text_ghost:    { color: Colors.brunMoyen },
  text_danger:   { color: Colors.white },
});
