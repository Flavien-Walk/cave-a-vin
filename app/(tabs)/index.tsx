import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Shadow } from '../../src/constants';
import { useBottleStore, useAuthStore, useCavesStore, useUIStore, useWishlistStore } from '../../src/stores';
import { BottleCard } from '../../src/components/bottle/BottleCard';
import { formatPrice, isUrgent } from '../../src/utils/bottle.utils';

const { height: SCREEN_H } = Dimensions.get('window');

const ANECDOTES = [
  { emoji: '🍷', text: 'Un vin ouvert se conserve 3 à 5 jours au réfrigérateur, bouché hermétiquement.' },
  { emoji: '🌡️', text: 'La température idéale de conservation est entre 10 et 15 °C, à l\'abri de la lumière.' },
  { emoji: '🍇', text: 'Le Cabernet Sauvignon est le cépage le plus planté dans le monde.' },
  { emoji: '🥂', text: 'Le Champagne doit être servi entre 6 et 9 °C pour révéler toutes ses bulles.' },
  { emoji: '🌍', text: 'La France possède plus de 300 appellations d\'origine contrôlée.' },
  { emoji: '⏳', text: 'Moins de 10 % des vins produits dans le monde gagnent vraiment à vieillir.' },
  { emoji: '🏰', text: 'Un "château" en Bordelais peut désigner un simple domaine sans tour ni donjon.' },
  { emoji: '🍽️', text: 'Le rosé se marie très bien avec la cuisine épicée grâce à sa fraîcheur et sa légèreté.' },
  { emoji: '📏', text: 'Une bouteille standard contient 75 cl, soit environ 6 verres de dégustation.' },
  { emoji: '🌿', text: 'Le terroir regroupe le sol, le sous-sol, l\'exposition et le microclimat d\'une parcelle.' },
];

const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
const todayAnecdote = ANECDOTES[dayOfYear % ANECDOTES.length];

const TODAY = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

type LieuEntry = { lieu: string; nbCaves: number; nbBottles: number };

export default function DashboardScreen() {
  const { bottles, stats, isLoading, isStatsLoading, fetchBottles, fetchStats } = useBottleStore();
  const { user, profilePhotoUri } = useAuthStore();
  const { caves, activeLieu, fetchCaves, setActiveLieu } = useCavesStore();
  const { setFilter } = useUIStore();
  const { items: wishItems, fetchItems: fetchWishItems } = useWishlistStore();
  const [showLieuModal, setShowLieuModal] = useState(false);

  useEffect(() => { fetchBottles(); fetchStats(); fetchCaves(); fetchWishItems(); }, []);
  useFocusEffect(useCallback(() => { fetchBottles(); fetchStats(); fetchWishItems(); }, []));

  const lieuEntries = useMemo<LieuEntry[]>(() => {
    const lieus = [...new Set(caves.map(c => c.location).filter(Boolean))] as string[];
    return lieus.map(lieu => {
      const cavesInLieu = caves.filter(c => c.location === lieu);
      const caveNames   = cavesInLieu.map(c => c.name);
      const nbBottles   = bottles.filter(b => caveNames.includes(b.cave ?? '')).length;
      return { lieu, nbCaves: cavesInLieu.length, nbBottles };
    });
  }, [caves, bottles]);

  const caveNamesInLieu = useMemo(() => {
    if (!activeLieu) return null;
    const names = caves.filter(c => c.location === activeLieu).map(c => c.name);
    return names.length > 0 ? names : null;
  }, [caves, activeLieu]);

  const bottlesInLieu = useMemo(
    () => caveNamesInLieu ? bottles.filter(b => caveNamesInLieu.includes(b.cave ?? '')) : bottles,
    [bottles, caveNamesInLieu]
  );

  const wishlistActive = useMemo(() => wishItems.filter(i => !i.isPurchased), [wishItems]);

  const highlights = useMemo(() => {
    const favs   = bottlesInLieu.filter(b => b.isFavorite);
    const recent = [...bottlesInLieu].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const seen   = new Set<string>();
    const merged: typeof bottles = [];
    for (const b of [...favs, ...recent]) {
      if (!seen.has(b._id)) { seen.add(b._id); merged.push(b); }
      if (merged.length >= 4) break;
    }
    return merged;
  }, [bottlesInLieu]);

  const urgentList = useMemo(() => bottlesInLieu.filter(b => isUrgent(b) && b.quantite > 0), [bottlesInLieu]);

  const isEmpty    = !isLoading && bottles.length === 0;
  const firstName  = user?.name?.split(' ')[0] ?? 'vous';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { fetchBottles(); fetchStats(); }} tintColor={Colors.lieDeVin} />}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header compact ── */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>CAVOU</Text>
            <Text style={s.greeting}>Bonjour, {firstName}</Text>
            <Text style={s.date}>{TODAY.charAt(0).toUpperCase() + TODAY.slice(1)}</Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity
              style={s.wishBtn}
              onPress={() => router.push({ pathname: '/(tabs)/discover', params: { tab: 'Wishlist' } } as any)}
              activeOpacity={0.75}
            >
              <Ionicons name="bookmark-outline" size={20} color={Colors.lieDeVin} />
              {wishlistActive.length > 0 && (
                <View style={s.wishBadge}>
                  <Text style={s.wishBadgeText}>{wishlistActive.length > 9 ? '9+' : wishlistActive.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.avatarBtn} onPress={() => router.push('/profile' as any)}>
              {profilePhotoUri
                ? <Image source={{ uri: profilePhotoUri }} style={s.avatarPhoto} />
                : <Text style={s.avatarInitial}>{(user?.name?.[0] ?? '?').toUpperCase()}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* ════════════════════════════════════════
            ÉTAT VIDE — hiérarchie Action > Info
            ════════════════════════════════════════ */}
        {isEmpty && (
          <>
            {/* Hero CTA — priorité maximale */}
            <LinearGradient
              colors={['#6B1A2A', '#3D0E18']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.heroCta}
            >
              {/* Texture subtile */}
              <View style={s.heroDecor} />

              <Text style={s.heroEmoji}>🍷</Text>
              <Text style={s.heroTitle}>Commencez{'\n'}votre cave</Text>
              <Text style={s.heroSub}>Photographiez, cataloguez, savourez.</Text>

              <TouchableOpacity
                style={s.heroBtn}
                onPress={() => router.push('/(tabs)/add')}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={18} color={Colors.lieDeVin} />
                <Text style={s.heroBtnText}>Ajouter une bouteille</Text>
              </TouchableOpacity>
            </LinearGradient>

            {/* Onboarding cave manquante — compact */}
            {!isLoading && caves.length === 0 && (
              <TouchableOpacity style={s.onboardingStrip} onPress={() => router.push('/manage-caves' as any)} activeOpacity={0.85}>
                <Ionicons name="home-outline" size={16} color={Colors.lieDeVin} />
                <Text style={s.onboardingStripText}>Créez d'abord une cave pour ranger vos bouteilles</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.lieDeVin} />
              </TouchableOpacity>
            )}

            {/* Stats fantômes — contexte neutre, non prioritaire */}
            <View style={s.statsGhost}>
              <View style={s.statGhostPill}>
                <Text style={s.statGhostValue}>—</Text>
                <Text style={s.statGhostLabel}>bouteilles</Text>
              </View>
              <View style={s.statGhostDiv} />
              <View style={s.statGhostPill}>
                <Text style={s.statGhostValue}>—</Text>
                <Text style={s.statGhostLabel}>références</Text>
              </View>
              <View style={s.statGhostDiv} />
              <View style={s.statGhostPill}>
                <Text style={s.statGhostValue}>—</Text>
                <Text style={s.statGhostLabel}>valeur estimée</Text>
              </View>
            </View>

            {/* Lieu switch (si > 1) */}
            {caves.length > 0 && lieuEntries.length > 1 && (
              <TouchableOpacity style={s.lieuSwitch} onPress={() => setShowLieuModal(true)} activeOpacity={0.7}>
                <Ionicons name="location" size={13} color={Colors.lieDeVin} />
                <Text style={s.lieuSwitchText} numberOfLines={1}>{activeLieu ?? 'Tous les lieux'}</Text>
                <Ionicons name="chevron-down" size={13} color={Colors.lieDeVin} />
              </TouchableOpacity>
            )}

            {/* Anecdote — récompense, pas obstacle */}
            <View style={s.anecdotePill}>
              <Text style={s.anecdotePillEmoji}>{todayAnecdote.emoji}</Text>
              <Text style={s.anecdotePillText} numberOfLines={2}>{todayAnecdote.text}</Text>
            </View>
          </>
        )}

        {/* ════════════════════════════════════════
            ÉTAT REMPLI — Info > Action contextuelle
            ════════════════════════════════════════ */}
        {!isEmpty && (
          <>
            {/* Stats — maintenant significatives */}
            {!isStatsLoading && stats && (
              <View style={s.statsRow}>
                <TouchableOpacity style={s.statPill} onPress={() => router.push('/(tabs)/cave')} activeOpacity={0.75}>
                  <Text style={s.statValue}>{stats.totalBottles.toLocaleString('fr-FR')}</Text>
                  <Text style={s.statLabel}>bouteilles</Text>
                </TouchableOpacity>
                <View style={s.statDivider} />
                <TouchableOpacity style={s.statPill} onPress={() => router.push('/(tabs)/cave')} activeOpacity={0.75}>
                  <Text style={s.statValue}>{stats.totalReferences}</Text>
                  <Text style={s.statLabel}>références</Text>
                </TouchableOpacity>
                <View style={s.statDivider} />
                <TouchableOpacity style={s.statPill} onPress={() => router.push('/cave-value' as any)} activeOpacity={0.75}>
                  <Text style={[s.statValue, { color: Colors.ambreChaud }]}>{formatPrice(stats.totalValue)}</Text>
                  <Text style={s.statLabel}>valeur estimée</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Lieu switch */}
            {caves.length > 0 && lieuEntries.length > 1 && (
              <TouchableOpacity style={s.lieuSwitch} onPress={() => setShowLieuModal(true)} activeOpacity={0.7}>
                <Ionicons name="location" size={13} color={Colors.lieDeVin} />
                <Text style={s.lieuSwitchText} numberOfLines={1}>{activeLieu ?? 'Tous les lieux'}</Text>
                <Ionicons name="chevron-down" size={13} color={Colors.lieDeVin} />
              </TouchableOpacity>
            )}

            {/* Alerte urgence */}
            {urgentList.length > 0 && (
              <TouchableOpacity style={s.alert} onPress={() => router.push('/(tabs)/discover')} activeOpacity={0.8}>
                <View style={s.alertDot} />
                <Text style={s.alertText}>
                  {urgentList.length} bouteille{urgentList.length > 1 ? 's' : ''} à consommer bientôt
                </Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.rougeAlerte} />
              </TouchableOpacity>
            )}

            {/* À la une */}
            {highlights.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHead}>
                  <Text style={s.sectionTitle}>À la une</Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/cave')}>
                    <Text style={s.sectionMore}>Voir tout</Text>
                  </TouchableOpacity>
                </View>
                {highlights.map(b => (
                  <BottleCard key={b._id} bottle={b} onPress={() => router.push(('/bottle/' + b._id) as any)} />
                ))}
              </View>
            )}

            {/* Anecdote — pill compact en bas */}
            <View style={s.anecdotePill}>
              <Text style={s.anecdotePillEmoji}>{todayAnecdote.emoji}</Text>
              <Text style={s.anecdotePillText} numberOfLines={2}>{todayAnecdote.text}</Text>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Modal sélection de lieu ── */}
      <Modal visible={showLieuModal} transparent animationType="slide" onRequestClose={() => setShowLieuModal(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowLieuModal(false)}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Choisir un lieu</Text>
            {lieuEntries.map(({ lieu, nbBottles }) => {
              const active = activeLieu === lieu;
              return (
                <TouchableOpacity
                  key={lieu}
                  style={[s.sheetItem, active && s.sheetItemActive]}
                  onPress={() => { setActiveLieu(lieu); setFilter('cave', undefined); setShowLieuModal(false); }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="location" size={15} color={active ? Colors.lieDeVin : Colors.brunClair} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.sheetItemName, active && s.sheetItemNameActive]}>{lieu}</Text>
                    <Text style={s.sheetItemCount}>{nbBottles} bouteille{nbBottles !== 1 ? 's' : ''}</Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={20} color={Colors.lieDeVin} />}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={s.sheetManage} onPress={() => { setShowLieuModal(false); router.push('/manage-caves' as any); }}>
              <Ionicons name="settings-outline" size={14} color={Colors.brunMoyen} />
              <Text style={s.sheetManageText}>Gérer mes caves</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.cremeIvoire },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  // ── Header compact ──────────────────────────────────────────────────────────
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  brand:         { fontSize: 10, fontWeight: '900', color: Colors.lieDeVin, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 },
  greeting:      { fontSize: 24, fontWeight: '800', color: Colors.brunMoka, letterSpacing: -0.5 },
  date:          { fontSize: 12, color: Colors.brunClair, marginTop: 2, textTransform: 'capitalize' },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingTop: 4 },

  wishBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  wishBadge:     { position: 'absolute', top: -3, right: -3, backgroundColor: Colors.lieDeVin, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  wishBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.white },
  avatarBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.lieDeVin, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarInitial: { fontSize: 16, fontWeight: '700', color: Colors.white },
  avatarPhoto:   { width: 40, height: 40, borderRadius: 20 },

  // ── Hero CTA (état vide) ────────────────────────────────────────────────────
  heroCta: {
    borderRadius: Radius.xxl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    minHeight: SCREEN_H * 0.34,
    justifyContent: 'center',
    ...Shadow.sm,
  },
  heroDecor: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroEmoji: { fontSize: 52, marginBottom: Spacing.md },
  heroTitle: { fontSize: 30, fontWeight: '900', color: Colors.white, textAlign: 'center', letterSpacing: -0.5, lineHeight: 36, marginBottom: Spacing.sm },
  heroSub:   { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: Spacing.xl, letterSpacing: 0.2 },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 15,
    marginTop: Spacing.sm,
  },
  heroBtnText: { fontSize: 15, fontWeight: '800', color: Colors.lieDeVin },

  // ── Onboarding strip (compact) ──────────────────────────────────────────────
  onboardingStrip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.champagne, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.lieDeVin + '25' },
  onboardingStripText: { flex: 1, fontSize: 12, fontWeight: '600', color: Colors.brunMoyen, lineHeight: 17 },

  // ── Stats fantômes (état vide) ──────────────────────────────────────────────
  statsGhost:      { flexDirection: 'row', backgroundColor: Colors.champagne, borderRadius: Radius.xl, paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.parchemin },
  statGhostPill:   { flex: 1, alignItems: 'center', paddingVertical: 4 },
  statGhostDiv:    { width: 1, backgroundColor: Colors.parchemin },
  statGhostValue:  { fontSize: 18, fontWeight: '700', color: Colors.parchemin, letterSpacing: -0.3 },
  statGhostLabel:  { fontSize: 10, color: Colors.parchemin, marginTop: 2 },

  // ── Stats réelles (état rempli) ─────────────────────────────────────────────
  statsRow:    { flexDirection: 'row', backgroundColor: Colors.lieDeVin, borderRadius: Radius.xl, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md, marginBottom: Spacing.lg, ...Shadow.sm },
  statPill:    { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statValue:   { fontSize: 18, fontWeight: '800', color: Colors.white, letterSpacing: -0.3 },
  statLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // ── Lieu switch compact ─────────────────────────────────────────────────────
  lieuSwitch:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.champagne, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.parchemin, alignSelf: 'flex-start' },
  lieuSwitchText: { fontSize: 13, fontWeight: '600', color: Colors.lieDeVin },

  // ── Alerte urgence ──────────────────────────────────────────────────────────
  alert:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.rougeAlerteLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.rougeAlerte },
  alertDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.rougeAlerte },
  alertText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.rougeAlerte },

  // ── Section "À la une" ──────────────────────────────────────────────────────
  section:      { marginBottom: Spacing.xl },
  sectionHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.brunMoka },
  sectionMore:  { fontSize: 12, color: Colors.lieDeVin, fontWeight: '600' },

  // ── Anecdote — pill compact ─────────────────────────────────────────────────
  anecdotePill:      { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.champagne, borderRadius: Radius.lg, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.parchemin },
  anecdotePillEmoji: { fontSize: 14, lineHeight: 20, marginTop: 1 },
  anecdotePillText:  { flex: 1, fontSize: 12, color: Colors.brunClair, lineHeight: 18 },

  // ── Modal lieu ──────────────────────────────────────────────────────────────
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet:            { backgroundColor: Colors.champagne, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, paddingHorizontal: Spacing.lg, paddingBottom: 36, paddingTop: Spacing.md },
  sheetHandle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.parchemin, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle:       { fontSize: 16, fontWeight: '800', color: Colors.brunMoka, marginBottom: Spacing.md },
  sheetItem:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderRadius: Radius.lg, paddingHorizontal: Spacing.sm, marginBottom: 2 },
  sheetItemActive:  { backgroundColor: Colors.lieDeVin + '0D' },
  sheetItemName:        { fontSize: 15, fontWeight: '600', color: Colors.brunMoka },
  sheetItemNameActive:  { color: Colors.lieDeVin, fontWeight: '700' },
  sheetItemCount:       { fontSize: 12, color: Colors.brunClair, marginTop: 1 },
  sheetManage:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.parchemin },
  sheetManageText:  { fontSize: 13, color: Colors.brunMoyen },
});
