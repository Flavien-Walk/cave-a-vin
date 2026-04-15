import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../../constants';
import { getWineColorHex, getWineColorLight } from '../../utils/bottle.utils';

interface WineBadgeProps {
  couleur: string;
  size?: 'sm' | 'md';
}

export const WineBadge: React.FC<WineBadgeProps> = ({ couleur, size = 'md' }) => {
  const labelMap: Record<string, string> = {
    rouge: 'Rouge', blanc: 'Blanc', rosé: 'Rosé',
    effervescent: 'Effervescent', moelleux: 'Moelleux', autre: 'Autre',
  };
  return (
    <View style={[
      styles.badge,
      { backgroundColor: getWineColorLight(couleur), borderColor: getWineColorHex(couleur) },
      size === 'sm' && styles.badgeSm,
    ]}>
      <View style={[styles.dot, { backgroundColor: getWineColorHex(couleur) }]} />
      <Text style={[styles.text, { color: getWineColorHex(couleur) }, size === 'sm' && styles.textSm]}>
        {labelMap[couleur] ?? couleur}
      </Text>
    </View>
  );
};

interface QuantityBadgeProps {
  quantity: number;
  urgent?: boolean;
}

export const QuantityBadge: React.FC<QuantityBadgeProps> = ({ quantity, urgent }) => (
  <View style={[styles.qty, urgent && styles.qtyUrgent]}>
    <Text style={[styles.qtyText, urgent && styles.qtyTextUrgent]}>
      {quantity} {quantity > 1 ? 'bouteilles' : 'bouteille'}
    </Text>
  </View>
);

interface TextBadgeProps {
  label: string;
  color?: string;
  bg?: string;
}

export const TextBadge: React.FC<TextBadgeProps> = ({ label, color = Colors.brunMoyen, bg = Colors.champagne }) => (
  <View style={[styles.textBadge, { backgroundColor: bg }]}>
    <Text style={[styles.text, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '600' },
  textSm: { fontSize: 11 },

  qty: {
    backgroundColor: Colors.vertSaugeLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  qtyUrgent: { backgroundColor: Colors.rougeAlerteLight },
  qtyText: { fontSize: 12, fontWeight: '600', color: Colors.vertSauge },
  qtyTextUrgent: { color: Colors.rougeAlerte },

  textBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
});
