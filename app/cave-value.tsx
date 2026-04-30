import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../src/constants';
import { statsApi, bottlesApi } from '../src/api';
import { BottleCard } from '../src/components/bottle/BottleCard';
import { formatPrice } from '../src/utils/bottle.utils';
import type { CaveValueData } from '../src/types';
import type { Bottle } from '../src/types';

export default function CaveValueScreen() {
  const [valueData, setValueData]   = useState<CaveValueData | null>(null);
  const [bottles, setBottles]       = useState<Bottle[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [isLoadMore, setIsLoadMore] = useState(false);
  const [page, setPage]             = useState(1);
  const [hasNext, setHasNext]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [value, { items, pagination }] = await Promise.all([
        statsApi.getCaveValue(),
        bottlesApi.getByValue(1, 50),
      ]);
      setValueData(value);
      setBottles(items);
      setPage(1);
      setHasNext(pagination.hasNextPage);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadMore || !hasNext) return;
    setIsLoadMore(true);
    try {
      const nextPage = page + 1;
      const { items, pagination } = await bottlesApi.getByValue(nextPage, 50);
      setBottles(prev => [...prev, ...items]);
      setPage(nextPage);
      setHasNext(pagination.hasNextPage);
    } catch { /* silencieux */ }
    finally { setIsLoadMore(false); }
  }, [isLoadMore, hasNext, page]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const totalValue   = valueData?.totalValue   ?? 0;
  const totalBottles = valueData?.totalBottles ?? 0;
  const pricedCount  = valueData?.pricedCount  ?? 0;
  const avgPrice     = valueData?.avgPrice     ?? 0;
  const pricedPct    = totalBottles > 0 ? Math.round((pricedCount / totalBottles) * 100) : 0;
  const lowDataWarning = pricedPct < 50 && totalBottles > 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brunMoka} />
        </TouchableOpacity>
        <Text style={s.title}>Valeur de ma cave</Text>
        <View style={{ width: 38 }} />
      </View>

      {error && (
        <TouchableOpacity style={s.errorBanner} onPress={fetchData} activeOpacity={0.8}>
          <Ionicons name="wifi-outline" size={14} color={Colors.white} />
          <Text style={s.errorText}>{error}</Text>
          <Ionicons name="refresh-outline" size={14} color={Colors.white} />
        </TouchableOpacity>
      )}

      <FlatList
        data={bottles}
        keyExtractor={b => b._id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchData} tintColor={Colors.lieDeVin} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          isLoading ? (
            <ActivityIndicator color={Colors.lieDeVin} style={{ marginVertical: Spacing.xxxl }} />
          ) : (
            <>
              <View style={s.heroCard}>
                <Text style={s.heroLabel}>VALEUR ESTIMÉE</Text>
                <Text style={s.heroValue}>{formatPrice(totalValue)}</Text>
                <Text style={s.heroSub}>{totalBottles} bouteille{totalBottles !== 1 ? 's' : ''} disponibles</Text>
              </View>

              <View style={s.statsRow}>
                <View style={s.statCell}>
                  <Text style={s.statValue}>{formatPrice(avgPrice)}</Text>
                  <Text style={s.statLabel}>Prix moyen</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statCell}>
                  <Text style={[s.statValue, pricedPct < 50 && { color: Colors.ambreChaud }]}>
                    {pricedPct}%
                  </Text>
                  <Text style={s.statLabel}>Bouteilles pricées</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statCell}>
                  <Text style={s.statValue}>{pricedCount}</Text>
                  <Text style={s.statLabel}>Pricées</Text>
                </View>
              </View>

              {lowDataWarning && (
                <View style={s.warning}>
                  <Ionicons name="information-circle-outline" size={15} color={Colors.ambreChaud} />
                  <Text style={s.warningText}>
                    Seulement {pricedPct}% de vos bouteilles ont un prix renseigné. La valeur affichée est une estimation partielle.
                  </Text>
                </View>
              )}

              <Text style={s.listTitle}>Vos bouteilles par valeur</Text>
            </>
          )
        }
        renderItem={({ item }) => (
          <BottleCard bottle={item} onPress={() => router.push(`/bottle/${item._id}` as any)} />
        )}
        ListFooterComponent={isLoadMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={Colors.lieDeVin} /> : null}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <Ionicons name="wine-outline" size={40} color={Colors.parchemin} />
              <Text style={s.emptyText}>Aucune bouteille dans la cave</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.cremeIvoire },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: Radius.full,
    backgroundColor: Colors.champagne, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.parchemin,
  },
  title: { ...Typography.h3, color: Colors.brunMoka },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.rougeAlerte, paddingHorizontal: Spacing.lg, paddingVertical: 10 },
  errorText:   { flex: 1, fontSize: 13, color: Colors.white, fontWeight: '600' },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },

  heroCard: {
    backgroundColor: Colors.lieDeVin,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  heroLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, marginBottom: 4 },
  heroValue: { fontSize: 38, fontWeight: '900', color: Colors.white, letterSpacing: -1 },
  heroSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 6 },

  statsRow:    { flexDirection: 'row', backgroundColor: Colors.champagne, borderRadius: Radius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.parchemin, overflow: 'hidden' },
  statCell:    { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  statDivider: { width: 1, backgroundColor: Colors.parchemin },
  statValue:   { fontSize: 17, fontWeight: '800', color: Colors.brunMoka },
  statLabel:   { fontSize: 10, color: Colors.brunClair, marginTop: 2 },

  warning: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.ambreChaudLight,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md,
    borderLeftWidth: 3, borderLeftColor: Colors.ambreChaud,
  },
  warningText: { flex: 1, fontSize: 12, color: Colors.ambreChaud, lineHeight: 18 },

  listTitle: { ...Typography.h4, color: Colors.brunMoka, marginBottom: Spacing.md },

  empty:     { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.md },
  emptyText: { fontSize: 14, color: Colors.brunClair },
});
