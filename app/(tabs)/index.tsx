import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../src/constants';
import { useBottleStore, useAuthStore, useCavesStore, useUIStore, useWishlistStore } from '../../src/stores';
import { BottleCard } from '../../src/components/bottle/BottleCard';
import { formatPrice, isUrgent } from '../../src/utils/bottle.utils';

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

  const firstName = user?.name?.split(' ')[0] ?? 'vous';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { fetchBottles(); fetchStats(); }} tintColor={Colors.lieDeVin} />}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>CAVOU</Text>
            <Text style={s.greeting}>Bonjour, {firstName}</Text>
            <Text style={s.date}>{TODAY.charAt(0).toUpperCase() + TODAY.slice(1)}</Text>
          </View>
          <View style={s.headerRight}>
            {/* Wishlist badge — ouvre directement l'onglet Wishlist dans Découvrir */}
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

        {/* ── Stats compactes ── */}
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

        {/* ── Lieu actif + switch ── */}
        {caves.length > 0 && lieuEntries.length > 1 && (
          <TouchableOpacity
            style={s.lieuSwitch}
            onPress={() => setShowLieuModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={13} color={Colors.lieDeVin} />
            <Text style={s.lieuSwitchText} numberOfLines={1}>{activeLieu ?? 'Tous les lieux'}</Text>
            <Ionicons name="chevron-down" size={13} color={Colors.lieDeVin} />
          </TouchableOpacity>
        )}

        {/* ── Alerte urgence ── */}
        {urgentList.length > 0 && (
          <TouchableOpacity style={s.alert} onPress={() => router.push('/(tabs)/discover')} activeOpacity={0.8}>
            <View style={s.alertDot} />
            <Text style={s.alertText}>
              {urgentList.length} bouteille{urgentList.length > 1 ? 's' : ''} à consommer bientôt
            </Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.rougeAlerte} />
          </TouchableOpacity>
        )}

        {/* ── Sélection principale ── */}
        {!isLoading && highlights.length > 0 && (
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

        {/* ── Cave vide ── */}
        {!isLoading && bottles.length === 0 && caves.length > 0 && (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="wine-outline" size={40} color={Colors.parchemin} />
            </View>
            <Text style={s.emptyTitle}>Cave vide</Text>
            <Text style={s.emptyText}>Appuyez sur + pour ajouter votre première bouteille</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/(tabs)/add')} activeOpacity={0.8}>
              <Ionicons name="add" size={16} color={Colors.white} />
              <Text style={s.emptyBtnText}>Ajouter une bouteille</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Anecdote du jour ── */}
        <TouchableOpacity style={s.anecdote} activeOpacity={0.75} onPress={() => {}}>
          <Text style={s.anecdoteEmoji}>{todayAnecdote.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.anecdoteLabel}>Le saviez-vous ?</Text>
            <Text style={s.anecdoteText}>{todayAnecdote.text}</Text>
          </View>
        </TouchableOpacity>

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

  // Header
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  brand:         { fontSize: 11, fontWeight: '900', color: Colors.lieDeVin, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 },
  greeting:      { fontSize: 22, fontWeight: '800', color: Colors.brunMoka, letterSpacing: -0.3 },
  date:          { fontSize: 12, color: Colors.brunClair, marginTop: 2, textTransform: 'capitalize' },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingTop: 4 },

  // Wishlist badge dans header
  wishBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  wishBadge:     { position: 'absolute', top: -3, right: -3, backgroundColor: Colors.lieDeVin, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  wishBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.white },

  avatarBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.lieDeVin, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarInitial: { fontSize: 16, fontWeight: '700', color: Colors.white },
  avatarPhoto:   { width: 40, height: 40, borderRadius: 20 },

  // Onboarding
  onboardingCard:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.champagne, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1.5, borderColor: Colors.lieDeVin + '30', ...Shadow.sm },
  onboardingIcon:  { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.rougeVinLight, borderWidth: 1, borderColor: Colors.lieDeVin + '20', alignItems: 'center', justifyContent: 'center' },
  onboardingTitle: { fontSize: 15, fontWeight: '800', color: Colors.brunMoka, marginBottom: 2 },
  onboardingText:  { fontSize: 12, color: Colors.brunMoyen, lineHeight: 17 },

  // Stats — row épuré
  statsRow:    { flexDirection: 'row', backgroundColor: Colors.lieDeVin, borderRadius: Radius.xl, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md, marginBottom: Spacing.lg, ...Shadow.sm },
  statPill:    { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statValue:   { fontSize: 18, fontWeight: '800', color: Colors.white, letterSpacing: -0.3 },
  statLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // Lieu switch compact
  lieuSwitch:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.champagne, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.parchemin, alignSelf: 'flex-start' },
  lieuSwitchText:{ fontSize: 13, fontWeight: '600', color: Colors.lieDeVin },

  // Alerte urgence
  alert:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.rougeAlerteLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.rougeAlerte },
  alertDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.rougeAlerte },
  alertText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.rougeAlerte },

  // Section principale
  section:      { marginBottom: Spacing.xl },
  sectionHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.brunMoka },
  sectionMore:  { fontSize: 12, color: Colors.lieDeVin, fontWeight: '600' },

  // Cave vide
  empty:      { alignItems: 'center', paddingVertical: Spacing.xxxl * 2, gap: Spacing.md },
  emptyIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.brunMoyen },
  emptyText:  { fontSize: 13, color: Colors.brunClair, textAlign: 'center', lineHeight: 20 },
  emptyBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.lieDeVin, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: 4 },
  emptyBtnText:{ fontSize: 14, fontWeight: '700', color: Colors.white },

  // Anecdote du jour
  anecdote:      { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: Colors.champagne, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.parchemin },
  anecdoteEmoji: { fontSize: 22, lineHeight: 28 },
  anecdoteLabel: { fontSize: 10, fontWeight: '800', color: Colors.lieDeVin, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  anecdoteText:  { fontSize: 13, color: Colors.brunMoyen, lineHeight: 19 },

  // Modal lieu
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: Colors.champagne, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, paddingHorizontal: Spacing.lg, paddingBottom: 36, paddingTop: Spacing.md },
  sheetHandle:{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.parchemin, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: Colors.brunMoka, marginBottom: Spacing.md },
  sheetItem:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderRadius: Radius.lg, paddingHorizontal: Spacing.sm, marginBottom: 2 },
  sheetItemActive: { backgroundColor: Colors.lieDeVin + '0D' },
  sheetItemName:       { fontSize: 15, fontWeight: '600', color: Colors.brunMoka },
  sheetItemNameActive: { color: Colors.lieDeVin, fontWeight: '700' },
  sheetItemCount:      { fontSize: 12, color: Colors.brunClair, marginTop: 1 },
  sheetManage:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.parchemin },
  sheetManageText: { fontSize: 13, color: Colors.brunMoyen },
});
