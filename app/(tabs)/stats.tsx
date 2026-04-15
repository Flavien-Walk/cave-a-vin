import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../src/constants';
import { useBottleStore } from '../../src/stores';
import { getWineColorHex, formatPrice } from '../../src/utils/bottle.utils';
import { router } from 'expo-router';

const WINE_COLOR_LABELS: Record<string, string> = {
  rouge: 'Rouge', blanc: 'Blanc', rosé: 'Rosé',
  effervescent: 'Effervescent', moelleux: 'Moelleux', autre: 'Autre',
};

export default function StatsScreen() {
  const { stats, isStatsLoading, fetchStats } = useBottleStore();
  useEffect(() => { fetchStats(); }, []);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={isStatsLoading} onRefresh={fetchStats} tintColor={Colors.lieDeVin} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Text style={s.title}>Statistiques</Text>
          <Text style={s.subtitle}>Vue d'ensemble de votre cave</Text>
        </View>

        {isStatsLoading && <ActivityIndicator color={Colors.lieDeVin} style={{ marginVertical: Spacing.xxxl }} />}

        {!isStatsLoading && !stats && (
          <View style={s.empty}>
            <Ionicons name="stats-chart-outline" size={52} color={Colors.parchemin} />
            <Text style={s.emptyTitle}>Aucune donnée</Text>
            <Text style={s.emptyText}>Ajoutez des bouteilles pour voir vos statistiques.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/(tabs)/add')}>
              <Text style={s.emptyBtnText}>Ajouter une bouteille</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isStatsLoading && stats && (
          <>
            {/* ── Hero ── */}
            <View style={s.heroCard}>
              <View style={s.heroLeft}>
                <Text style={s.heroNumber}>{stats.totalBottles.toLocaleString('fr-FR')}</Text>
                <Text style={s.heroLabel}>bouteilles en cave</Text>
              </View>
              <View style={s.heroRight}>
                <View style={s.heroDivider} />
                <View style={s.heroItem}>
                  <Text style={s.heroItemNum}>{stats.totalReferences}</Text>
                  <Text style={s.heroItemLabel}>références</Text>
                </View>
                <View style={s.heroDivider} />
                <View style={s.heroItem}>
                  <Text style={[s.heroItemNum, { color: Colors.ambreChaud }]}>{formatPrice(stats.totalValue)}</Text>
                  <Text style={s.heroItemLabel}>valeur estimée</Text>
                </View>
              </View>
            </View>

            {/* ── Indicateurs ── */}
            <View style={s.kpiRow}>
              <KpiTile icon="heart" value={stats.favorites} label="Favoris" color={Colors.rosePale} />
              <KpiTile icon="time" value={stats.urgent} label="À boire !" color={Colors.rougeAlerte} />
              <KpiTile icon="checkmark-circle" value={stats.consumed?.total ?? 0} label="Consommées" color={Colors.vertSauge} />
            </View>

            {/* ── Consommation ── */}
            <View style={s.section}>
              <SectionTitle icon="trending-down-outline" label="Consommation" color={Colors.vertSauge} />
              <View style={s.consumRow}>
                <ConsumeBox value={stats.consumed?.thisMonth ?? 0} label="Ce mois" />
                <ConsumeBox value={stats.consumed?.thisYear  ?? 0} label="Cette année" />
                <ConsumeBox value={stats.consumed?.total     ?? 0} label="Total" />
              </View>
            </View>

            {/* ── Par couleur ── */}
            {stats.byColor.length > 0 && (
              <View style={s.section}>
                <SectionTitle icon="color-palette-outline" label="Par couleur" color={Colors.rosePale} />
                {stats.byColor.map(c => {
                  const pct = Math.round((c.count / Math.max(...stats.byColor.map(x => x.count), 1)) * 100);
                  return (
                    <View key={c.couleur} style={s.barRow}>
                      <View style={[s.barDot, { backgroundColor: getWineColorHex(c.couleur) }]} />
                      <Text style={s.barLabel}>{WINE_COLOR_LABELS[c.couleur] ?? c.couleur}</Text>
                      <View style={s.barTrack}>
                        <View style={[s.barFill, { width: (pct + '%') as any, backgroundColor: getWineColorHex(c.couleur) }]} />
                      </View>
                      <Text style={s.barCount}>{c.count}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── Par cave ── */}
            {(stats.byCave ?? []).length > 0 && (
              <View style={s.section}>
                <SectionTitle icon="home-outline" label="Par cave" color={Colors.ambreChaud} />
                {(stats.byCave ?? []).map(c => {
                  const pct = Math.round((c.count / Math.max(...(stats.byCave ?? []).map(x => x.count), 1)) * 100);
                  return (
                    <View key={c.cave} style={s.barRow}>
                      <View style={[s.barDot, { backgroundColor: Colors.ambreChaud }]} />
                      <Text style={s.barLabel}>{c.cave}</Text>
                      <View style={s.barTrack}>
                        <View style={[s.barFill, { width: (pct + '%') as any, backgroundColor: Colors.ambreChaud }]} />
                      </View>
                      <Text style={s.barCount}>{c.count}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── Top régions ── */}
            {stats.byRegion.length > 0 && (
              <View style={s.section}>
                <SectionTitle icon="map-outline" label="Top régions" color={Colors.lieDeVin} />
                {stats.byRegion.slice(0, 8).map(r => {
                  const pct = Math.round((r.count / Math.max(...stats.byRegion.map(x => x.count), 1)) * 100);
                  return (
                    <View key={r.region} style={s.barRow}>
                      <View style={[s.barDot, { backgroundColor: Colors.lieDeVin }]} />
                      <Text style={s.barLabel}>{r.region}</Text>
                      <View style={s.barTrack}>
                        <View style={[s.barFill, { width: (pct + '%') as any, backgroundColor: Colors.lieDeVin }]} />
                      </View>
                      <Text style={s.barCount}>{r.count}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── Millésimes ── */}
            {stats.byYear.length > 0 && (
              <View style={s.section}>
                <SectionTitle icon="calendar-outline" label="Millésimes" color={Colors.blancDore} />
                {stats.byYear.slice(0, 10).map(y => {
                  const pct = Math.round((y.count / Math.max(...stats.byYear.map(x => x.count), 1)) * 100);
                  return (
                    <View key={y.annee} style={s.barRow}>
                      <View style={[s.barDot, { backgroundColor: Colors.blancDore }]} />
                      <Text style={s.barLabel}>{y.annee}</Text>
                      <View style={s.barTrack}>
                        <View style={[s.barFill, { width: (pct + '%') as any, backgroundColor: Colors.blancDore }]} />
                      </View>
                      <Text style={s.barCount}>{y.count}</Text>
                    </View>
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

const KpiTile = ({ icon, value, label, color }: { icon: any; value: number; label: string; color: string }) => (
  <View style={[s.kpiTile, { borderColor: color + '40' }]}>
    <View style={[s.kpiIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={[s.kpiNum, { color }]}>{value.toLocaleString('fr-FR')}</Text>
    <Text style={s.kpiLabel}>{label}</Text>
  </View>
);

const SectionTitle = ({ icon, label, color }: { icon: any; label: string; color: string }) => (
  <View style={s.sectionTitleRow}>
    <View style={[s.sectionAccent, { backgroundColor: color }]} />
    <Text style={[s.sectionTitleText, { color }]}>{label}</Text>
  </View>
);

const ConsumeBox = ({ value, label }: { value: number; label: string }) => (
  <View style={s.consumeBox}>
    <Text style={s.consumeNum}>{value}</Text>
    <Text style={s.consumeLabel}>{label}</Text>
  </View>
);

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.cremeIvoire },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  header:   { marginBottom: Spacing.xl },
  title:    { ...Typography.h2 },
  subtitle: { ...Typography.caption, color: Colors.brunMoyen, marginTop: 3 },

  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: Spacing.xxxl * 2, gap: Spacing.md },
  emptyTitle:  { ...Typography.h3, color: Colors.brunMoyen },
  emptyText:   { ...Typography.body, color: Colors.brunClair, textAlign: 'center', paddingHorizontal: Spacing.xl },
  emptyBtn:    { marginTop: Spacing.sm, backgroundColor: Colors.lieDeVin, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.full },
  emptyBtnText:{ ...Typography.bodySmall, fontWeight: '700', color: Colors.white },

  heroCard: {
    flexDirection: 'row',
    backgroundColor: Colors.lieDeVin,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.md,
    alignItems: 'center',
  },
  heroLeft:      { flex: 1 },
  heroNumber:    { fontSize: 42, fontWeight: '800', color: Colors.white, letterSpacing: -1 },
  heroLabel:     { ...Typography.caption, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  heroRight:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  heroDivider:   { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroItem:      { alignItems: 'center', gap: 2 },
  heroItemNum:   { fontSize: 15, fontWeight: '700', color: Colors.white },
  heroItemLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },

  kpiRow:  { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  kpiTile: {
    flex: 1, backgroundColor: Colors.champagne,
    borderRadius: Radius.lg, padding: Spacing.md,
    alignItems: 'center', gap: 6,
    borderWidth: 1, ...Shadow.sm,
  },
  kpiIcon:  { width: 38, height: 38, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  kpiNum:   { fontSize: 20, fontWeight: '800' },
  kpiLabel: { ...Typography.caption, color: Colors.brunMoyen, textAlign: 'center' },

  section: {
    backgroundColor: Colors.champagne,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.parchemin,
    ...Shadow.sm,
  },
  sectionTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  sectionAccent:    { width: 4, height: 16, borderRadius: 2 },
  sectionTitleText: { ...Typography.h4, letterSpacing: 0.5 },

  consumRow:   { flexDirection: 'row', justifyContent: 'space-around' },
  consumeBox:  { alignItems: 'center', gap: 2 },
  consumeNum:  { fontSize: 28, fontWeight: '800', color: Colors.lieDeVin },
  consumeLabel:{ ...Typography.caption, color: Colors.brunMoyen },

  barRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: Spacing.sm },
  barDot:   { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  barLabel: { ...Typography.bodySmall, width: 100, color: Colors.brunMoyen, flexShrink: 0 },
  barTrack: { flex: 1, height: 6, backgroundColor: Colors.parchemin, borderRadius: Radius.full, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: Radius.full },
  barCount: { ...Typography.caption, width: 24, textAlign: 'right', color: Colors.brunMoka, fontWeight: '700' },
});
