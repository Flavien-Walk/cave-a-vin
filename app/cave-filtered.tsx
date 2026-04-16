import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../src/constants';
import { useBottleStore } from '../src/stores';
import { BottleCard } from '../src/components/bottle/BottleCard';
import { isUrgent } from '../src/utils/bottle.utils';

type FilterType = 'favoritesOnly' | 'urgentOnly';

export default function CaveFilteredScreen() {
  const { filter, title } = useLocalSearchParams<{ filter: FilterType; title?: string }>();
  const { bottles } = useBottleStore();

  const filtered = useMemo(() => {
    if (filter === 'favoritesOnly') return bottles.filter(b => b.isFavorite && b.quantite > 0);
    if (filter === 'urgentOnly')    return bottles.filter(b => isUrgent(b) && b.quantite > 0);
    return [];
  }, [bottles, filter]);

  const screenTitle = title ?? (filter === 'favoritesOnly' ? 'Favoris' : filter === 'urgentOnly' ? 'À boire bientôt' : 'Cave');

  const emptyText = filter === 'favoritesOnly'
    ? 'Aucun favori — appuyez sur ♥ sur une bouteille pour l\'ajouter.'
    : filter === 'urgentOnly'
    ? 'Aucune bouteille urgente à boire pour l\'instant.'
    : 'Aucune bouteille.';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brunMoka} />
        </TouchableOpacity>
        <View style={s.titleBlock}>
          <Text style={s.title}>{screenTitle}</Text>
          <Text style={s.count}>{filtered.length} bouteille{filtered.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={b => b._id}
        contentContainerStyle={[s.list, filtered.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <BottleCard bottle={item} onPress={() => router.push(`/bottle/${item._id}` as any)} />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons
              name={filter === 'favoritesOnly' ? 'heart-outline' : 'time-outline'}
              size={40}
              color={Colors.parchemin}
            />
            <Text style={s.emptyText}>{emptyText}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cremeIvoire },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: Radius.full,
    backgroundColor: Colors.champagne, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.parchemin,
  },
  titleBlock: { alignItems: 'center' },
  title:      { ...Typography.h3, color: Colors.brunMoka },
  count:      { ...Typography.caption, color: Colors.brunClair, marginTop: 1 },

  list:      { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl },
  emptyText: { fontSize: 14, color: Colors.brunClair, textAlign: 'center', lineHeight: 20 },
});
