import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, required, hint, style, ...rest }) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error  && styles.inputError,
          style,
        ]}
        placeholderTextColor={Colors.brunClair}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        accessibilityHint={hint}
        {...rest}
      />
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
  input: {
    backgroundColor: Colors.champagne,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.parchemin,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.brunMoka,
    minHeight: 48,
  },
  inputFocused: { borderColor: Colors.lieDeVin, borderWidth: 2 },
  inputError:   { borderColor: Colors.rougeAlerte },
  hint:  { ...Typography.caption, color: Colors.brunClair, marginTop: 4 },
  error: { ...Typography.caption, color: Colors.rougeAlerte, marginTop: 4 },
});
