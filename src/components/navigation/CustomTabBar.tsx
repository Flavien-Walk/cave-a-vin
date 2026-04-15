import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Shadow } from '../../constants';

const TABS = [
  { name: 'index',    icon: 'home-outline',    iconActive: 'home',    label: 'Accueil' },
  { name: 'cave',     icon: 'wine-outline',    iconActive: 'wine',    label: 'Cave' },
  { name: 'discover', icon: 'compass-outline', iconActive: 'compass', label: 'Découvrir' },
  { name: 'stats',    icon: 'bar-chart-outline',iconActive: 'bar-chart', label: 'Stats' },
];

export function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.container, { paddingBottom }]}>
      {/* Tabs gauche */}
      <View style={styles.side}>
        {TABS.slice(0, 2).map((tab, i) => {
          const isActive = state.index === i;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => navigation.navigate(tab.name)}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons
                name={(isActive ? tab.iconActive : tab.icon) as any}
                size={22}
                color={isActive ? Colors.lieDeVin : Colors.brunClair}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* FAB central */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(tabs)/add')}
          accessibilityLabel="Ajouter une bouteille"
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Tabs droite */}
      <View style={styles.side}>
        {TABS.slice(2).map((tab, i) => {
          const idx = i + 2;
          const isActive = state.index === idx;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => navigation.navigate(tab.name)}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons
                name={(isActive ? tab.iconActive : tab.icon) as any}
                size={22}
                color={isActive ? Colors.lieDeVin : Colors.brunClair}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.champagne,
    borderTopWidth: 1,
    borderTopColor: Colors.parchemin,
    paddingTop: 8,
    ...Shadow.md,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    color: Colors.brunClair,
    fontWeight: '500',
  },
  labelActive: {
    color: Colors.lieDeVin,
    fontWeight: '700',
  },
  fabContainer: {
    width: 72,
    alignItems: 'center',
    marginTop: -20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.lieDeVin,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
});
