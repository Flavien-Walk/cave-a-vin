import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../src/constants';
import { useBottleStore } from '../../src/stores';
import { BottleCard } from '../../src/components/bottle/BottleCard';
import { formatPrice, isUrgent } from '../../src/utils/bottle.utils';
import ANECDOTES from '../../data/anecdotes';

const TODAY = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const ANECDOTE = ANECDOTES[Math.floor(Math.random() * ANECDOTES.length)];

export default function DashboardScreen() {
  const { bottles, stats, isLoading, isStatsLoading, fetchBottles, fetchStats } = useBottleStore();

  useEffect(() => { fetchBottles(); fetchStats(); }, []);

  const favorites  = useMemo(() => bottles.filter(b => b.isFavorite).slice(0, 3), [bottles]);
  const recent     = useMemo(() => [...bottles].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4), [bottles]);
  const urgentList = useMemo(() => bottles.filter(b => isUrgent(b) && b.quantite > 0), [bottles]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { fetchBottles(); fetchStats(); }} tintColor={Colors.lieDeVin} />}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête */}
        <View style={s.header}>
          <View>
            <Text style={s.appName}>Cave à Vin</Text>
            <Text style={s.date}>{TODAY.charAt(0).toUpperCase() + TODAY.slice(1)}</Text>
          </View>
          <TouchableOpacity style={s.avatarBtn} onPress={() => router.push('/(tabs)/stats')}>
            <Ionicons name="person-outline" size={18} color={Colors.brunMoyen} />
          </TouchableOpacity>
        </View>

        {/* Stats bar */}
        {!isStatsLoading && stats && (
          <View style={s.statsCard}>
            <StatCell value={stats.totalBottles.toLocaleString('fr-FR')} label="bouteilles" />
            <View style={s.sep} />
            <StatCell value={stats.totalReferences.toString()} label="références" />
            <View style={s.sep} />
            <StatCell value={formatPrice(stats.totalValue)} label="valeur" gold />
          </View>
        )}

        {/* Alerte urgence */}
        {urgentList.length > 0 && (
          <TouchableOpacity style={s.alert} onPress={() => router.push('/(tabs)/cave')} activeOpacity={0.8}>
            <View style={s.alertDot} />
            <Text style={s.alertText}>{urgentList.length} bouteille{urgentList.length > 1 ? 's' : ''} à consommer rapidement</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.rougeAlerte} />
          </TouchableOpacity>
        )}

        {/* Actions rapides */}
        <View style={s.actionsRow}>
          <QuickAction icon="wine-outline"    label="Ma cave"    onPress={() => router.push('/(tabs)/cave')} />
          <QuickAction icon="compass-outline" label="Découvrir"  onPress={() => router.push('/(tabs)/discover')} accent />
          <QuickAction icon="bar-chart-outline" label="Stats"    onPress={() => router.push('/(tabs)/stats')} />
        </View>

        {/* Cave vide */}
        {!isLoading && bottles.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🍾</Text>
            <Text style={s.emptyTitle}>Cave vide</Text>
            <Text style={s.emptyText}>Appuyez sur + pour ajouter votre première bouteille</Text>
          </View>
        )}

        {/* Favoris */}
        {favorites.length > 0 && (
          <Section title="Favoris" icon="heart-outline" onMore={() => router.push('/(tabs)/cave')}>
            {favorites.map(b => <BottleCard key={b._id} bottle={b} onPress={() => router.push(('/bottle/' + b._id) as any)} />)}
          </Section>
        )}

        {/* Récents */}
        {recent.length > 0 && (
          <Section title="Ajouts récents" icon="time-outline" onMore={() => router.push('/(tabs)/cave')}>
            {recent.map(b => <BottleCard key={b._id} bottle={b} onPress={() => router.push(('/bottle/' + b._id) as any)} />)}
          </Section>
        )}

        {/* Le saviez-vous */}
        <View style={s.anecdote}>
          <View style={s.anecdoteHead}>
            <Ionicons name="bulb-outline" size={14} color={Colors.ambreChaud} />
            <Text style={s.anecdoteLabel}>LE SAVIEZ-VOUS ?</Text>
          </View>
          <Text style={s.anecdoteText}>{ANECDOTE}</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const StatCell = ({ value, label, gold }: { value: string; label: string; gold?: boolean }) => (
  <View style={s.statCell}>
    <Text style={[s.statValue, gold && { color: Colors.ambreChaud }]}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const QuickAction = ({ icon, label, onPress, accent }: { icon: any; label: string; onPress: () => void; accent?: boolean }) => (
  <TouchableOpacity style={[s.qa, accent && s.qaAccent]} onPress={onPress} activeOpacity={0.8}>
    <Ionicons name={icon} size={20} color={accent ? Colors.white : Colors.brunMoyen} />
    <Text style={[s.qaLabel, accent && s.qaLabelAccent]}>{label}</Text>
  </TouchableOpacity>
);

const Section = ({ title, icon, onMore, children }: { title: string; icon: any; onMore?: () => void; children: React.ReactNode }) => (
  <View style={s.section}>
    <View style={s.sectionHead}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={14} color={Colors.lieDeVin} />
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {onMore && <TouchableOpacity onPress={onMore}><Text style={s.sectionMore}>Voir tout</Text></TouchableOpacity>}
    </View>
    {children}
  </View>
);

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.cremeIvoire },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  appName:   { fontSize: 26, fontWeight: '800', color: Colors.brunMoka, letterSpacing: -0.5 },
  date:      { fontSize: 13, color: Colors.brunMoyen, marginTop: 2 },
  avatarBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.lieDeVin,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  statCell:  { flex: 1, alignItems: 'center' },
  sep:       { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.white },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  alert: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.rougeAlerteLight,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg,
    borderLeftWidth: 3, borderLeftColor: Colors.rougeAlerte,
  },
  alertDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.rougeAlerte },
  alertText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.rougeAlerte },

  actionsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  qa: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.champagne,
    borderRadius: Radius.lg, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.parchemin,
  },
  qaAccent:      { backgroundColor: Colors.lieDeVin, borderColor: Colors.lieDeVin },
  qaLabel:       { fontSize: 11, fontWeight: '600', color: Colors.brunMoyen },
  qaLabelAccent: { color: Colors.white },

  empty:      { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.md },
  emptyIcon:  { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.brunMoyen },
  emptyText:  { fontSize: 13, color: Colors.brunClair, textAlign: 'center', lineHeight: 20 },

  section:      { marginBottom: Spacing.xl },
  sectionHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.brunMoka },
  sectionMore:  { fontSize: 12, color: Colors.lieDeVin, fontWeight: '600' },

  anecdote: {
    backgroundColor: Colors.champagne, borderRadius: Radius.lg, padding: Spacing.lg,
    marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.parchemin,
    borderLeftWidth: 3, borderLeftColor: Colors.ambreChaud,
  },
  anecdoteHead:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  anecdoteLabel: { fontSize: 10, fontWeight: '700', color: Colors.ambreChaud, letterSpacing: 1 },
  anecdoteText:  { fontSize: 13, color: Colors.brunMoyen, lineHeight: 20, fontStyle: 'italic' },
});
