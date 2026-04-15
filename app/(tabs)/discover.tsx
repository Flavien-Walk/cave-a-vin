import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../src/constants';
import { useWishlistStore, useBottleStore } from '../../src/stores';
import { bottlesApi } from '../../src/api';
import { Input, Button, WineBadge } from '../../src/components/ui';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { getRecommendations, analyzeFood } from '../../src/utils/recommendation';
import type { WishlistItem, WishlistPriorite, Bottle } from '../../src/types';
import type { WineRecommendation } from '../../src/utils/recommendation';

const TABS = ['Accords & plats', 'À boire bientôt', 'Wishlist'] as const;
type Tab = typeof TABS[number];

const SUGGESTIONS_RAPIDES = [
  'Entrecôte', 'Saumon', 'Poulet rôti', 'Plateau fromages',
  'Fruits de mer', 'Pâtes carbonara', 'Agneau', 'Tarte chocolat',
];

export default function DiscoverScreen() {
  const { bottles } = useBottleStore();
  const { items, isLoading, fetchItems, addItem, deleteItem, markPurchased } = useWishlistStore();
  const [activeTab, setActiveTab] = useState<Tab>('Accords & plats');

  // Accords
  const [plat, setPlat] = useState('');
  const [recs, setRecs] = useState<WineRecommendation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Urgents
  const [urgents, setUrgents]     = useState<Bottle[]>([]);
  const [urgLoading, setUrgLoading] = useState(false);

  // Wishlist modal
  const [showAdd, setShowAdd]         = useState(false);
  const [wishNom, setWishNom]         = useState('');
  const [wishPriorite, setWishPriorite] = useState<WishlistPriorite>('normale');
  const [wishNote, setWishNote]       = useState('');
  const [addLoading, setAddLoading]   = useState(false);

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    if (activeTab === 'À boire bientôt') loadUrgents();
  }, [activeTab]);

  const loadUrgents = async () => {
    setUrgLoading(true);
    try { setUrgents(await bottlesApi.recommend()); }
    catch (e: any) { Alert.alert('Erreur', e.message); }
    finally { setUrgLoading(false); }
  };

  const searchAccords = (query?: string) => {
    const q = query ?? plat;
    if (!q.trim()) return;
    setPlat(q);
    const results = getRecommendations(bottles, q);
    setRecs(results);
    setHasSearched(true);
  };

  const handleAddWish = async () => {
    if (!wishNom.trim()) { Alert.alert('Nom obligatoire'); return; }
    setAddLoading(true);
    try {
      await addItem({ nom: wishNom.trim(), priorite: wishPriorite, note: wishNote.trim() || undefined });
      setShowAdd(false); setWishNom(''); setWishNote(''); setWishPriorite('normale');
    } catch (e: any) { Alert.alert('Erreur', e.message); }
    finally { setAddLoading(false); }
  };

  const activeItems    = items.filter(i => !i.isPurchased);
  const purchasedItems = items.filter(i => i.isPurchased);
  const foodProfile    = hasSearched ? analyzeFood(plat) : null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Découvrir</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Accords & plats ── */}
      {activeTab === 'Accords & plats' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

            <Text style={s.sectionTitle}>Quel plat préparez-vous ?</Text>

            {/* Suggestions rapides */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingRight: Spacing.lg }}>
                {SUGGESTIONS_RAPIDES.map(s2 => (
                  <TouchableOpacity key={s2} style={[chip.pill, plat === s2 && chip.active]} onPress={() => searchAccords(s2)}>
                    <Text style={[chip.text, plat === s2 && chip.textActive]}>{s2}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Champ texte libre */}
            <View style={s.searchRow}>
              <TextInput
                style={s.searchInput}
                placeholder="ex : entrecôte, poulet rôti, saumon..."
                placeholderTextColor={Colors.brunClair}
                value={plat}
                onChangeText={setPlat}
                onSubmitEditing={() => searchAccords()}
                returnKeyType="search"
              />
              <TouchableOpacity style={s.searchBtn} onPress={() => searchAccords()}>
                <Ionicons name="search" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {/* Résultats */}
            {hasSearched && (
              <>
                {foodProfile && (
                  <View style={s.profileBadge}>
                    <Text style={s.profileText}>
                      Plat détecté : <Text style={{ fontWeight: '700' }}>{foodProfile.label}</Text>
                    </Text>
                  </View>
                )}

                {recs.length === 0
                  ? <EmptyState icon="wine-outline" title="Aucune bouteille disponible" subtitle="Votre cave ne contient pas de vin adapté à ce plat." />
                  : <>
                      <Text style={s.resultsTitle}>{recs.length} accord{recs.length > 1 ? 's' : ''} trouvé{recs.length > 1 ? 's' : ''}</Text>
                      {recs.map((rec, i) => <RecoCard key={rec.bottle._id} rec={rec} rank={i + 1} />)}
                    </>
                }
              </>
            )}

            {!hasSearched && (
              <View style={s.emptyAccord}>
                <Text style={s.emptyAccordIcon}>🍷</Text>
                <Text style={s.emptyAccordTitle}>Trouvez l'accord parfait</Text>
                <Text style={s.emptyAccordText}>Indiquez votre plat et l'algorithme sélectionne les meilleures bouteilles de votre cave.</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── À boire bientôt ── */}
      {activeTab === 'À boire bientôt' && (
        <ScrollView contentContainerStyle={s.content}>
          {urgLoading
            ? <ActivityIndicator color={Colors.lieDeVin} style={{ marginTop: Spacing.xxxl }} />
            : urgents.length === 0
              ? <EmptyState icon="checkmark-circle-outline" title="Tout va bien" subtitle="Aucune bouteille urgente à consommer." />
              : urgents.map(b => <UrgentCard key={b._id} bottle={b} />)
          }
        </ScrollView>
      )}

      {/* ── Wishlist ── */}
      {activeTab === 'Wishlist' && (
        <>
          <ScrollView contentContainerStyle={s.content}>
            {isLoading
              ? <ActivityIndicator color={Colors.lieDeVin} style={{ marginTop: Spacing.xxxl }} />
              : activeItems.length === 0
                ? <EmptyState icon="bookmark-outline" title="Liste vide" subtitle="Ajoutez des vins que vous souhaitez acquérir." />
                : activeItems.map(item => <WishCard key={item._id} item={item} onPurchase={markPurchased} onDelete={deleteItem} />)
            }
            {purchasedItems.length > 0 && (
              <View style={{ marginTop: Spacing.xl }}>
                <Text style={s.sectionTitle}>Achetés ({purchasedItems.length})</Text>
                {purchasedItems.map(item => <WishCard key={item._id} item={item} purchased onDelete={deleteItem} />)}
              </View>
            )}
          </ScrollView>
          <View style={s.addBar}>
            <Button label="Ajouter à la liste" onPress={() => setShowAdd(true)} fullWidth icon={<Ionicons name="add" size={18} color={Colors.white} />} />
          </View>
        </>
      )}

      {/* Modal wishlist */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Ajouter à la liste</Text>
            <Input label="Nom du vin" placeholder="ex : Pétrus 2012" value={wishNom} onChangeText={setWishNom} required />
            <Text style={s.pickerLabel}>Priorité</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
              {(['haute', 'normale', 'basse'] as WishlistPriorite[]).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[chip.pill, wishPriorite === p && chip.active, { flex: 1, justifyContent: 'center' }]}
                  onPress={() => setWishPriorite(p)}
                >
                  <Text style={[chip.text, wishPriorite === p && chip.textActive]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Note" placeholder="Pourquoi ce vin ?" value={wishNote} onChangeText={setWishNote} multiline numberOfLines={2} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.md }}>
              <Button label="Annuler" variant="secondary" onPress={() => setShowAdd(false)} style={{ flex: 1 }} />
              <Button label="Ajouter" onPress={handleAddWish} loading={addLoading} style={{ flex: 2 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Composants ──

const RecoCard = ({ rec, rank }: { rec: WineRecommendation; rank: number }) => {
  const matchColor = rec.match === 'parfait' ? Colors.vertSauge : rec.match === 'bon' ? Colors.ambreChaud : Colors.brunClair;
  const matchBg    = rec.match === 'parfait' ? Colors.vertSaugeLight : rec.match === 'bon' ? Colors.blancDoreLight : Colors.cremeIvoire;
  const matchLabel = rec.match === 'parfait' ? 'Accord parfait' : rec.match === 'bon' ? 'Bon accord' : 'Accord possible';

  return (
    <View style={rc.card}>
      <View style={rc.rankBadge}>
        <Text style={rc.rankText}>#{rank}</Text>
      </View>
      <View style={rc.body}>
        <View style={rc.top}>
          <Text style={rc.nom} numberOfLines={1}>{rec.bottle.nom}</Text>
          <View style={[rc.matchBadge, { backgroundColor: matchBg }]}>
            <Text style={[rc.matchText, { color: matchColor }]}>{matchLabel}</Text>
          </View>
        </View>
        {rec.bottle.producteur ? <Text style={rc.sub}>{rec.bottle.producteur}</Text> : null}
        <View style={rc.meta}>
          {rec.bottle.couleur && <WineBadge couleur={rec.bottle.couleur} size="sm" />}
          {rec.bottle.annee ? <Text style={rc.year}>{rec.bottle.annee}</Text> : null}
          <Text style={rc.cave}>{rec.bottle.cave}</Text>
        </View>
        <Text style={rc.explanation}>{rec.explanation}</Text>
        {rec.factors.length > 0 && (
          <View style={rc.factors}>
            {rec.factors.map((f, i) => (
              <View key={i} style={rc.factor}>
                <Ionicons name="checkmark" size={11} color={Colors.vertSauge} />
                <Text style={rc.factorText}>{f}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={rc.scoreCol}>
        <Text style={rc.score}>{rec.score}</Text>
        <Text style={rc.scoreLabel}>pts</Text>
      </View>
    </View>
  );
};

const UrgentCard = ({ bottle }: { bottle: Bottle }) => (
  <View style={urg.card}>
    <View style={urg.left}>
      <Text style={urg.nom}>{bottle.nom}</Text>
      {bottle.producteur ? <Text style={urg.sub}>{bottle.producteur}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
        {bottle.couleur && <WineBadge couleur={bottle.couleur} size="sm" />}
        {bottle.annee ? <Text style={urg.meta}>{bottle.annee}</Text> : null}
      </View>
    </View>
    {bottle.consommerAvant && (
      <View style={urg.badge}>
        <Text style={urg.year}>{bottle.consommerAvant}</Text>
        <Text style={urg.label}>limite</Text>
      </View>
    )}
  </View>
);

const WishCard = ({ item, purchased, onPurchase, onDelete }: {
  item: WishlistItem; purchased?: boolean;
  onPurchase?: (id: string) => void; onDelete: (id: string) => void;
}) => (
  <View style={[wc.card, purchased && wc.purchased]}>
    <View style={{ flex: 1 }}>
      <Text style={[wc.nom, purchased && wc.strikethrough]}>{item.nom}</Text>
      {item.note ? <Text style={wc.note}>{item.note}</Text> : null}
    </View>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {!purchased && onPurchase && (
        <TouchableOpacity onPress={() => onPurchase(item._id)}>
          <Ionicons name="checkmark-circle-outline" size={24} color={Colors.vertSauge} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => Alert.alert('Supprimer', undefined, [{ text: 'Annuler' }, { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(item._id) }])}>
        <Ionicons name="trash-outline" size={22} color={Colors.brunClair} />
      </TouchableOpacity>
    </View>
  </View>
);

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.cremeIvoire },
  header:  { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  title:   { fontSize: 26, fontWeight: '800', color: Colors.brunMoka },
  tabsScroll: { maxHeight: 46 },
  tabsRow:    { paddingHorizontal: Spacing.lg, gap: Spacing.sm, flexDirection: 'row' },
  tab:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin },
  tabActive:  { backgroundColor: Colors.lieDeVin, borderColor: Colors.lieDeVin },
  tabText:    { fontSize: 13, fontWeight: '600', color: Colors.brunMoyen },
  tabTextActive: { color: Colors.white },
  content: { padding: Spacing.lg, paddingBottom: 120 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.brunMoka, marginBottom: Spacing.md },
  searchRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  searchInput: { flex: 1, backgroundColor: Colors.champagne, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.parchemin, paddingHorizontal: Spacing.md, fontSize: 14, color: Colors.brunMoka, height: 48 },
  searchBtn: { backgroundColor: Colors.lieDeVin, borderRadius: Radius.lg, width: 48, alignItems: 'center', justifyContent: 'center' },
  profileBadge: { backgroundColor: Colors.blancDoreLight, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.blancDore + '40' },
  profileText: { fontSize: 13, color: Colors.ambreChaud },
  resultsTitle: { fontSize: 13, color: Colors.brunMoyen, marginBottom: Spacing.md, fontWeight: '600' },
  emptyAccord: { alignItems: 'center', paddingTop: Spacing.xxxl, gap: Spacing.md },
  emptyAccordIcon: { fontSize: 52 },
  emptyAccordTitle: { fontSize: 18, fontWeight: '700', color: Colors.brunMoyen },
  emptyAccordText: { fontSize: 13, color: Colors.brunClair, textAlign: 'center', lineHeight: 20 },
  addBar:    { padding: Spacing.lg, paddingBottom: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.parchemin, backgroundColor: Colors.champagne },
  overlay:   { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.champagne, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, paddingBottom: 40 },
  modalTitle:{ fontSize: 18, fontWeight: '800', color: Colors.brunMoka, textAlign: 'center', marginBottom: Spacing.xl },
  pickerLabel:{ fontSize: 13, fontWeight: '600', color: Colors.brunMoyen, marginBottom: Spacing.sm },
});

const chip = StyleSheet.create({
  pill:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center' },
  active:     { backgroundColor: Colors.lieDeVin, borderColor: Colors.lieDeVin },
  text:       { fontSize: 13, fontWeight: '600', color: Colors.brunMoyen },
  textActive: { color: Colors.white },
});

const rc = StyleSheet.create({
  card:       { backgroundColor: Colors.champagne, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.sm, flexDirection: 'row', borderWidth: 1, borderColor: Colors.parchemin, ...Shadow.sm },
  rankBadge:  { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.cremeIvoire, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm, alignSelf: 'flex-start', marginTop: 2 },
  rankText:   { fontSize: 11, fontWeight: '800', color: Colors.brunMoyen },
  body:       { flex: 1 },
  top:        { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: 2 },
  nom:        { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.brunMoka },
  matchBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  matchText:  { fontSize: 11, fontWeight: '700' },
  sub:        { fontSize: 12, color: Colors.brunMoyen, marginBottom: 4 },
  meta:       { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 6 },
  year:       { fontSize: 11, color: Colors.brunClair },
  cave:       { fontSize: 11, color: Colors.brunClair, fontStyle: 'italic' },
  explanation:{ fontSize: 13, color: Colors.brunMoyen, lineHeight: 18, fontStyle: 'italic', marginBottom: 4 },
  factors:    { gap: 3 },
  factor:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  factorText: { fontSize: 11, color: Colors.vertSauge, fontWeight: '600' },
  scoreCol:   { alignItems: 'center', justifyContent: 'center', paddingLeft: Spacing.sm },
  score:      { fontSize: 22, fontWeight: '900', color: Colors.lieDeVin },
  scoreLabel: { fontSize: 10, color: Colors.brunClair, fontWeight: '600' },
});

const urg = StyleSheet.create({
  card:  { backgroundColor: Colors.champagne, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.sm, flexDirection: 'row', borderWidth: 1, borderColor: Colors.parchemin, ...Shadow.sm },
  left:  { flex: 1 },
  nom:   { fontSize: 15, fontWeight: '700', color: Colors.brunMoka },
  sub:   { fontSize: 12, color: Colors.brunMoyen },
  meta:  { fontSize: 11, color: Colors.brunClair },
  badge: { backgroundColor: Colors.rougeAlerteLight, borderRadius: Radius.md, padding: 8, alignItems: 'center' },
  year:  { fontSize: 16, fontWeight: '800', color: Colors.rougeAlerte },
  label: { fontSize: 10, color: Colors.rougeAlerte },
});

const wc = StyleSheet.create({
  card:        { backgroundColor: Colors.champagne, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.parchemin, ...Shadow.sm },
  purchased:   { opacity: 0.5 },
  nom:         { fontSize: 15, fontWeight: '700', color: Colors.brunMoka },
  strikethrough:{ textDecorationLine: 'line-through' },
  note:        { fontSize: 12, color: Colors.brunClair, fontStyle: 'italic', marginTop: 2 },
});
