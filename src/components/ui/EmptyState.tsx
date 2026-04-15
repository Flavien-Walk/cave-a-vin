import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'wine-outline', title, subtitle, actionLabel, onAction,
}) => (
  <View style={styles.container} accessibilityRole="text">
    <Ionicons name={icon} size={56} color={Colors.parchemin} />
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    {actionLabel && onAction && (
      <Button label={actionLabel} onPress={onAction} style={styles.btn} />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.md,
  },
  title:    { ...Typography.h3, textAlign: 'center', color: Colors.brunMoyen },
  subtitle: { ...Typography.body, textAlign: 'center', color: Colors.brunClair },
  btn:      { marginTop: Spacing.md },
});
