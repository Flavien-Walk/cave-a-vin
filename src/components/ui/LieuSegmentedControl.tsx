import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing } from '../../constants';

export interface LieuEntry {
  lieu: string;
  nbBottles: number;
}

interface Props {
  entries: LieuEntry[];
  activeLieu: string | null;
  onChange: (lieu: string) => void;
}

export function LieuSegmentedControl({ entries, activeLieu, onChange }: Props) {
  if (entries.length === 0) return null;

  // Single lieu — no need for a switch, just show the label
  if (entries.length === 1) {
    const { lieu, nbBottles } = entries[0];
    return (
      <View style={s.single}>
        <Ionicons name="location" size={12} color={Colors.lieDeVin} />
        <Text style={s.singleText}>{lieu}</Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>{nbBottles}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.track}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.row}
        bounces={false}
      >
        {entries.map(({ lieu, nbBottles }) => {
          const active = activeLieu === lieu;
          return (
            <TouchableOpacity
              key={lieu}
              style={[s.segment, active && s.segmentActive]}
              onPress={() => onChange(lieu)}
              activeOpacity={0.75}
            >
              {active && (
                <Ionicons name="location" size={10} color={Colors.lieDeVin} style={s.pin} />
              )}
              <Text
                style={[s.label, active && s.labelActive]}
                numberOfLines={1}
              >
                {lieu}
              </Text>
              <View style={[s.badge, active && s.badgeActive]}>
                <Text style={[s.badgeText, active && s.badgeTextActive]}>
                  {nbBottles}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  // Multi-lieu track — the pill container
  track: {
    backgroundColor: Colors.parchemin,
    borderRadius: Radius.full,
    padding: 3,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: 2,
  },

  // Each segment
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  segmentActive: {
    backgroundColor: Colors.champagne,
    ...Shadow.sm,
  },

  pin: {
    marginRight: -2,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.brunMoyen,
    maxWidth: 110,
  },
  labelActive: {
    color: Colors.lieDeVin,
    fontWeight: '700',
  },

  // Count badge
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeActive: {
    backgroundColor: Colors.lieDeVin + '18',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.brunMoyen,
  },
  badgeTextActive: {
    color: Colors.lieDeVin,
  },

  // Single lieu display
  single: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing.md,
    paddingHorizontal: 2,
  },
  singleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.lieDeVin,
  },
});
