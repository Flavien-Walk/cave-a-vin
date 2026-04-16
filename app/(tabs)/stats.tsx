import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../src/constants';
import { useBottleStore, useUIStore } from '../../src/stores';
import { getWineColorHex, formatPrice } from '../../src/utils/bottle.utils';
import { router } from 'expo-router';
import type { CaveStats, Bottle } from '../../src/types';

const WINE_LABELS: Record<string, string> = {
  rouge: 'Rouge', blanc: 'Blanc', rosé: 'Rosé',
  effervescent: 'Effervescent', moelleux: 'Moelleux', autre: 'Autre',
};

// ── Insights engine ────────────────────────────────────────────────────────────

interface Insight {
  icon: any;
  color: string;
  text: string;
  urgent?: boolean;
}

function computeInsights(stats: CaveStats, bottles: Bottle[]): Insight[] {
  const insights: Insight[] = [];

  // 1. Alerte urgence (priorité maximale)
  if (stats.urgent > 0) {
    insights.push({
      icon: 'warning-outline',
      color: Colors.rougeAlerte,
      text: `${stats.urgent} bouteille${stats.urgent > 1 ? 's à ouvrir' : ' à ouvrir'} de toute urgence`,
      urgent: true,
    });
  }

  // 2. Couleur dominante
  if (stats.byColor.length > 0 && stats.totalBottles > 0) {
    const sorted = [...stats.byColor].sort((a, b) => b.count - a.count);
    const top = sorted[0];
    const pct = Math.round((top.count / stats.totalBottles) * 100);
    const label = (WINE_LABELS[top.couleur] ?? top.couleur).toLowerCase();
    if (pct >= 55) {
      insights.push({ icon: 'wine', color: getWineColorHex(top.couleur), text: `Cave dominée par les ${label}s — ${pct}% de vos bouteilles` });
    } else if (stats.byColor.length >= 3) {
      insights.push({ icon: 'color-palette-outline', color: Colors.rosePale, text: `Cave diversifiée — ${stats.byColor.length} couleurs différentes` });
    }
  }

  // 3. Prix moyen d'achat
  const priced = bottles.filter(b => b.prixAchat && b.prixAchat > 0);
  if (priced.length >= 3) {
    const avg = priced.reduce((s, b) => s + (b.prixAchat ?? 0), 0) / priced.length;
    const max = Math.max(...priced.map(b => b.prixAchat ?? 0));
    insights.push({
      icon: 'pricetag-outline',
      color: Colors.ambreChaud,
      text: `Prix moyen d'achat : ${Math.round(avg)} € — bouteille la plus chère : ${Math.round(max)} €`,
    });
  }

  // 4. Concentration géographique
  if (stats.byRegion.length > 0 && stats.totalBottles > 0) {
    const top = [...stats.byRegion].sort((a, b) => b.count - a.count)[0];
    const pct = Math.round((top.count / stats.totalBottles) * 100);
    if (pct >= 45) {
      insights.push({ icon: 'map-outline', color: Colors.lieDeVin, text: `Cave essentiellement ${top.region} (${pct}% de vos bouteilles)` });
    } else if (stats.byRegion.length >= 5) {
      insights.push({ icon: 'map-outline', color: Colors.lieDeVin, text: `Belle diversité régionale — ${stats.byRegion.length} régions représentées` });
    }
  }

  // 5. Note personnelle moyenne
  const rated = bottles.filter(b => b.notePerso?.note != null);
  if (rated.length >= 3) {
    const avgNote = rated.reduce((s, b) => s + (b.notePerso!.note), 0) / rated.length;
    insights.push({
      icon: 'star-outline',
      color: Colors.ambreChaud,
      text: `Note moyenne : ${avgNote.toFixed(1)}/10 sur ${rated.length} vins dégustés`,
    });
  }

  // 6. Diversité des millésimes
  if (stats.byYear.length >= 6) {
    const years = stats.byYear.map(y => y.annee).filter(Boolean);
    const span = years.length > 1 ? Math.max(...years) - Math.min(...years) : 0;
    insights.push({
      icon: 'calendar-outline',
      color: Colors.brunMoyen,
      text: `${stats.byYear.length} millésimes différents — de ${Math.min(...years)} à ${Math.max(...years)} (${span} ans de cave)`,
    });
  }

  return insights.slice(0, 5);
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const { stats, bottles, isStatsLoading, fetchStats } = useBottleStore();
  const { setFilter, clearFilters } = useUIStore();
  useEffect(() => { fetchStats(); }, []);

  const insights = useMemo(
    () => (stats && bottles.length > 0 ? computeInsights(stats, bottles) : []),
    [stats, bottles]
  );

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
          <Text style={s.title}>Ma cave</Text>
          <Text style={s.subtitle}>Analyse personnalisée</Text>
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
            {/* ── Hero KPIs ── */}
            <View style={s.heroCard}>
              <TouchableOpacity style={s.heroCell} onPress={() => { clearFilters(); router.push('/(tabs)/cave'); }} activeOpacity={0.7}>
                <Text style={s.heroValue}>{stats.totalBottles.toLocaleString('fr-FR')}</Text>
                <Text style={s.heroLabel}>bouteilles</Text>
                <Text style={s.heroSub}>{stats.totalReferences} référence{stats.totalReferences > 1 ? 's' : ''}</Text>
              </TouchableOpacity>
              <View style={s.heroSep} />
              <TouchableOpacity
                style={s.heroCell}
                onPress={() => { clearFilters(); router.push({ pathname: '/(tabs)/cave', params: { initSort: 'prix' } } as any); }}
                activeOpacity={0.7}
              >
                <Text style={[s.heroValue, { color: Colors.ambreChaud }]}>{formatPrice(stats.totalValue)}</Text>
                <Text style={s.heroLabel}>valeur estimée</Text>
                <Text style={s.heroSub}>voir par prix ›</Text>
              </TouchableOpacity>
            </View>

            {/* ── Insights intelligents ── */}
            {insights.length > 0 && (
              <View style={s.insightsCard}>
                <View style={s.insightsHead}>
                  <Ionicons name="bulb-outline" size={14} color={Colors.ambreChaud} />
                  <Text style={s.insightsTitle}>ANALYSE DE VOTRE CAVE</Text>
                </View>
                {insights.map((insight, i) => (
                  <View key={i} style={[s.insightRow, insight.urgent && s.insightRowUrgent]}>
                    <View style={[s.insightDot, { backgroundColor: insight.color }]} />
                    <Text style={[s.insightText, insight.urgent && { color: Colors.rougeAlerte, fontWeight: '600' }]}>{insight.text}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* ── Profil rapide (Favoris · À boire · Consommées) ── */}
            <View style={s.quickRow}>
              <TouchableOpacity
                style={[s.quickCell, { borderColor: Colors.rosePale + '60' }]}
                onPress={stats.favorites > 0 ? () => goToFiltered('favoritesOnly') : undefined}
                activeOpacity={stats.favorites > 0 ? 0.7 : 1}
              >
                <Ionicons name="heart" size={18} color={Colors.rosePale} />
                <Text style={[s.quickValue, { color: Colors.rosePale }]}>{stats.favorites}</Text>
                <Text style={s.quickLabel}>Favoris</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.quickCell, { borderColor: Colors.rougeAlerte + '60' }]}
                onPress={stats.urgent > 0 ? () => goToFiltered('urgentOnly') : undefined}
                activeOpacity={stats.urgent > 0 ? 0.7 : 1}
              >
                <Ionicons name="time-outline" size={18} color={Colors.rougeAlerte} />
                <Text style={[s.quickValue, { color: Colors.rougeAlerte }]}>{stats.urgent}</Text>
                <Text style={s.quickLabel}>À boire</Text>
              </TouchableOpacity>
              <View style={[s.quickCell, { borderColor: Colors.vertSauge + '60' }]}>
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.vertSauge} />
                <Text style={[s.quickValue, { color: Colors.vertSauge }]}>{stats.consumed?.total ?? 0}</Text>
                <Text style={s.quickLabel}>Bues</Text>
              </View>
            </View>

            {/* ── Composition par couleur ── */}
            {stats.byColor.length > 0 && (
              <SectionCard icon="color-palette-outline" label="Composition" color={Colors.rosePale}>
                {[...stats.byColor]
                  .sort((a, b) => b.count - a.count)
                  .map(c => {
                    const pct = Math.round((c.count / stats.totalBottles) * 100);
                    const hex = getWineColorHex(c.couleur);
                    return (
                      <BarRow
                        key={c.couleur}
                        dot={hex}
                        label={WINE_LABELS[c.couleur] ?? c.couleur}
                        pct={pct}
                        fill={hex}
                        count={c.count}
                        suffix={`${pct}%`}
                      />
                    );
                  })}
              </SectionCard>
            )}

            {/* ── Consommation ── */}
            <SectionCard icon="trending-down-outline" label="Consommation" color={Colors.vertSauge}>
              <View style={s.consumRow}>
                <ConsumeCell value={stats.consumed?.thisMonth ?? 0} label="Ce mois" />
                <View style={s.consumDivider} />
                <ConsumeCell value={stats.consumed?.thisYear ?? 0} label="Cette année" />
                <View style={s.consumDivider} />
                <ConsumeCell value={stats.consumed?.total ?? 0} label="Total" />
              </View>
            </SectionCard>

            {/* ── Par cave ── */}
            {(stats.byCave ?? []).length > 0 && (
              <SectionCard icon="home-outline" label="Par cave" color={Colors.ambreChaud}>
                {[...(stats.byCave ?? [])]
                  .sort((a, b) => b.count - a.count)
                  .map(c => {
                    const max = Math.max(...(stats.byCave ?? []).map(x => x.count), 1);
                    return (
                      <BarRow key={c.cave} dot={Colors.ambreChaud} label={c.cave} pct={Math.round((c.count / max) * 100)} fill={Colors.ambreChaud} count={c.count} />
                    );
                  })}
              </SectionCard>
            )}

            {/* ── Top régions ── */}
            {stats.byRegion.length > 0 && (
              <SectionCard icon="map-outline" label="Top régions" color={Colors.lieDeVin}>
                {[...stats.byRegion]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 8)
                  .map(r => {
                    const max = Math.max(...stats.byRegion.map(x => x.count), 1);
                    return (
                      <BarRow key={r.region} dot={Colors.lieDeVin} label={r.region} pct={Math.round((r.count / max) * 100)} fill={Colors.lieDeVin} count={r.count} />
                    );
                  })}
              </SectionCard>
            )}

            {/* ── Millésimes ── */}
            {stats.byYear.length > 0 && (
              <SectionCard icon="calendar-outline" label="Millésimes" color={Colors.blancDore}>
                {[...stats.byYear]
                  .sort((a, b) => b.annee - a.annee)
                  .slice(0, 12)
                  .map(y => {
                    const max = Math.max(...stats.byYear.map(x => x.count), 1);
                    return (
                      <BarRow key={y.annee} dot={Colors.blancDore} label={String(y.annee)} pct={Math.round((y.count / max) * 100)} fill={Colors.blancDore} count={y.count} />
                    );
                  })}
              </SectionCard>
            )}
          </>
        )}

        <View style={{ height: Spacing.xxxl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────────────

function SectionCard({ icon, label, color, children }: { icon: any; label: string; color: string; children: React.ReactNode }) {
  return (
    <View style={[sc.card, { borderLeftColor: color }]}>
      <View style={sc.head}>
        <View style={[sc.iconBox, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={14} color={color} />
        </View>
        <Text style={[sc.label, { color }]}>{label}</Text>
      </View>
      {children}
    </View>
  );
}
const sc = StyleSheet.create({
  card:    { backgroundColor: Colors.champagne, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.parchemin, borderLeftWidth: 3, ...Shadow.sm },
  head:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  iconBox: { width: 26, height: 26, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 13, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
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

function BarRow({ dot, label, pct, fill, count, suffix }: { dot: string; label: string; pct: number; fill: string; count: number; suffix?: string }) {
  return (
    <View style={br.row}>
      <View style={[br.dot, { backgroundColor: dot }]} />
      <Text style={br.label} numberOfLines={1}>{label}</Text>
      <View style={br.track}>
        <View style={[br.fill, { width: (Math.max(pct, 4) + '%') as any, backgroundColor: fill + 'CC' }]} />
      </View>
      <Text style={br.count}>{suffix ?? count}</Text>
    </View>
  );
}
const br = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: Spacing.sm },
  dot:   { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  label: { fontSize: 12, width: 100, color: Colors.brunMoyen, flexShrink: 0 },
  track: { flex: 1, height: 8, backgroundColor: Colors.parchemin, borderRadius: Radius.full, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: Radius.full },
  count: { fontSize: 12, width: 36, textAlign: 'right', color: Colors.brunMoka, fontWeight: '700' },
});

// ── Main styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.cremeIvoire },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  header:   { marginBottom: Spacing.lg },
  title:    { fontSize: 26, fontWeight: '800', color: Colors.brunMoka, letterSpacing: -0.5 },
  subtitle: { ...Typography.caption, color: Colors.brunMoyen, marginTop: 3 },

  empty:        { alignItems: 'center', paddingTop: Spacing.xxxl * 2, gap: Spacing.md },
  emptyIcon:    { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: Colors.brunMoyen },
  emptyText:    { ...Typography.body, color: Colors.brunClair, textAlign: 'center', paddingHorizontal: Spacing.xl },
  emptyBtn:     { backgroundColor: Colors.lieDeVin, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.full, marginTop: Spacing.sm },
  emptyBtnText: { ...Typography.bodySmall, fontWeight: '700', color: Colors.white },

  // Hero
  heroCard: {
    flexDirection: 'row',
    backgroundColor: Colors.lieDeVin,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  heroCell:  { flex: 1, alignItems: 'center', gap: 3 },
  heroSep:   { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  heroValue: { fontSize: 28, fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.3 },
  heroSub:   { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 1 },

  // Insights
  insightsCard: {
    backgroundColor: Colors.champagne,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.parchemin,
    borderLeftWidth: 3,
    borderLeftColor: Colors.ambreChaud,
    ...Shadow.sm,
  },
  insightsHead:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  insightsTitle: { fontSize: 10, fontWeight: '800', color: Colors.ambreChaud, letterSpacing: 1.2 },
  insightRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  insightRowUrgent: { backgroundColor: Colors.rougeAlerteLight, marginHorizontal: -Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.md },
  insightDot:    { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  insightText:   { flex: 1, fontSize: 13, color: Colors.brunMoyen, lineHeight: 19 },

  // Quick row
  quickRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  quickCell: {
    flex: 1, alignItems: 'center', gap: 4,
    backgroundColor: Colors.champagne,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    ...Shadow.sm,
  },
  quickValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  quickLabel: { fontSize: 10, color: Colors.brunClair },

  // Consumption
  consumRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  consumDivider:{ width: 1, height: 40, backgroundColor: Colors.parchemin },
});
