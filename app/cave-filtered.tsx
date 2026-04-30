import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../src/constants';
import { bottlesApi } from '../src/api';
import { BottleCard } from '../src/components/bottle/BottleCard';
import type { Bottle } from '../src/types';

type FilterType = 'favoritesOnly' | 'urgentOnly';

export default function CaveFilteredScreen() {
  const { filter, title } = useLocalSearchParams<{ filter: FilterType; title?: string }>();

  const [bottles, setBottles]       = useState<Bottle[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [isLoadMore, setIsLoadMore] = useState(false);
  const [page, setPage]             = useState(1);
  const [hasNext, setHasNext]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const fetchPage = useCallback(async (p: number, append = false) => {
    if (p === 1) setIsLoading(true); else setIsLoadMore(true);
    setError(null);
    try {
      const api = filter === 'favoritesOnly' ? bottlesApi.getFavorites : bottlesApi.getUrgent;
      const { items, pagination } = await api(p, 50);
      setBottles(prev => append ? [...prev, ...items] : items);
      setPage(p);
      setHasNext(pagination.hasNextPage);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
      setIsLoadMore(false);
    }
  }, [filter]);

  useFocusEffect(useCallback(() => { fetchPage(1); }, [fetchPage]));

  const loadMore = () => {
    if (!isLoadMore && hasNext) fetchPage(page + 1, true);
  };

  const screenTitle = title ?? (filter === 'favoritesOnly' ? 'Favoris' : filter === 'urgentOnly' ? 'À boire bientôt' : 'Cave');

  const emptyText = filter === 'favoritesOnly'
    ? 'Aucun favori — appuyez sur ♥ sur une bouteille pour l\'ajouter.'
    : filter === 'urgentOnly'
    ? 'Aucune bouteille urgente à boire pour l\'instant.'
    : 'Aucune bouteille.';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brunMoka} />
        </TouchableOpacity>
        <View style={s.titleBlock}>
          <Text style={s.title}>{screenTitle}</Text>
          {!isLoading && <Text style={s.count}>{bottles.length} bouteille{bottles.length !== 1 ? 's' : ''}</Text>}
        </View>
        <View style={{ width: 38 }} />
      </View>

      {error && (
        <TouchableOpacity style={s.errorBanner} onPress={() => fetchPage(1)} activeOpacity={0.8}>
          <Ionicons name="wifi-outline" size={14} color={Colors.white} />
          <Text style={s.errorText}>{error}</Text>
          <Ionicons name="refresh-outline" size={14} color={Colors.white} />
        </TouchableOpacity>
      )}

      <FlatList
        data={bottles}
        keyExtractor={b => b._id}
        contentContainerStyle={[s.list, bottles.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchPage(1)} tintColor={Colors.lieDeVin} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <BottleCard bottle={item} onPress={() => router.push(`/bottle/${item._id}` as any)} />
        )}
        ListFooterComponent={isLoadMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={Colors.lieDeVin} /> : null}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <Ionicons
                name={filter === 'favoritesOnly' ? 'heart-outline' : 'time-outline'}
                size={40}
                color={Colors.parchemin}
              />
              <Text style={s.emptyText}>{emptyText}</Text>
            </View>
          ) : null
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

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.rougeAlerte, paddingHorizontal: Spacing.lg, paddingVertical: 10 },
  errorText:   { flex: 1, fontSize: 13, color: Colors.white, fontWeight: '600' },

  list:      { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl },
  emptyText: { fontSize: 14, color: Colors.brunClair, textAlign: 'center', lineHeight: 20 },
});
