import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../src/constants';
import { useBottleStore, useAuthStore, useCavesStore } from '../../src/stores';
import { BottleCard } from '../../src/components/bottle/BottleCard';
import { formatPrice, isUrgent } from '../../src/utils/bottle.utils';
import ANECDOTES from '../../data/anecdotes';

const TODAY    = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const ANECDOTE = ANECDOTES[Math.floor(Math.random() * ANECDOTES.length)];

type LieuEntry = { lieu: string; nbCaves: number; nbBottles: number };

export default function DashboardScreen() {
  const { bottles, stats, isLoading, isStatsLoading, fetchBottles, fetchStats } = useBottleStore();
  const { user } = useAuthStore();
  const { caves, fetchCaves, setActiveLieu } = useCavesStore();

  useEffect(() => { fetchBottles(); fetchStats(); fetchCaves(); }, []);

  // Lieux réels de l'utilisateur (dérivés des caves)
  const lieuEntries = useMemo<LieuEntry[]>(() => {
    const lieus = [...new Set(caves.map(c => c.location).filter(Boolean))] as string[];
    return lieus.map(lieu => {
      const cavesInLieu = caves.filter(c => c.location === lieu);
      const caveNames   = cavesInLieu.map(c => c.name);
      const nbBottles   = bottles.filter(b => caveNames.includes(b.cave ?? '')).length;
      return { lieu, nbCaves: cavesInLieu.length, nbBottles };
    });
  }, [caves, bottles]);

  const favorites  = useMemo(() => bottles.filter(b => b.isFavorite).slice(0, 3), [bottles]);
  const recent     = useMemo(() => [...bottles].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3), [bottles]);
  const urgentList = useMemo(() => bottles.filter(b => isUrgent(b) && b.quantite > 0), [bottles]);
  const lowStock   = useMemo(() => bottles.filter(b => b.quantite === 1 && !isUrgent(b)), [bottles]);

  const firstName = user?.name?.split(' ')[0] ?? 'vous';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { fetchBottles(); fetchStats(); }} tintColor={Colors.lieDeVin} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── En-tête ── */}
        <View style={s.header}>
          <View>
            <Text style={s.date}>{TODAY.charAt(0).toUpperCase() + TODAY.slice(1)}</Text>
            <Text style={s.appName}>Bonjour, {firstName}</Text>
          </View>
          <TouchableOpacity style={s.avatarBtn} onPress={() => router.push('/profile' as any)}>
            <Text style={s.avatarInitial}>{(user?.name?.[0] ?? '?').toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Onboarding : aucune cave ── */}
        {!isLoading && caves.length === 0 && (
          <TouchableOpacity style={s.onboardingCard} onPress={() => router.push('/manage-caves' as any)} activeOpacity={0.85}>
            <View style={s.onboardingIcon}>
              <Ionicons name="home-outline" size={28} color={Colors.lieDeVin} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.onboardingTitle}>Créez votre première cave</Text>
              <Text style={s.onboardingText}>Organisez vos bouteilles par lieu et par cave.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.lieDeVin} />
          </TouchableOpacity>
        )}

        {/* ── Mes lieux ── */}
        {caves.length > 0 && (
          <View style={s.lieuSection}>
            <View style={s.lieuSectionHead}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="location-outline" size={13} color={Colors.lieDeVin} />
                <Text style={s.lieuSectionTitle}>Mes lieux</Text>
              </View>
              <TouchableOpacity style={s.manageBtn} onPress={() => router.push('/manage-caves' as any)} activeOpacity={0.75}>
                <Ionicons name="home-outline" size={13} color={Colors.lieDeVin} />
                <Text style={s.manageBtnText}>Mes caves</Text>
              </TouchableOpacity>
            </View>

            {lieuEntries.length > 0 ? (
              lieuEntries.map(({ lieu, nbCaves, nbBottles }) => (
                <TouchableOpacity
                  key={lieu}
                  style={s.lieuCard}
                  onPress={() => {
                    setActiveLieu(lieu);
                    router.push('/(tabs)/cave');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={s.lieuCardIcon}>
                    <Ionicons name="location" size={22} color={Colors.lieDeVin} />
                  </View>
                  <View style={s.lieuCardBody}>
                    <Text style={s.lieuCardName}>{lieu}</Text>
                    <Text style={s.lieuCardSub}>
                      {nbCaves} cave{nbCaves > 1 ? 's' : ''} · {nbBottles} bouteille{nbBottles > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.brunClair} />
                </TouchableOpacity>
              ))
            ) : (
              /* Caves créées mais sans lieu défini */
              <TouchableOpacity
                style={s.lieuEmpty}
                onPress={() => router.push('/manage-caves' as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.brunClair} />
                <Text style={s.lieuEmptyText}>
                  Vos caves n'ont pas encore de lieu — ajoutez-en depuis Mes caves
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Stats compactes ── */}
        {!isStatsLoading && stats && (
          <View style={s.statsCard}>
            <StatCell value={stats.totalBottles.toLocaleString('fr-FR')} label="bouteilles" onPress={() => router.push('/(tabs)/cave')} />
            <View style={s.sep} />
            <StatCell value={stats.totalReferences.toString()} label="références" onPress={() => router.push('/(tabs)/cave')} />
            <View style={s.sep} />
            <StatCell value={formatPrice(stats.totalValue)} label="valeur" gold onPress={() => router.push('/cave-value' as any)} />
          </View>
        )}

        {/* ── Alertes urgence ── */}
        {urgentList.length > 0 && (
          <TouchableOpacity style={s.alert} onPress={() => router.push('/(tabs)/discover')} activeOpacity={0.8}>
            <View style={s.alertDot} />
            <Text style={s.alertText}>{urgentList.length} bouteille{urgentList.length > 1 ? 's' : ''} à consommer rapidement</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.rougeAlerte} />
          </TouchableOpacity>
        )}

        {/* ── Stock faible ── */}
        {lowStock.length > 0 && (
          <View style={s.alertInfo}>
            <Ionicons name="alert-circle-outline" size={14} color={Colors.ambreChaud} />
            <Text style={s.alertInfoText}>{lowStock.length} bouteille{lowStock.length > 1 ? 's' : ''} en dernière unité</Text>
          </View>
        )}

        {/* ── Cave vide ── */}
        {!isLoading && bottles.length === 0 && caves.length > 0 && (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="wine-outline" size={40} color={Colors.parchemin} />
            </View>
            <Text style={s.emptyTitle}>Cave vide</Text>
            <Text style={s.emptyText}>Appuyez sur + pour ajouter votre première bouteille</Text>
          </View>
        )}

        {/* ── Anecdote ── */}
        <View style={s.anecdote}>
          <View style={s.anecdoteHead}>
            <Ionicons name="bulb-outline" size={13} color={Colors.ambreChaud} />
            <Text style={s.anecdoteLabel}>LE SAVIEZ-VOUS ?</Text>
          </View>
          <Text style={s.anecdoteText}>{ANECDOTE}</Text>
        </View>

        {/* ── Favoris ── */}
        {favorites.length > 0 && (
          <Section title="Favoris" icon="heart-outline" onMore={() => router.push('/cave-filtered?filter=favoritesOnly' as any)}>
            {favorites.map(b => (
              <BottleCard key={b._id} bottle={b} onPress={() => router.push(('/bottle/' + b._id) as any)} />
            ))}
          </Section>
        )}

        {/* ── Ajouts récents ── */}
        {recent.length > 0 && (
          <Section title="Ajouts récents" icon="time-outline" onMore={() => router.push('/(tabs)/cave')}>
            {recent.map(b => (
              <BottleCard key={b._id} bottle={b} onPress={() => router.push(('/bottle/' + b._id) as any)} />
            ))}
          </Section>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.cremeIvoire },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  date:          { fontSize: 12, color: Colors.brunClair, textTransform: 'capitalize', letterSpacing: 0.3 },
  appName:       { fontSize: 22, fontWeight: '800', color: Colors.brunMoka, letterSpacing: -0.3, marginTop: 2 },
  avatarBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.lieDeVin, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 16, fontWeight: '700', color: Colors.white },

  // Onboarding
  onboardingCard:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.champagne, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1.5, borderColor: Colors.lieDeVin, ...Shadow.sm },
  onboardingIcon:  { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.cremeIvoire, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },
  onboardingTitle: { fontSize: 15, fontWeight: '800', color: Colors.brunMoka, marginBottom: 3 },
  onboardingText:  { fontSize: 12, color: Colors.brunMoyen, lineHeight: 17 },

  // Lieux
  lieuSection:     { marginBottom: Spacing.md },
  lieuSectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  lieuSectionTitle:{ fontSize: 14, fontWeight: '700', color: Colors.brunMoka, letterSpacing: 0.2 },

  manageBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.champagne, borderWidth: 1.5, borderColor: Colors.lieDeVin },
  manageBtnText: { fontSize: 11, fontWeight: '700', color: Colors.lieDeVin },

  lieuCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.champagne, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.parchemin, ...Shadow.sm },
  lieuCardIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.cremeIvoire, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  lieuCardBody: { flex: 1 },
  lieuCardName: { fontSize: 16, fontWeight: '700', color: Colors.brunMoka },
  lieuCardSub:  { fontSize: 12, color: Colors.brunClair, marginTop: 2 },

  lieuEmpty:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.champagne, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.parchemin },
  lieuEmptyText: { fontSize: 12, color: Colors.brunClair, flex: 1, lineHeight: 18 },

  // Stats
  statsCard: { flexDirection: 'row', backgroundColor: Colors.lieDeVin, borderRadius: Radius.xl, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm },
  statCell:  { flex: 1, alignItems: 'center' },
  sep:       { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.white },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  // Alertes
  alert:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.rougeAlerteLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.rougeAlerte },
  alertDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.rougeAlerte },
  alertText:     { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.rougeAlerte },
  alertInfo:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.ambreChaudLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.ambreChaud },
  alertInfoText: { flex: 1, fontSize: 13, fontWeight: '500', color: Colors.ambreChaud },

  // Empty
  empty:      { alignItems: 'center', paddingVertical: Spacing.xxxl * 2, gap: Spacing.md },
  emptyIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.brunMoyen },
  emptyText:  { fontSize: 13, color: Colors.brunClair, textAlign: 'center', lineHeight: 20 },

  section:      { marginBottom: Spacing.xl },
  sectionHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.brunMoka, letterSpacing: 0.2 },
  sectionMore:  { fontSize: 12, color: Colors.lieDeVin, fontWeight: '600' },

  anecdote:      { backgroundColor: Colors.champagne, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.parchemin, borderLeftWidth: 3, borderLeftColor: Colors.ambreChaud },
  anecdoteHead:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: Spacing.sm },
  anecdoteLabel: { fontSize: 10, fontWeight: '700', color: Colors.ambreChaud, letterSpacing: 1 },
  anecdoteText:  { fontSize: 13, color: Colors.brunMoyen, lineHeight: 20, fontStyle: 'italic' },
});
