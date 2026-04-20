import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label, error, required, hint, style, rightIcon, multiline, ...rest
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View style={[
        styles.inputRow,
        multiline && styles.inputRowMultiline,
        focused && styles.inputFocused,
        error  && styles.inputError,
      ]}>
        <TextInput
          multiline={multiline}
          style={[styles.input, multiline && styles.inputMultiline, style]}
          placeholderTextColor={Colors.brunClair}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          accessibilityHint={hint}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...rest}
        />
        {rightIcon && !multiline && (
          <View style={styles.rightIconWrap}>{rightIcon}</View>
        )}
      </View>
      {hint  && !error && <Text style={styles.hint}>{hint}</Text>}
      {error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label: {
    ...Typography.bodySmall,
    fontWeight: '500',
    color: Colors.brunMoyen,
    marginBottom: Spacing.xs,
  },
  required: { color: Colors.rougeAlerte },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.champagne,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.parchemin,
    minHeight: 50,
  },
  inputRowMultiline: {
    alignItems: 'flex-start',
    minHeight: 90,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    color: Colors.brunMoka,
  },
  inputMultiline: {
    paddingVertical: Spacing.md,
  },
  inputFocused: { borderColor: Colors.lieDeVin, borderWidth: 2 },
  inputError:   { borderColor: Colors.rougeAlerte },
  rightIconWrap: {
    paddingRight: Spacing.sm,
    paddingLeft: Spacing.xs,
    alignSelf: 'center',
  },
  hint:  { ...Typography.caption, color: Colors.brunClair, marginTop: 4 },
  error: { ...Typography.caption, color: Colors.rougeAlerte, marginTop: 4 },
});
