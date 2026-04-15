import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../src/constants';
import { useBottleStore, useUIStore } from '../../src/stores';
import { getWineColorHex, formatPrice } from '../../src/utils/bottle.utils';
import { router } from 'expo-router';

const WINE_LABELS: Record<string, string> = {
  rouge: 'Rouge', blanc: 'Blanc', rosé: 'Rosé',
  effervescent: 'Effervescent', moelleux: 'Moelleux', autre: 'Autre',
};

export default function StatsScreen() {
  const { stats, isStatsLoading, fetchStats } = useBottleStore();
  const { setFilter, clearFilters } = useUIStore();
  useEffect(() => { fetchStats(); }, []);

  const goToFiltered = (filter: 'favoritesOnly' | 'urgentOnly') => {
    clearFilters();
    setFilter(filter, true);
    router.push('/(tabs)/cave');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={isStatsLoading} onRefresh={fetchStats} tintColor={Colors.lieDeVin} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Statistiques</Text>
          <Text style={s.subtitle}>Vue d'ensemble de votre cave</Text>
        </View>

        {isStatsLoading && (
          <ActivityIndicator color={Colors.lieDeVin} style={{ marginTop: Spacing.xxxl }} />
        )}

        {!isStatsLoading && !stats && (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="stats-chart-outline" size={36} color={Colors.parchemin} />
            </View>
            <Text style={s.emptyTitle}>Aucune donnée</Text>
            <Text style={s.emptyText}>Ajoutez des bouteilles pour voir vos statistiques.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/(tabs)/add')}>
              <Text style={s.emptyBtnText}>Ajouter une bouteille</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isStatsLoading && stats && (
          <>
            {/* ── Chiffres clés ── */}
            <View style={s.kpiGrid}>
              <KpiCard
                icon="wine"
                value={stats.totalBottles.toLocaleString('fr-FR')}
                label="bouteilles"
                sub={`${stats.totalReferences} références`}
                color={Colors.lieDeVin}
                large
              />
              <KpiCard
                icon="pricetag-outline"
                value={formatPrice(stats.totalValue)}
                label="valeur estimée"
                color={Colors.ambreChaud}
              />
            </View>

            <View style={s.kpiRow}>
              <KpiCard icon="heart" value={stats.favorites} label="Favoris" color={Colors.rosePale}
                onPress={stats.favorites > 0 ? () => goToFiltered('favoritesOnly') : undefined} />
              <KpiCard icon="time-outline" value={stats.urgent} label="À boire" color={Colors.rougeAlerte}
                onPress={stats.urgent > 0 ? () => goToFiltered('urgentOnly') : undefined} />
              <KpiCard icon="checkmark-circle-outline" value={stats.consumed?.total ?? 0} label="Consommées" color={Colors.vertSauge} />
            </View>

            {/* ── Consommation ── */}
            <View style={s.section}>
              <SectionHeader icon="trending-down-outline" label="Consommation" color={Colors.vertSauge} />
              <View style={s.consumRow}>
                <ConsumeCell value={stats.consumed?.thisMonth ?? 0} label="Ce mois" />
                <View style={s.consumDivider} />
                <ConsumeCell value={stats.consumed?.thisYear  ?? 0} label="Cette année" />
                <View style={s.consumDivider} />
                <ConsumeCell value={stats.consumed?.total     ?? 0} label="Total" />
              </View>
            </View>

            {/* ── Par couleur ── */}
            {stats.byColor.length > 0 && (
              <View style={s.section}>
                <SectionHeader icon="color-palette-outline" label="Répartition par couleur" color={Colors.rosePale} />
                {stats.byColor.map(c => {
                  const pct = Math.round((c.count / Math.max(...stats.byColor.map(x => x.count), 1)) * 100);
                  return (
                    <BarRow
                      key={c.couleur}
                      dot={getWineColorHex(c.couleur)}
                      label={WINE_LABELS[c.couleur] ?? c.couleur}
                      pct={pct}
                      fill={getWineColorHex(c.couleur)}
                      count={c.count}
                    />
                  );
                })}
              </View>
            )}

            {/* ── Par cave ── */}
            {(stats.byCave ?? []).length > 0 && (
              <View style={s.section}>
                <SectionHeader icon="home-outline" label="Par cave" color={Colors.ambreChaud} />
                {(stats.byCave ?? []).map(c => {
                  const max = Math.max(...(stats.byCave ?? []).map(x => x.count), 1);
                  return (
                    <BarRow key={c.cave} dot={Colors.ambreChaud} label={c.cave} pct={Math.round((c.count / max) * 100)} fill={Colors.ambreChaud} count={c.count} />
                  );
                })}
              </View>
            )}

            {/* ── Top régions ── */}
            {stats.byRegion.length > 0 && (
              <View style={s.section}>
                <SectionHeader icon="map-outline" label="Top régions" color={Colors.lieDeVin} />
                {stats.byRegion.slice(0, 8).map(r => {
                  const max = Math.max(...stats.byRegion.map(x => x.count), 1);
                  return (
                    <BarRow key={r.region} dot={Colors.lieDeVin} label={r.region} pct={Math.round((r.count / max) * 100)} fill={Colors.lieDeVin} count={r.count} />
                  );
                })}
              </View>
            )}

            {/* ── Millésimes ── */}
            {stats.byYear.length > 0 && (
              <View style={s.section}>
                <SectionHeader icon="calendar-outline" label="Millésimes" color={Colors.blancDore} />
                {stats.byYear.slice(0, 10).map(y => {
                  const max = Math.max(...stats.byYear.map(x => x.count), 1);
                  return (
                    <BarRow key={y.annee} dot={Colors.blancDore} label={String(y.annee)} pct={Math.round((y.count / max) * 100)} fill={Colors.blancDore} count={y.count} />
                  );
                })}
              </View>
            )}
          </>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────────────

function KpiCard({ icon, value, label, sub, color, large, onPress }: {
  icon: any; value: string | number; label: string; sub?: string; color: string; large?: boolean; onPress?: () => void;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={[kpi.card, large && kpi.cardLarge, { borderColor: color + '25' }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[kpi.iconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={large ? 22 : 18} color={color} />
      </View>
      <Text style={[kpi.value, { color }, large && kpi.valueLarge]}>
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
      </Text>
      <Text style={kpi.label}>{label}</Text>
      {sub ? <Text style={kpi.sub}>{sub}</Text> : null}
    </Wrapper>
  );
}

const kpi = StyleSheet.create({
  card:      { flex: 1, backgroundColor: Colors.champagne, borderRadius: Radius.xl, padding: Spacing.md, alignItems: 'center', gap: 4, borderWidth: 1, ...Shadow.sm },
  cardLarge: { paddingVertical: Spacing.lg },
  iconBox:   { width: 40, height: 40, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  value:     { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  valueLarge:{ fontSize: 30 },
  label:     { ...Typography.caption, color: Colors.brunMoyen, textAlign: 'center' },
  sub:       { fontSize: 10, color: Colors.brunClair, textAlign: 'center' },
});

function SectionHeader({ icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <View style={sh.row}>
      <View style={[sh.accent, { backgroundColor: color }]} />
      <Text style={[sh.label, { color }]}>{label}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  accent: { width: 3, height: 14, borderRadius: 2 },
  label:  { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
});

function ConsumeCell({ value, label }: { value: number; label: string }) {
  return (
    <View style={cc.cell}>
      <Text style={cc.value}>{value.toLocaleString('fr-FR')}</Text>
      <Text style={cc.label}>{label}</Text>
    </View>
  );
}
const cc = StyleSheet.create({
  cell:  { flex: 1, alignItems: 'center', gap: 2 },
  value: { fontSize: 26, fontWeight: '800', color: Colors.lieDeVin, letterSpacing: -0.5 },
  label: { ...Typography.caption, color: Colors.brunMoyen },
});

function BarRow({ dot, label, pct, fill, count }: { dot: string; label: string; pct: number; fill: string; count: number }) {
  return (
    <View style={br.row}>
      <View style={[br.dot, { backgroundColor: dot }]} />
      <Text style={br.label} numberOfLines={1}>{label}</Text>
      <View style={br.track}>
        <View style={[br.fill, { width: (pct + '%') as any, backgroundColor: fill + 'CC' }]} />
      </View>
      <Text style={br.count}>{count}</Text>
    </View>
  );
}
const br = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: Spacing.sm },
  dot:   { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  label: { fontSize: 12, width: 110, color: Colors.brunMoyen, flexShrink: 0 },
  track: { flex: 1, height: 7, backgroundColor: Colors.parchemin, borderRadius: Radius.full, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: Radius.full },
  count: { fontSize: 12, width: 26, textAlign: 'right', color: Colors.brunMoka, fontWeight: '700' },
});

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.cremeIvoire },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  header:   { marginBottom: Spacing.xl },
  title:    { fontSize: 26, fontWeight: '800', color: Colors.brunMoka, letterSpacing: -0.5 },
  subtitle: { ...Typography.caption, color: Colors.brunMoyen, marginTop: 3 },

  empty:       { alignItems: 'center', paddingTop: Spacing.xxxl * 2, gap: Spacing.md },
  emptyIcon:   { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:  { fontSize: 18, fontWeight: '700', color: Colors.brunMoyen },
  emptyText:   { ...Typography.body, color: Colors.brunClair, textAlign: 'center', paddingHorizontal: Spacing.xl },
  emptyBtn:    { backgroundColor: Colors.lieDeVin, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.full, marginTop: Spacing.sm },
  emptyBtnText:{ ...Typography.bodySmall, fontWeight: '700', color: Colors.white },

  kpiGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  kpiRow:  { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },

  section: {
    backgroundColor: Colors.champagne,
    borderRadius: Radius.xl, padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.parchemin,
    ...Shadow.sm,
  },

  consumRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  consumDivider:{ width: 1, height: 40, backgroundColor: Colors.parchemin },
});
