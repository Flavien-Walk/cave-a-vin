import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../src/constants';
import { useBottleStore } from '../src/stores';
import { BottleCard } from '../src/components/bottle/BottleCard';
import { formatPrice } from '../src/utils/bottle.utils';

export default function CaveValueScreen() {
  const { bottles } = useBottleStore();

  const { sorted, totalValue, avgPrice, pricedCount, pricedPct } = useMemo(() => {
    const available  = bottles.filter(b => b.quantite > 0);
    const withPrice  = available.filter(b => b.prixAchat && b.prixAchat > 0);
    const sorted     = [...available].sort((a, b) => (b.prixAchat ?? 0) - (a.prixAchat ?? 0));
    const totalValue = withPrice.reduce((s, b) => s + (b.prixAchat ?? 0) * b.quantite, 0);
    const avgPrice   = withPrice.length ? withPrice.reduce((s, b) => s + (b.prixAchat ?? 0), 0) / withPrice.length : 0;
    const pricedPct  = available.length ? Math.round((withPrice.length / available.length) * 100) : 0;
    return { sorted, totalValue, avgPrice, pricedCount: withPrice.length, pricedPct };
  }, [bottles]);

  const lowDataWarning = pricedPct < 50 && sorted.length > 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brunMoka} />
        </TouchableOpacity>
        <Text style={s.title}>Valeur de ma cave</Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={sorted}
        keyExtractor={b => b._id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Card valeur principale */}
            <View style={s.heroCard}>
              <Text style={s.heroLabel}>VALEUR ESTIMÉE</Text>
              <Text style={s.heroValue}>{formatPrice(totalValue)}</Text>
              <Text style={s.heroSub}>
                {pricedCount} bouteille{pricedCount !== 1 ? 's' : ''} avec prix renseigné
              </Text>
            </View>

            {/* Stats row */}
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
                <Text style={s.statValue}>{sorted.length}</Text>
                <Text style={s.statLabel}>Références</Text>
              </View>
            </View>

            {/* Avertissement données manquantes */}
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
        }
        renderItem={({ item }) => (
          <BottleCard bottle={item} onPress={() => router.push(`/bottle/${item._id}` as any)} />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="wine-outline" size={40} color={Colors.parchemin} />
            <Text style={s.emptyText}>Aucune bouteille dans la cave</Text>
          </View>
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
