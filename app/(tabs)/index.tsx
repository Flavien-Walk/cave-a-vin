import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../src/constants';
import { useBottleStore, useAuthStore, useCavesStore } from '../../src/stores';
import { BottleCard } from '../../src/components/bottle/BottleCard';
import { formatPrice, isUrgent } from '../../src/utils/bottle.utils';
import { getRecommendations } from '../../src/utils/recommendation';
import ANECDOTES from '../../data/anecdotes';

const TODAY  = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const ANECDOTE = ANECDOTES[Math.floor(Math.random() * ANECDOTES.length)];

export default function DashboardScreen() {
  const { bottles, stats, isLoading, isStatsLoading, fetchBottles, fetchStats } = useBottleStore();
  const { user } = useAuthStore();
  const { caves, activeCave, fetchCaves, setActiveCave } = useCavesStore();

  useEffect(() => { fetchBottles(); fetchStats(); fetchCaves(); }, []);

  const favorites   = useMemo(() => bottles.filter(b => b.isFavorite).slice(0, 3), [bottles]);
  const recent      = useMemo(() => [...bottles].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3), [bottles]);
  const urgentList  = useMemo(() => bottles.filter(b => isUrgent(b) && b.quantite > 0), [bottles]);
  const lowStock    = useMemo(() => bottles.filter(b => b.quantite === 1 && !isUrgent(b)), [bottles]);

  // Suggestion "Ce soir" — top 1 accord avec viande rouge (plat polyvalent)
  const suggestion  = useMemo(() => {
    const result = getRecommendations(bottles, 'boeuf');
    return result.wines.length > 0 ? result.wines[0] : null;
  }, [bottles]);

  const firstName = user?.name?.split(' ')[0] ?? 'vous';

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
            <Text style={s.date}>{TODAY.charAt(0).toUpperCase() + TODAY.slice(1)}</Text>
            <Text style={s.appName}>Bonjour, {firstName}</Text>
          </View>
          <TouchableOpacity style={s.avatarBtn} onPress={() => router.push('/profile' as any)}>
            <Text style={s.avatarInitial}>{(user?.name?.[0] ?? '?').toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats compactes */}
        {!isStatsLoading && stats && (
          <View style={s.statsCard}>
            <StatCell value={stats.totalBottles.toLocaleString('fr-FR')} label="bouteilles" onPress={() => router.push('/(tabs)/cave')} />
            <View style={s.sep} />
            <StatCell value={stats.totalReferences.toString()} label="références" />
            <View style={s.sep} />
            <StatCell value={formatPrice(stats.totalValue)} label="valeur" gold onPress={() => router.push('/(tabs)/stats' as any)} />
          </View>
        )}

        {/* Sélecteur de cave */}
        {caves.length > 0 && (
          <View style={s.caveRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingRight: Spacing.sm }}>
                {caves.map(c => (
                  <TouchableOpacity
                    key={c._id}
                    style={[s.cavePill, activeCave?._id === c._id && s.cavePillActive]}
                    onPress={() => setActiveCave(c)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="home" size={12} color={activeCave?._id === c._id ? Colors.white : Colors.lieDeVin} />
                    <Text style={[s.cavePillText, activeCave?._id === c._id && s.cavePillTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={s.caveManageBtn} onPress={() => router.push('/manage-caves' as any)}>
              <Ionicons name="settings-outline" size={16} color={Colors.brunMoyen} />
            </TouchableOpacity>
          </View>
        )}

        {/* Alertes urgence */}
        {urgentList.length > 0 && (
          <TouchableOpacity style={s.alert} onPress={() => router.push('/(tabs)/discover')} activeOpacity={0.8}>
            <View style={s.alertDot} />
            <Text style={s.alertText}>{urgentList.length} bouteille{urgentList.length > 1 ? 's' : ''} à consommer rapidement</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.rougeAlerte} />
          </TouchableOpacity>
        )}

        {/* Stock faible */}
        {lowStock.length > 0 && (
          <View style={s.alertInfo}>
            <Ionicons name="alert-circle-outline" size={14} color={Colors.ambreChaud} />
            <Text style={s.alertInfoText}>{lowStock.length} bouteille{lowStock.length > 1 ? 's' : ''} en dernière unité</Text>
          </View>
        )}

        {/* Suggestion "Ce soir" */}
        {suggestion && (
          <TouchableOpacity
            style={s.suggestionCard}
            onPress={() => router.push(('/bottle/' + suggestion.bottle._id) as any)}
            activeOpacity={0.85}
          >
            <View style={s.suggestionLeft}>
              <View style={s.suggestionBadge}>
                <Text style={s.suggestionBadgeText}>CE SOIR</Text>
              </View>
              <Text style={s.suggestionName} numberOfLines={1}>{suggestion.bottle.nom}</Text>
              {suggestion.bottle.annee && (
                <Text style={s.suggestionSub}>{suggestion.bottle.annee} · {suggestion.bottle.cave}</Text>
              )}
            </View>
            {(() => {
              const userNote = suggestion.bottle.notePerso?.note ?? suggestion.bottle.averageNote ?? null;
              return userNote ? (
                <View style={s.suggestionRight}>
                  <Ionicons name="star" size={18} color={Colors.ambreChaud} />
                  <Text style={s.suggestionScore}>{userNote % 1 === 0 ? userNote : userNote.toFixed(1)}</Text>
                </View>
              ) : null;
            })()}
          </TouchableOpacity>
        )}

        {/* Cave vide */}
        {!isLoading && bottles.length === 0 && (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="wine-outline" size={40} color={Colors.parchemin} />
            </View>
            <Text style={s.emptyTitle}>Cave vide</Text>
            <Text style={s.emptyText}>Appuyez sur + pour ajouter votre première bouteille</Text>
          </View>
        )}

        {/* Favoris */}
        {favorites.length > 0 && (
          <Section title="Favoris" icon="heart-outline" onMore={() => router.push('/(tabs)/cave')}>
            {favorites.map(b => (
              <BottleCard key={b._id} bottle={b} onPress={() => router.push(('/bottle/' + b._id) as any)} />
            ))}
          </Section>
        )}

        {/* Ajouts récents */}
        {recent.length > 0 && (
          <Section title="Ajouts récents" icon="time-outline" onMore={() => router.push('/(tabs)/cave')}>
            {recent.map(b => (
              <BottleCard key={b._id} bottle={b} onPress={() => router.push(('/bottle/' + b._id) as any)} />
            ))}
          </Section>
        )}

        {/* Anecdote */}
        <View style={s.anecdote}>
          <View style={s.anecdoteHead}>
            <Ionicons name="bulb-outline" size={13} color={Colors.ambreChaud} />
            <Text style={s.anecdoteLabel}>LE SAVIEZ-VOUS ?</Text>
          </View>
          <Text style={s.anecdoteText}>{ANECDOTE}</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

const StatCell = ({ value, label, gold, onPress }: { value: string; label: string; gold?: boolean; onPress?: () => void }) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
  <Wrapper style={s.statCell} onPress={onPress} activeOpacity={0.7}>
    <Text style={[s.statValue, gold && { color: Colors.ambreChaud }]}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </Wrapper>
  );
};

const Section = ({ title, icon, onMore, children }: { title: string; icon: any; onMore?: () => void; children: React.ReactNode }) => (
  <View style={s.section}>
    <View style={s.sectionHead}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={13} color={Colors.lieDeVin} />
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {onMore && (
        <TouchableOpacity onPress={onMore}>
          <Text style={s.sectionMore}>Voir tout</Text>
        </TouchableOpacity>
      )}
    </View>
    {children}
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.cremeIvoire },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  date:          { fontSize: 12, color: Colors.brunClair, textTransform: 'capitalize', letterSpacing: 0.3 },
  appName:       { fontSize: 22, fontWeight: '800', color: Colors.brunMoka, letterSpacing: -0.3, marginTop: 2 },
  avatarBtn:     {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.lieDeVin,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 16, fontWeight: '700', color: Colors.white },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.lieDeVin,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  statCell:  { flex: 1, alignItems: 'center' },
  sep:       { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.white },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  caveRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
  cavePill:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin },
  cavePillActive:   { backgroundColor: Colors.lieDeVin, borderColor: Colors.lieDeVin },
  cavePillText:     { fontSize: 13, fontWeight: '600', color: Colors.lieDeVin },
  cavePillTextActive:{ color: Colors.white },
  caveManageBtn:    { padding: 6, borderRadius: Radius.full, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin },

  alert: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.rougeAlerteLight,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.rougeAlerte,
  },
  alertDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.rougeAlerte },
  alertText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.rougeAlerte },

  alertInfo: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.ambreChaudLight,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md,
    borderLeftWidth: 3, borderLeftColor: Colors.ambreChaud,
  },
  alertInfoText: { flex: 1, fontSize: 13, fontWeight: '500', color: Colors.ambreChaud },

  suggestionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.champagne,
    borderRadius: Radius.xl, padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.parchemin,
    ...Shadow.sm,
  },
  suggestionLeft:       { flex: 1, gap: 4 },
  suggestionBadge:      { alignSelf: 'flex-start', backgroundColor: Colors.lieDeVin, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  suggestionBadgeText:  { fontSize: 9, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
  suggestionName:       { fontSize: 16, fontWeight: '700', color: Colors.brunMoka },
  suggestionSub:        { fontSize: 12, color: Colors.brunMoyen },
  suggestionRight:      { alignItems: 'center', paddingLeft: Spacing.md, gap: 2 },
  suggestionScore:      { fontSize: 22, fontWeight: '800', color: Colors.ambreChaud },

  empty:      { alignItems: 'center', paddingVertical: Spacing.xxxl * 2, gap: Spacing.md },
  emptyIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.brunMoyen },
  emptyText:  { fontSize: 13, color: Colors.brunClair, textAlign: 'center', lineHeight: 20 },

  section:      { marginBottom: Spacing.xl },
  sectionHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.brunMoka, letterSpacing: 0.2 },
  sectionMore:  { fontSize: 12, color: Colors.lieDeVin, fontWeight: '600' },

  anecdote: {
    backgroundColor: Colors.champagne, borderRadius: Radius.lg, padding: Spacing.lg,
    marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.parchemin,
    borderLeftWidth: 3, borderLeftColor: Colors.ambreChaud,
  },
  anecdoteHead:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: Spacing.sm },
  anecdoteLabel: { fontSize: 10, fontWeight: '700', color: Colors.ambreChaud, letterSpacing: 1 },
  anecdoteText:  { fontSize: 13, color: Colors.brunMoyen, lineHeight: 20, fontStyle: 'italic' },
});
