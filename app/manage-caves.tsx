import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Modal, TextInput, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../src/constants';
import { SITE_DEFINITIONS, getSiteCaveNames, type SiteName } from '../src/constants/sites';
import { useCavesStore } from '../src/stores';
import { useSiteStore } from '../src/stores/siteStore';
import type { UserCave } from '../src/api/caves.api';

export default function ManageCavesScreen() {
  const { caves, activeCave, isLoading, fetchCaves, createCave, removeCave, setDefault, setActiveCave } = useCavesStore();
  const { activeSite, setActiveSite } = useSiteStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState<SiteName>(activeSite);
  const [adding, setAdding] = useState(false);
  const [viewSite, setViewSite] = useState<SiteName>(activeSite);

  useEffect(() => { fetchCaves(); }, []);

  // Caves affichées pour le site sélectionné dans cet écran
  const siteCaves = (() => {
    const names  = getSiteCaveNames(viewSite);
    const byLoc  = caves.filter(c => c.location === viewSite);
    const byName = caves.filter(c => names.includes(c.name));
    return byLoc.length > 0 ? byLoc : byName;
  })();

  const siteDef = SITE_DEFINITIONS.find(s => s.name === viewSite)!;

  const handleCreate = async () => {
    if (!newName.trim()) { Alert.alert('Nom obligatoire'); return; }
    setAdding(true);
    const siteEmplacements = siteDef.caves[0]?.emplacements ?? [];
    try {
      await createCave({ name: newName.trim(), location: newLocation, emplacements: siteEmplacements });
      setShowAdd(false);
      setNewName('');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (cave: UserCave) => {
    Alert.alert(
      `Supprimer "${cave.name}" ?`,
      'Les bouteilles dans cette cave ne seront pas supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            try { await removeCave(cave._id); }
            catch (e: any) { Alert.alert('Erreur', e.message); }
          },
        },
      ]
    );
  };

  const handleSetActive = (cave: UserCave) => {
    setActiveCave(cave);
    // Synchroniser le site actif avec le site de la cave sélectionnée
    if (cave.location === 'Lyon' || cave.location === 'Marseillan') {
      setActiveSite(cave.location as SiteName);
    }
    router.back();
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.brunMoka} />
        </TouchableOpacity>
        <Text style={s.title}>Mes caves</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Onglets sites */}
      <View style={s.siteTabs}>
        {SITE_DEFINITIONS.map(site => (
          <TouchableOpacity
            key={site.name}
            style={[s.siteTab, viewSite === site.name && s.siteTabActive]}
            onPress={() => setViewSite(site.name)}
            activeOpacity={0.75}
          >
            <Text style={s.siteTabEmoji}>{site.emoji}</Text>
            <Text style={[s.siteTabLabel, viewSite === site.name && s.siteTabLabelActive]}>
              {site.label}
            </Text>
            <View style={[s.siteTabBadge, viewSite === site.name && s.siteTabBadgeActive]}>
              <Text style={[s.siteTabBadgeText, viewSite === site.name && { color: Colors.white }]}>
                {(() => {
                  const names = getSiteCaveNames(site.name);
                  const byLoc = caves.filter(c => c.location === site.name);
                  const byNm  = caves.filter(c => names.includes(c.name));
                  return (byLoc.length > 0 ? byLoc : byNm).length;
                })()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description du site */}
      <View style={s.siteInfo}>
        <Ionicons name={viewSite === 'Marseillan' ? 'water-outline' : 'home-outline'} size={14} color={Colors.brunClair} />
        <Text style={s.siteInfoText}>
          {viewSite === 'Lyon'
            ? '4 caves à vin avec emplacements précis'
            : '1 cave sans découpage en emplacements'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {siteCaves.length === 0 && !isLoading && (
          <View style={s.empty}>
            <Ionicons name="home-outline" size={48} color={Colors.parchemin} />
            <Text style={s.emptyTitle}>Aucune cave pour {viewSite}</Text>
            <Text style={s.emptyText}>Appuyez sur + pour créer les caves de ce site</Text>
          </View>
        )}

        {siteCaves.map(cave => {
          const isActive = activeCave?._id === cave._id;
          return (
            <TouchableOpacity
              key={cave._id}
              style={[s.card, isActive && s.cardActive]}
              onPress={() => handleSetActive(cave)}
              activeOpacity={0.8}
            >
              <View style={s.cardLeft}>
                <View style={[s.iconRing, isActive && s.iconRingActive]}>
                  <Ionicons name="home" size={20} color={isActive ? Colors.white : Colors.lieDeVin} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[s.caveName, isActive && s.caveNameActive]}>{cave.name}</Text>
                    {cave.isDefault && (
                      <View style={s.defaultBadge}>
                        <Text style={s.defaultBadgeText}>défaut</Text>
                      </View>
                    )}
                  </View>
                  {cave.location ? <Text style={s.caveLocation}>{cave.location}</Text> : null}
                  <Text style={s.caveSlots}>
                    {cave.emplacements.length > 0
                      ? `${cave.emplacements.length} emplacements`
                      : 'Pas d\'emplacement précis'}
                  </Text>
                </View>
              </View>
              <View style={s.cardActions}>
                {isActive && (
                  <View style={s.activePill}>
                    <Ionicons name="checkmark" size={12} color={Colors.white} />
                    <Text style={s.activePillText}>Active</Text>
                  </View>
                )}
                {!cave.isDefault && (
                  <TouchableOpacity
                    style={s.actionBtn}
                    onPress={() => setDefault(cave._id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="star-outline" size={18} color={Colors.ambreChaud} />
                  </TouchableOpacity>
                )}
                {caves.length > 1 && (
                  <TouchableOpacity
                    style={s.actionBtn}
                    onPress={() => handleDelete(cave)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.brunClair} />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal création */}
      <Modal visible={showAdd} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.overlay}>
            <View style={s.modal}>
              <Text style={s.modalTitle}>Nouvelle cave</Text>

              <Text style={s.inputLabel}>Nom *</Text>
              <TextInput
                style={s.input}
                placeholder="ex : Cave 5, Cave de service…"
                placeholderTextColor={Colors.brunClair}
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />

              <Text style={s.inputLabel}>Site</Text>
              <View style={s.sitePickerRow}>
                {SITE_DEFINITIONS.map(site => (
                  <TouchableOpacity
                    key={site.name}
                    style={[s.sitePickerBtn, newLocation === site.name && s.sitePickerBtnActive]}
                    onPress={() => setNewLocation(site.name)}
                  >
                    <Text style={s.sitePickerEmoji}>{site.emoji}</Text>
                    <Text style={[s.sitePickerLabel, newLocation === site.name && { color: Colors.white }]}>
                      {site.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.lg }}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowAdd(false); setNewName(''); }}>
                  <Text style={s.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.createBtn, adding && s.createBtnDisabled]} onPress={handleCreate} disabled={adding}>
                  <Text style={s.createText}>{adding ? 'Création…' : 'Créer'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.cremeIvoire },
  header:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.parchemin },
  backBtn: { padding: 4, marginRight: Spacing.sm },
  title:   { flex: 1, fontSize: 18, fontWeight: '800', color: Colors.brunMoka },
  addBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.lieDeVin, alignItems: 'center', justifyContent: 'center' },

  // Onglets sites
  siteTabs: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm },
  siteTab:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm, borderRadius: Radius.lg, backgroundColor: Colors.champagne, borderWidth: 1.5, borderColor: Colors.parchemin },
  siteTabActive: { backgroundColor: Colors.lieDeVin, borderColor: Colors.lieDeVin },
  siteTabEmoji: { fontSize: 14 },
  siteTabLabel: { fontSize: 13, fontWeight: '700', color: Colors.brunMoyen },
  siteTabLabelActive: { color: Colors.white },
  siteTabBadge: { backgroundColor: Colors.parchemin, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  siteTabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  siteTabBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.brunMoyen },

  siteInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  siteInfoText: { fontSize: 11, color: Colors.brunClair, fontStyle: 'italic' },

  content: { padding: Spacing.lg, gap: Spacing.sm },

  empty:      { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.brunMoyen },
  emptyText:  { fontSize: 14, color: Colors.brunClair, textAlign: 'center' },

  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.champagne, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.parchemin, ...Shadow.sm },
  cardActive: { borderColor: Colors.lieDeVin, borderWidth: 2 },
  cardLeft:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconRing:   { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.cremeIvoire, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },
  iconRingActive: { backgroundColor: Colors.lieDeVin, borderColor: Colors.lieDeVin },
  caveName:   { fontSize: 16, fontWeight: '700', color: Colors.brunMoka },
  caveNameActive: { color: Colors.lieDeVin },
  caveLocation: { fontSize: 12, color: Colors.brunClair, marginTop: 1 },
  caveSlots:  { fontSize: 11, color: Colors.brunClair, marginTop: 2 },
  defaultBadge: { backgroundColor: Colors.ambreChaudLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  defaultBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.ambreChaud, letterSpacing: 0.5 },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activePill:  { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.lieDeVin, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  activePillText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  actionBtn:   { padding: 4 },

  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modal:   { backgroundColor: Colors.champagne, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.brunMoka, textAlign: 'center', marginBottom: Spacing.xl },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.brunMoyen, marginBottom: Spacing.sm },
  input:      { backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.parchemin, padding: Spacing.md, fontSize: 15, color: Colors.brunMoka, marginBottom: Spacing.md },
  cancelBtn:  { flex: 1, padding: Spacing.md, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: Colors.brunMoyen },
  createBtn:  { flex: 2, padding: Spacing.md, borderRadius: Radius.full, backgroundColor: Colors.lieDeVin, alignItems: 'center' },
  createBtnDisabled: { opacity: 0.6 },
  createText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  sitePickerRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  sitePickerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.parchemin, backgroundColor: Colors.white },
  sitePickerBtnActive: { backgroundColor: Colors.lieDeVin, borderColor: Colors.lieDeVin },
  sitePickerEmoji: { fontSize: 16 },
  sitePickerLabel: { fontSize: 14, fontWeight: '700', color: Colors.brunMoyen },
});
