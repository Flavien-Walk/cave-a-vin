import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../src/constants';
import { useWishlistStore, useBottleStore, useCavesStore } from '../../src/stores';
import { bottlesApi } from '../../src/api';
import { Input, Button, WineBadge, StarRating } from '../../src/components/ui';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { getRecommendations, analyzeFood } from '../../src/utils/recommendation';
import { getWineColorHex } from '../../src/utils/bottle.utils';
import { router } from 'expo-router';
import type { WishlistItem, WishlistPriorite, Bottle, TasteProfile, SmartReco } from '../../src/types';
import type { WineRecommendation, RecommendationResult } from '../../src/utils/recommendation';

const TABS = ['Accords & plats', 'Mes Goûts', 'À boire bientôt', 'Wishlist'] as const;
type Tab = typeof TABS[number];

const SUGGESTIONS_CATEGORIES = [
  { label: 'Viandes & volailles', items: ['Entrecôte', 'Poulet rôti', 'Magret de canard', 'Gigot d\'agneau', 'Côte de bœuf'] },
  { label: 'Poissons & mer',      items: ['Saumon', 'Fruits de mer', 'Huîtres', 'Homard', 'Sushi'] },
  { label: 'Cuisine du monde',    items: ['Tajine agneau', 'Couscous', 'Foie gras', 'Pizza', 'Wok'] },
  { label: 'Pâtes & fromages',    items: ['Pâtes carbonara', 'Risotto', 'Plateau fromages', 'Raclette'] },
  { label: 'Desserts & apéro',    items: ['Tarte chocolat', 'Crème brûlée', 'Apéritif', 'Charcuterie'] },
] as const;

const QUICK_SUGGESTIONS = ['Entrecôte', 'Saumon', 'Huîtres', 'Foie gras', 'Fromages', 'Magret', 'Poulet rôti'] as const;

export default function DiscoverScreen() {
  const { bottles, fetchBottles } = useBottleStore();
  const { caves, activeLieu } = useCavesStore();
  const { items, isLoading, fetchItems, addItem, deleteItem, markPurchased } = useWishlistStore();

  // Bouteilles filtrées par lieu actif pour les accords mets-vins
  const bottlesInLieu = useMemo(() => {
    if (!activeLieu) return bottles;
    const caveNames = caves.filter(c => c.location === activeLieu).map(c => c.name);
    if (!caveNames.length) return bottles;
    return bottles.filter(b => caveNames.includes(b.cave ?? ''));
  }, [bottles, caves, activeLieu]);
  const [activeTab, setActiveTab] = useState<Tab>('Accords & plats');

  // Accords
  const [plat, setPlat] = useState('');
  const [recoResult, setRecoResult] = useState<RecommendationResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Mes Goûts
  const [tasteProfile,   setTasteProfile]   = useState<TasteProfile | null>(null);
  const [smartRecos,     setSmartRecos]     = useState<SmartReco[]>([]);
  const [tasteLoading,   setTasteLoading]   = useState(false);

  // Urgents
  const [urgents, setUrgents]     = useState<Bottle[]>([]);
  const [urgLoading, setUrgLoading] = useState(false);

  // Category bottom sheet
  const [showCatSheet, setShowCatSheet] = useState(false);

  // Wishlist modal
  const [showAdd, setShowAdd]         = useState(false);
  const [wishNom, setWishNom]         = useState('');
  const [wishPriorite, setWishPriorite] = useState<WishlistPriorite>('normale');
  const [wishNote, setWishNote]       = useState('');
  const [addLoading, setAddLoading]   = useState(false);

  useEffect(() => { fetchItems(); fetchBottles(); }, []);

  useEffect(() => {
    if (activeTab === 'À boire bientôt') loadUrgents();
    if (activeTab === 'Mes Goûts') loadTasteData();
  }, [activeTab]);

  const loadTasteData = useCallback(async () => {
    setTasteLoading(true);
    try {
      const [profile, recos] = await Promise.all([
        bottlesApi.getTasteProfile(),
        bottlesApi.getSmartRecommendations(),
      ]);
      setTasteProfile(profile);
      setSmartRecos(recos.recommendations);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setTasteLoading(false);
    }
  }, []);

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
    const results = getRecommendations(bottlesInLieu, q);
    setRecoResult(results);
    setHasSearched(true);
  };

  const clearSearch = () => {
    setPlat('');
    setRecoResult(null);
    setHasSearched(false);
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
  const recs           = recoResult?.wines ?? [];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header compact */}
      <View style={s.header}>
        <View style={s.headerAccent} />
        <Text style={s.title}>Découvrir</Text>
        <Text style={s.subtitle}>Accords, goûts & recommandations</Text>
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
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Barre de recherche */}
            <View style={s.searchRow}>
              <TextInput
                style={s.searchInput}
                placeholder="ex : entrecôte, saumon, foie gras…"
                placeholderTextColor={Colors.brunClair}
                value={plat}
                onChangeText={text => {
                  setPlat(text);
                  if (!text.trim()) { setHasSearched(false); setRecoResult(null); }
                }}
                onSubmitEditing={() => searchAccords()}
                returnKeyType="search"
              />
              {plat.length > 0 && (
                <TouchableOpacity style={s.searchClear} onPress={clearSearch}>
                  <Ionicons name="close-circle" size={18} color={Colors.brunClair} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.searchBtn} onPress={() => searchAccords()}>
                <Ionicons name="search" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {/* Résultats */}
            {hasSearched && recoResult ? (
              <>
                <TouchableOpacity style={s.backToSugg} onPress={clearSearch}>
                  <Ionicons name="arrow-back" size={13} color={Colors.lieDeVin} />
                  <Text style={s.backToSuggText}>Changer de plat</Text>
                </TouchableOpacity>
                {foodProfile && (
                  <View style={s.profileBadge}>
                    <Text style={s.profileText}>
                      Plat détecté : <Text style={{ fontWeight: '700' }}>{recoResult.foodLabel || foodProfile.label}</Text>
                    </Text>
                  </View>
                )}
                {recoResult.message ? (
                  <View style={[s.messageBox, recoResult.bestLevel === 'ideal' ? s.messageIdeal : recoResult.bestLevel === 'aucun' ? s.messageAucun : s.messageBon]}>
                    <Text style={s.messageText}>{recoResult.message}</Text>
                  </View>
                ) : null}
                {recoResult.idealSuggestion && recoResult.bestLevel !== 'ideal' && (
                  <View style={s.idealSuggestion}>
                    <Ionicons name="cart-outline" size={14} color={Colors.lieDeVin} />
                    <Text style={s.idealSuggestionText}>{recoResult.idealSuggestion}</Text>
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
            ) : (
              <>
                {/* Suggestions rapides */}
                <Text style={s.suggTitle}>Idées rapides</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickRow} style={s.quickScroll}>
                  {QUICK_SUGGESTIONS.map(item => (
                    <TouchableOpacity key={item} style={chip.pill} onPress={() => searchAccords(item)}>
                      <Text style={chip.text}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Explorer par catégorie */}
                <TouchableOpacity style={s.catBtn} onPress={() => setShowCatSheet(true)} activeOpacity={0.75}>
                  <Ionicons name="grid-outline" size={15} color={Colors.lieDeVin} />
                  <Text style={s.catBtnText}>Explorer par catégorie</Text>
                  <Ionicons name="chevron-forward" size={15} color={Colors.lieDeVin} />
                </TouchableOpacity>

                {/* Astuce */}
                <View style={s.hintBanner}>
                  <Ionicons name="bulb-outline" size={14} color={Colors.ambreChaud} />
                  <Text style={s.hintText}>
                    Tapez n'importe quel plat — l'algorithme sélectionne les bouteilles les plus adaptées dans votre cave.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── Mes Goûts ── */}
      {activeTab === 'Mes Goûts' && (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {tasteLoading ? (
            <ActivityIndicator color={Colors.lieDeVin} style={{ marginTop: Spacing.xxxl }} />
          ) : !tasteProfile || tasteProfile.totalRated === 0 ? (
            <View style={taste.empty}>
              <View style={taste.emptyIcon}>
                <Ionicons name="heart-outline" size={34} color={Colors.parchemin} />
              </View>
              <Text style={taste.emptyTitle}>Aucune dégustation notée</Text>
              <Text style={taste.emptyText}>
                Consommez des bouteilles et notez-les pour que l'app apprenne vos préférences et vous fasse des recommandations personnalisées.
              </Text>
            </View>
          ) : (
            <>
              {/* KPI global */}
              <View style={taste.kpiRow}>
                <View style={taste.kpiCard}>
                  <Text style={taste.kpiValue}>{tasteProfile.totalRated}</Text>
                  <Text style={taste.kpiLabel}>dégustations notées</Text>
                </View>
                <View style={taste.kpiCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="star" size={18} color={Colors.ambreChaud} />
                    <Text style={[taste.kpiValue, { color: Colors.ambreChaud }]}>{tasteProfile.avgRating?.toFixed(1)}</Text>
                  </View>
                  <Text style={taste.kpiLabel}>note moyenne</Text>
                </View>
              </View>

              {/* Couleurs préférées */}
              {tasteProfile.topCouleurs.length > 0 && (
                <View style={taste.section}>
                  <View style={taste.sectionHeader}>
                    <View style={[taste.sectionAccent, { backgroundColor: Colors.lieDeVin }]} />
                    <Text style={[taste.sectionTitle, { color: Colors.lieDeVin }]}>Couleurs préférées</Text>
                  </View>
                  {tasteProfile.topCouleurs.map(c => (
                    <TasteRow
                      key={c.name}
                      label={c.name}
                      avgNote={c.avgNote}
                      count={c.count}
                      dotColor={getWineColorHex(c.name)}
                      maxNote={5}
                    />
                  ))}
                </View>
              )}

              {/* Régions préférées */}
              {tasteProfile.topRegions.length > 0 && (
                <View style={taste.section}>
                  <View style={taste.sectionHeader}>
                    <View style={[taste.sectionAccent, { backgroundColor: Colors.ambreChaud }]} />
                    <Text style={[taste.sectionTitle, { color: Colors.ambreChaud }]}>Régions appréciées</Text>
                  </View>
                  {tasteProfile.topRegions.slice(0, 5).map(r => (
                    <TasteRow
                      key={r.name}
                      label={r.name}
                      avgNote={r.avgNote}
                      count={r.count}
                      dotColor={Colors.ambreChaud}
                      maxNote={5}
                    />
                  ))}
                </View>
              )}

              {/* Cépages */}
              {tasteProfile.topCepages.length > 0 && (
                <View style={taste.section}>
                  <View style={taste.sectionHeader}>
                    <View style={[taste.sectionAccent, { backgroundColor: Colors.vertSauge }]} />
                    <Text style={[taste.sectionTitle, { color: Colors.vertSauge }]}>Cépages favoris</Text>
                  </View>
                  {tasteProfile.topCepages.map(c => (
                    <TasteRow
                      key={c.name}
                      label={c.name}
                      avgNote={c.avgNote}
                      count={c.count}
                      dotColor={Colors.vertSauge}
                      maxNote={5}
                    />
                  ))}
                </View>
              )}

              {/* Recommandations intelligentes */}
              {smartRecos.length > 0 && (
                <View style={taste.section}>
                  <View style={taste.sectionHeader}>
                    <View style={[taste.sectionAccent, { backgroundColor: Colors.rosePale }]} />
                    <Text style={[taste.sectionTitle, { color: Colors.rosePale }]}>Pour vous ce soir</Text>
                  </View>
                  <Text style={taste.sectionSub}>Sélection basée sur vos préférences</Text>
                  {smartRecos.map(r => (
                    <SmartRecoCard key={r.bottle._id} reco={r} />
                  ))}
                </View>
              )}

              {/* Dégustations récentes */}
              {tasteProfile.recentDrinks.length > 0 && (
                <View style={taste.section}>
                  <View style={taste.sectionHeader}>
                    <View style={[taste.sectionAccent, { backgroundColor: Colors.brunMoyen }]} />
                    <Text style={[taste.sectionTitle, { color: Colors.brunMoyen }]}>Dernières dégustations</Text>
                  </View>
                  {tasteProfile.recentDrinks.map((d, i) => (
                    <View key={i} style={taste.drinkRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={taste.drinkName} numberOfLines={1}>
                          {d.bottle?.nom ?? 'Bouteille inconnue'}
                        </Text>
                        {d.occasion && <Text style={taste.drinkOccasion}>{d.occasion}</Text>}
                        {d.comment  && <Text style={taste.drinkComment} numberOfLines={2}>{d.comment}</Text>}
                        <Text style={taste.drinkDate}>{new Date(d.date).toLocaleDateString('fr-FR')}</Text>
                      </View>
                      <StarRating value={d.note} readonly size={14} />
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* ── À boire bientôt ── */}
      {activeTab === 'À boire bientôt' && (
        <ScrollView contentContainerStyle={s.content}>
          {urgLoading
            ? <ActivityIndicator color={Colors.lieDeVin} style={{ marginTop: Spacing.xxxl }} />
            : urgents.length === 0
              ? <EmptyState icon="checkmark-circle-outline" title="Tout va bien" subtitle="Aucune bouteille urgente à consommer." />
              : <>
                  <View style={s.urgentHeader}>
                    <Ionicons name="time-outline" size={14} color={Colors.rougeAlerte} />
                    <Text style={s.urgentHeaderText}>
                      {urgents.length} bouteille{urgents.length > 1 ? 's' : ''} approchent ou ont dépassé leur date de consommation optimale. Ouvrez-les pour les apprécier à leur meilleur.
                    </Text>
                  </View>
                  {urgents.map(b => <UrgentCard key={b._id} bottle={b} />)}
                </>
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

      {/* Bottom sheet — catégories */}
      <Modal visible={showCatSheet} transparent animationType="slide" onRequestClose={() => setShowCatSheet(false)}>
        <View style={s.overlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowCatSheet(false)} />
          <View style={s.catSheet}>
            <View style={s.catSheetHandle} />
            <View style={s.catSheetHeader}>
              <Text style={s.catSheetTitle}>Explorer par plat</Text>
              <TouchableOpacity onPress={() => setShowCatSheet(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={20} color={Colors.brunMoyen} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {SUGGESTIONS_CATEGORIES.map(cat => (
                <View key={cat.label} style={s.sheetCat}>
                  <Text style={s.sheetCatLabel}>{cat.label}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6, paddingBottom: 2 }}>
                    {cat.items.map(item => (
                      <TouchableOpacity
                        key={item}
                        style={chip.pill}
                        onPress={() => { setShowCatSheet(false); searchAccords(item); }}
                      >
                        <Text style={chip.text}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ))}
              <View style={{ height: Spacing.xl }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  const matchColor = rec.match === 'ideal' ? Colors.vertSauge : rec.match === 'bon' ? Colors.ambreChaud : Colors.brunClair;
  const matchBg    = rec.match === 'ideal' ? Colors.vertSaugeLight : rec.match === 'bon' ? Colors.blancDoreLight : Colors.cremeIvoire;
  const matchLabel = rec.match === 'ideal' ? 'Accord idéal' : rec.match === 'bon' ? 'Bon accord' : 'Accord possible';

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
        {rec.caveat && (
          <View style={rc.caveat}>
            <Ionicons name="information-circle-outline" size={12} color={Colors.ambreChaud} />
            <Text style={rc.caveatText}>{rec.caveat}</Text>
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
  <TouchableOpacity style={urg.card} onPress={() => router.push(`/bottle/${bottle._id}` as any)} activeOpacity={0.8}>
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
  </TouchableOpacity>
);

const WishCard = ({ item, purchased, onPurchase, onDelete }: {
  item: WishlistItem; purchased?: boolean;
  onPurchase?: (id: string) => void; onDelete: (id: string) => void;
}) => (
  <View style={[wc.card, purchased && wc.purchased]}>
    <View style={{ flex: 1 }}>
      <View style={wc.nomRow}>
        <Text style={[wc.nom, purchased && wc.strikethrough]} numberOfLines={1}>{item.nom}</Text>
        {item.priorite && item.priorite !== 'normale' && (
          <View style={[wc.prioBadge, item.priorite === 'haute' ? wc.prioBadgeHaute : wc.prioBadgeBasse]}>
            <Text style={[wc.prioText, item.priorite === 'haute' ? wc.prioTextHaute : wc.prioTextBasse]}>
              {item.priorite === 'haute' ? '↑ Haute' : '↓ Basse'}
            </Text>
          </View>
        )}
      </View>
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
  header:       { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  headerAccent: { width: 28, height: 3, borderRadius: 2, backgroundColor: Colors.lieDeVin, marginBottom: 8 },
  title:        { fontSize: 26, fontWeight: '800', color: Colors.brunMoka },
  subtitle:     { fontSize: 12, color: Colors.brunClair, marginTop: 2 },
  tabsScroll: { maxHeight: 40 },
  tabsRow:    { paddingHorizontal: Spacing.lg, gap: Spacing.sm, flexDirection: 'row', alignItems: 'center' },
  tab:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin },
  tabActive:  { backgroundColor: Colors.lieDeVin, borderColor: Colors.lieDeVin },
  tabText:    { fontSize: 12, fontWeight: '600', color: Colors.brunMoyen },
  tabTextActive: { color: Colors.white },
  content: { padding: Spacing.lg, paddingBottom: 120 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.brunMoka, marginBottom: Spacing.md },
  searchRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, alignItems: 'center' },
  searchInput: { flex: 1, backgroundColor: Colors.champagne, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.parchemin, paddingHorizontal: Spacing.md, paddingRight: Spacing.xl, fontSize: 14, color: Colors.brunMoka, height: 44 },
  searchClear: { position: 'absolute', right: 58, zIndex: 1 },
  searchBtn: { backgroundColor: Colors.lieDeVin, borderRadius: Radius.lg, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backToSugg: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: Spacing.md },
  backToSuggText: { fontSize: 12, color: Colors.lieDeVin, fontWeight: '600' },
  profileBadge: { backgroundColor: Colors.blancDoreLight, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.blancDore + '40' },
  profileText: { fontSize: 13, color: Colors.ambreChaud },
  resultsTitle:       { fontSize: 13, color: Colors.brunMoyen, marginBottom: Spacing.md, fontWeight: '600' },
  messageBox:         { borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderLeftWidth: 3 },
  messageIdeal:       { backgroundColor: Colors.vertSaugeLight, borderLeftColor: Colors.vertSauge },
  messageBon:         { backgroundColor: Colors.blancDoreLight, borderLeftColor: Colors.ambreChaud },
  messageAucun:       { backgroundColor: Colors.cremeIvoire, borderLeftColor: Colors.brunClair },
  messageText:        { fontSize: 13, color: Colors.brunMoyen, lineHeight: 18 },
  idealSuggestion:    { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: Colors.champagne, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.parchemin },
  idealSuggestionText:{ fontSize: 12, color: Colors.lieDeVin, flex: 1, lineHeight: 17 },
  suggTitle:    { fontSize: 11, fontWeight: '700', color: Colors.brunClair, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: Spacing.sm },
  quickScroll:  { marginBottom: Spacing.md },
  quickRow:     { flexDirection: 'row', gap: 6, paddingBottom: 2 },
  catBtn:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.champagne, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.parchemin, paddingHorizontal: Spacing.md, paddingVertical: 12, marginBottom: Spacing.md },
  catBtnText:   { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.lieDeVin },
  hintBanner:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.blancDoreLight, borderRadius: Radius.md, padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.ambreChaud },
  hintText:     { flex: 1, fontSize: 12, color: Colors.brunMoyen, lineHeight: 17, fontStyle: 'italic' },
  catSheet:      { backgroundColor: Colors.cremeIvoire, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, paddingTop: Spacing.md, paddingHorizontal: Spacing.xl, paddingBottom: 0, maxHeight: '72%' },
  catSheetHandle:{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.parchemin, alignSelf: 'center', marginBottom: Spacing.lg },
  catSheetHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  catSheetTitle: { fontSize: 16, fontWeight: '800', color: Colors.brunMoka },
  sheetCat:      { marginBottom: Spacing.lg },
  sheetCatLabel: { fontSize: 9, fontWeight: '800', color: Colors.lieDeVin, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  urgentHeader:     { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.rougeAlerteLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.rougeAlerte },
  urgentHeaderText: { flex: 1, fontSize: 12, color: Colors.rougeAlerte, lineHeight: 17 },
  addBar:    { padding: Spacing.lg, paddingBottom: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.parchemin, backgroundColor: Colors.champagne },
  overlay:   { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.champagne, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, paddingBottom: 40 },
  modalTitle:{ fontSize: 18, fontWeight: '800', color: Colors.brunMoka, textAlign: 'center', marginBottom: Spacing.xl },
  pickerLabel:{ fontSize: 13, fontWeight: '600', color: Colors.brunMoyen, marginBottom: Spacing.sm },
});

const chip = StyleSheet.create({
  pill:       { paddingHorizontal: 11, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center' },
  active:     { backgroundColor: Colors.lieDeVin, borderColor: Colors.lieDeVin },
  text:       { fontSize: 12, fontWeight: '600', color: Colors.brunMoyen },
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
  caveat:     { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 4 },
  caveatText: { fontSize: 11, color: Colors.ambreChaud, lineHeight: 15, flex: 1 },
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
  card:          { backgroundColor: Colors.champagne, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.parchemin, ...Shadow.sm },
  purchased:     { opacity: 0.5 },
  nomRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 1 },
  nom:           { fontSize: 15, fontWeight: '700', color: Colors.brunMoka },
  strikethrough: { textDecorationLine: 'line-through' },
  note:          { fontSize: 12, color: Colors.brunClair, fontStyle: 'italic', marginTop: 2 },
  prioBadge:     { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  prioBadgeHaute:{ backgroundColor: Colors.rougeAlerteLight },
  prioBadgeBasse:{ backgroundColor: Colors.blancDoreLight },
  prioText:      { fontSize: 10, fontWeight: '700' },
  prioTextHaute: { color: Colors.rougeAlerte },
  prioTextBasse: { color: Colors.ambreChaud },
});

// ── TasteRow ──
function TasteRow({ label, avgNote, count, dotColor, maxNote }: {
  label: string; avgNote: number; count: number; dotColor: string; maxNote: number;
}) {
  const pct = Math.round((avgNote / maxNote) * 100);
  return (
    <View style={tr.row}>
      <View style={[tr.dot, { backgroundColor: dotColor }]} />
      <Text style={tr.label} numberOfLines={1}>{label}</Text>
      <View style={tr.track}>
        <View style={[tr.fill, { width: (pct + '%') as any, backgroundColor: dotColor + 'CC' }]} />
      </View>
      <View style={tr.right}>
        <Ionicons name="star" size={10} color={Colors.ambreChaud} />
        <Text style={tr.note}>{avgNote.toFixed(1)}</Text>
        <Text style={tr.count}>({count})</Text>
      </View>
    </View>
  );
}
const tr = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: Spacing.sm },
  dot:   { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  label: { fontSize: 12, width: 100, color: Colors.brunMoyen, flexShrink: 0 },
  track: { flex: 1, height: 7, backgroundColor: Colors.parchemin, borderRadius: Radius.full, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: Radius.full },
  right: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 60, justifyContent: 'flex-end' },
  note:  { fontSize: 12, fontWeight: '700', color: Colors.brunMoka },
  count: { fontSize: 10, color: Colors.brunClair },
});

// ── SmartRecoCard ──
function SmartRecoCard({ reco }: { reco: SmartReco }) {
  return (
    <TouchableOpacity style={sr.card} onPress={() => router.push(`/bottle/${reco.bottle._id}` as any)} activeOpacity={0.82}>
      <View style={{ flex: 1 }}>
        <Text style={sr.nom} numberOfLines={1}>{reco.bottle.nom}</Text>
        {reco.bottle.producteur && <Text style={sr.sub}>{reco.bottle.producteur}</Text>}
        <View style={sr.meta}>
          {reco.bottle.couleur && <WineBadge couleur={reco.bottle.couleur} size="sm" />}
          {reco.bottle.annee && <Text style={sr.year}>{reco.bottle.annee}</Text>}
          <Text style={sr.cave}>{reco.bottle.cave}</Text>
        </View>
        <View style={sr.reasons}>
          {reco.reasons.slice(0, 2).map((r, i) => (
            <View key={i} style={sr.reasonPill}>
              <Text style={sr.reasonText}>{r}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={sr.scoreBox}>
        <Ionicons name="heart" size={14} color={Colors.lieDeVin} />
        <Text style={sr.score}>{reco.score}</Text>
      </View>
    </TouchableOpacity>
  );
}
const sr = StyleSheet.create({
  card:      { backgroundColor: Colors.champagne, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.sm, flexDirection: 'row', borderWidth: 1, borderColor: Colors.parchemin, ...Shadow.sm },
  nom:       { fontSize: 15, fontWeight: '700', color: Colors.brunMoka, marginBottom: 2 },
  sub:       { fontSize: 12, color: Colors.brunMoyen, marginBottom: 4 },
  meta:      { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 6 },
  year:      { fontSize: 11, color: Colors.brunClair },
  cave:      { fontSize: 11, color: Colors.brunClair, fontStyle: 'italic' },
  reasons:   { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  reasonPill:{ backgroundColor: Colors.rougeVinLight, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  reasonText:{ fontSize: 11, color: Colors.lieDeVin, fontWeight: '600' },
  scoreBox:  { alignItems: 'center', justifyContent: 'center', paddingLeft: Spacing.sm, gap: 2 },
  score:     { fontSize: 18, fontWeight: '800', color: Colors.lieDeVin },
});

// ── Styles taste ──
const taste = StyleSheet.create({
  empty:     { alignItems: 'center', paddingTop: Spacing.xxxl * 2, gap: Spacing.md },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:{ fontSize: 18, fontWeight: '700', color: Colors.brunMoyen },
  emptyText: { ...Typography.body, color: Colors.brunClair, textAlign: 'center', lineHeight: 22 },

  kpiRow:  { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  kpiCard: { flex: 1, backgroundColor: Colors.champagne, borderRadius: Radius.xl, padding: Spacing.lg, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.parchemin, ...Shadow.sm },
  kpiValue:{ fontSize: 26, fontWeight: '800', color: Colors.lieDeVin, letterSpacing: -0.5 },
  kpiLabel:{ fontSize: 11, color: Colors.brunMoyen, textAlign: 'center' },

  section:      { backgroundColor: Colors.champagne, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.parchemin, ...Shadow.sm },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  sectionAccent:{ width: 3, height: 14, borderRadius: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3, marginBottom: 0 },
  sectionSub:   { fontSize: 12, color: Colors.brunClair, marginBottom: Spacing.md, fontStyle: 'italic' },

  drinkRow:     { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.sm, borderBottomWidth: 0.5, borderBottomColor: Colors.parchemin, gap: Spacing.md },
  drinkName:    { fontSize: 14, fontWeight: '700', color: Colors.brunMoka },
  drinkOccasion:{ fontSize: 12, color: Colors.ambreChaud, fontStyle: 'italic', marginTop: 1 },
  drinkComment: { fontSize: 12, color: Colors.brunMoyen, marginTop: 2, lineHeight: 17 },
  drinkDate:    { fontSize: 11, color: Colors.brunClair, marginTop: 3 },
});
