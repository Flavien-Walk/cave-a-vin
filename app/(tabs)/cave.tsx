import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../../src/constants';
import { COULEURS_VIN } from '../../src/constants';
import { useBottleStore, useUIStore, useCavesStore } from '../../src/stores';
import { BottleCard } from '../../src/components/bottle/BottleCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { filterAndSortBottles } from '../../src/utils/bottle.utils';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Récent' },
  { value: 'annee',     label: 'Millésime' },
  { value: 'nom',       label: 'Nom A-Z' },
  { value: 'note',      label: 'Note' },
  { value: 'prix',      label: 'Prix' },
  { value: 'quantite',  label: 'Quantité' },
] as const;

export default function CaveScreen() {
  const { bottles, isLoading, fetchBottles } = useBottleStore();
  const { caveView, activeFilters, searchQuery, sortBy, setCaveView, setFilter, clearFilters, setSearchQuery, setSortBy } = useUIStore();
  const { caves, activeLieu } = useCavesStore();
  const [showFilters, setShowFilters] = useState(false);

  const { initSort } = useLocalSearchParams<{ initSort?: string }>();
  const effectiveSortBy = (initSort as any) || sortBy;

  useEffect(() => { fetchBottles(); }, []);
  useFocusEffect(useCallback(() => { fetchBottles(); }, []));

  // Caves du lieu actif (pour les chips de filtre par cave)
  const cavesInLieu = useMemo(() => {
    if (!activeLieu) return caves;
    return caves.filter(c => c.location === activeLieu);
  }, [caves, activeLieu]);

  // Noms des caves du lieu actif — sert à pré-filtrer les bouteilles
  const caveNamesInLieu = useMemo(
    () => cavesInLieu.map(c => c.name),
    [cavesInLieu]
  );

  // Filtrage : toutes les bouteilles du lieu actif, puis filtres UI
  const filtered = useMemo(() => {
    // Si un lieu est défini, on ne montre que les bouteilles de ses caves
    const base = (activeLieu && caveNamesInLieu.length > 0)
      ? bottles.filter(b => caveNamesInLieu.includes(b.cave ?? ''))
      : bottles;
    return filterAndSortBottles(base, searchQuery, activeFilters, effectiveSortBy);
  }, [bottles, caveNamesInLieu, activeLieu, searchQuery, activeFilters, effectiveSortBy]);

  const activeFilterCount = Object.values(activeFilters).filter(v => v && v !== false).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Titre + count + lieux inline */}
        <View style={styles.headerLeft}>
          <View style={styles.headerAccent} />
          <Text style={styles.title}>
            {activeLieu ? activeLieu : 'Mes vins'}
          </Text>
          <Text style={styles.count}>{filtered.length} bouteille{filtered.length !== 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, activeFilterCount > 0 && styles.headerBtnActive]}
            onPress={() => setShowFilters(v => !v)}
          >
            <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? Colors.white : Colors.lieDeVin} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setCaveView(caveView === 'list' ? 'grid' : 'list')}
          >
            <Ionicons name={caveView === 'list' ? 'grid-outline' : 'list-outline'} size={20} color={Colors.lieDeVin} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Recherche ── */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.brunClair} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un vin, producteur, région…"
          placeholderTextColor={Colors.brunClair}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.brunClair} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filtres ── */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {/* Couleurs */}
              {COULEURS_VIN.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, activeFilters.couleur === c && styles.chipActive]}
                  onPress={() => setFilter('couleur', activeFilters.couleur === c ? undefined : c)}
                >
                  <Text style={[styles.chipText, activeFilters.couleur === c && styles.chipTextActive]}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Caves du lieu actif seulement */}
              {cavesInLieu.map(c => (
                <TouchableOpacity
                  key={c._id}
                  style={[styles.chip, activeFilters.cave === c.name && styles.chipActive]}
                  onPress={() => setFilter('cave', activeFilters.cave === c.name ? undefined : c.name)}
                >
                  <Ionicons name="home-outline" size={12} color={activeFilters.cave === c.name ? Colors.white : Colors.brunMoyen} />
                  <Text style={[styles.chipText, activeFilters.cave === c.name && styles.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}

              {/* Favoris */}
              <TouchableOpacity
                style={[styles.chip, activeFilters.favoritesOnly && styles.chipActive]}
                onPress={() => setFilter('favoritesOnly', !activeFilters.favoritesOnly)}
              >
                <Ionicons name="heart" size={14} color={activeFilters.favoritesOnly ? Colors.white : Colors.brunMoyen} />
                <Text style={[styles.chipText, activeFilters.favoritesOnly && styles.chipTextActive]}>Favoris</Text>
              </TouchableOpacity>

              {/* Urgents */}
              <TouchableOpacity
                style={[styles.chip, activeFilters.urgentOnly && styles.chipActive]}
                onPress={() => setFilter('urgentOnly', !activeFilters.urgentOnly)}
              >
                <Ionicons name="time" size={14} color={activeFilters.urgentOnly ? Colors.white : Colors.brunMoyen} />
                <Text style={[styles.chipText, activeFilters.urgentOnly && styles.chipTextActive]}>À boire</Text>
              </TouchableOpacity>

              {activeFilterCount > 0 && (
                <TouchableOpacity style={[styles.chip, styles.chipClear]} onPress={clearFilters}>
                  <Text style={styles.chipClearText}>Effacer</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Tri */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.sm }}>
            <View style={styles.filterRow}>
              {SORT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, effectiveSortBy === opt.value && styles.chipSort]}
                  onPress={() => { setSortBy(opt.value as any); router.setParams({ initSort: undefined }); }}
                >
                  <Text style={[styles.chipText, effectiveSortBy === opt.value && styles.chipTextSort]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* ── Liste ── */}
      <FlatList
        data={filtered}
        keyExtractor={b => b._id}
        renderItem={({ item }) => (
          <BottleCard bottle={item} onPress={() => router.push(`/bottle/${item._id}`)} compact={caveView === 'grid'} />
        )}
        contentContainerStyle={[styles.list, filtered.length === 0 && { flex: 1 }]}
        numColumns={caveView === 'grid' ? 2 : 1}
        key={caveView}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchBottles} tintColor={Colors.lieDeVin} />}
        ListEmptyComponent={
          <EmptyState
            icon="wine-outline"
            title={searchQuery ? 'Aucun résultat' : 'Aucune bouteille'}
            subtitle={searchQuery ? `Aucun vin ne correspond à "${searchQuery}"` : 'Ajoutez votre première bouteille via le bouton +'}
            actionLabel={searchQuery ? undefined : 'Ajouter une bouteille'}
            onAction={searchQuery ? undefined : () => router.push('/(tabs)/add')}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.cremeIvoire },

  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  headerLeft:    { flex: 1, marginRight: Spacing.sm },
  headerAccent:  { width: 28, height: 3, borderRadius: 2, backgroundColor: Colors.lieDeVin, marginBottom: 6 },
  title:         { ...Typography.h2 },
  count:         { ...Typography.caption, color: Colors.brunMoyen, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: Spacing.sm, paddingTop: 4 },
  headerBtn:       { padding: Spacing.sm, backgroundColor: Colors.champagne, borderRadius: Radius.full, position: 'relative' },
  headerBtnActive: { backgroundColor: Colors.lieDeVin },
  filterBadge:     { position: 'absolute', top: -2, right: -2, backgroundColor: Colors.rougeAlerte, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { fontSize: 9, color: Colors.white, fontWeight: '700' },

  searchRow:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, backgroundColor: Colors.champagne, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, borderWidth: 1.5, borderColor: Colors.parchemin, minHeight: 46 },
  searchIcon:  { marginRight: Spacing.sm },
  searchInput: { flex: 1, ...Typography.body, color: Colors.brunMoka, paddingVertical: Spacing.md },

  filtersPanel: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  filterRow:    { flexDirection: 'row', gap: Spacing.sm, paddingVertical: 2 },

  chip:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin },
  chipActive:     { backgroundColor: Colors.lieDeVin, borderColor: Colors.lieDeVin },
  chipSort:       { backgroundColor: Colors.ambreChaudLight, borderColor: Colors.ambreChaud },
  chipClear:      { backgroundColor: Colors.rougeAlerteLight, borderColor: Colors.rougeAlerte },
  chipText:       { fontSize: 13, fontWeight: '500', color: Colors.brunMoyen },
  chipTextActive: { color: Colors.white },
  chipTextSort:   { color: Colors.ambreChaud, fontWeight: '600' },
  chipClearText:  { fontSize: 13, fontWeight: '600', color: Colors.rougeAlerte },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
});
