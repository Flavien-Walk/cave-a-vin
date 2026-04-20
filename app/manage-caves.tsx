import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Modal, TextInput, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../src/constants';
import { useCavesStore } from '../src/stores';
import type { UserCave } from '../src/api/caves.api';

type ModalMode = 'create' | 'edit';

export default function ManageCavesScreen() {
  const { caves, activeCave, activeLieu, isLoading, fetchCaves, createCave, updateCave, removeCave, setDefault, setActiveCave, setActiveLieu } = useCavesStore();

  // ── État du modal (partagé création / édition) ──
  const [modalMode,   setModalMode]   = useState<ModalMode>('create');
  const [showModal,   setShowModal]   = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [formName,    setFormName]    = useState('');
  const [formLieu,    setFormLieu]    = useState('');
  const [showSugg,    setShowSugg]    = useState(false);
  const [emplacements, setEmplacements] = useState<string[]>([]);
  const [empInput,    setEmpInput]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const empRef = useRef<TextInput>(null);

  useEffect(() => { fetchCaves(); }, []);

  // Groupement par lieu
  const { lieuGroups, noLieu } = useMemo(() => {
    const groups: Record<string, UserCave[]> = {};
    const noLieu: UserCave[] = [];
    caves.forEach(c => {
      if (c.location?.trim()) {
        if (!groups[c.location]) groups[c.location] = [];
        groups[c.location].push(c);
      } else {
        noLieu.push(c);
      }
    });
    return { lieuGroups: groups, noLieu };
  }, [caves]);

  const existingLieux = useMemo(() => Object.keys(lieuGroups), [lieuGroups]);

  // ── Ouverture des modals ──
  const openCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setFormName('');
    setFormLieu(activeLieu ?? '');
    setEmplacements([]);
    setEmpInput('');
    setShowSugg(false);
    setShowModal(true);
  };

  const openEdit = (cave: UserCave) => {
    setModalMode('edit');
    setEditingId(cave._id);
    setFormName(cave.name);
    setFormLieu(cave.location ?? '');
    setEmplacements([...cave.emplacements]);
    setEmpInput('');
    setShowSugg(false);
    setShowModal(true);
  };

  // ── Actions ──
  const addEmplacement = () => {
    const val = empInput.trim();
    if (!val) return;
    setEmplacements(prev => [...prev, val]);
    setEmpInput('');
    empRef.current?.focus();
  };

  const removeEmplacement = (i: number) =>
    setEmplacements(prev => prev.filter((_, j) => j !== i));

  const handleSave = async () => {
    if (!formName.trim()) { Alert.alert('Nom obligatoire'); return; }
    setSaving(true);
    try {
      if (modalMode === 'create') {
        await createCave({
          name:        formName.trim(),
          location:    formLieu.trim() || undefined,
          emplacements,
        });
      } else if (editingId) {
        await updateCave(editingId, {
          name:        formName.trim(),
          location:    formLieu.trim() || undefined,
          emplacements,
        });
      }
      setShowModal(false);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSaving(false);
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
    if (cave.location) setActiveLieu(cave.location);
    router.back();
  };

  // ── Carte de cave ──
  const CaveCard = ({ cave }: { cave: UserCave }) => {
    const isActive = activeCave?._id === cave._id;
    return (
      <TouchableOpacity
        style={[s.card, isActive && s.cardActive]}
        onPress={() => handleSetActive(cave)}
        activeOpacity={0.8}
      >
        <View style={s.cardLeft}>
          <View style={[s.iconRing, isActive && s.iconRingActive]}>
            <Ionicons name="home" size={18} color={isActive ? Colors.white : Colors.lieDeVin} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={[s.caveName, isActive && s.caveNameActive]}>{cave.name}</Text>
              {cave.isDefault && (
                <View style={s.defaultBadge}>
                  <Text style={s.defaultBadgeText}>défaut</Text>
                </View>
              )}
            </View>
            <Text style={s.caveSlots}>
              {cave.emplacements.length > 0
                ? `${cave.emplacements.length} emplacement${cave.emplacements.length > 1 ? 's' : ''}`
                : 'Pas d\'emplacement défini'}
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
          {/* Modifier */}
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => openEdit(cave)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="create-outline" size={18} color={Colors.lieDeVin} />
          </TouchableOpacity>
          {/* Par défaut */}
          {!cave.isDefault && (
            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => setDefault(cave._id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="star-outline" size={18} color={Colors.ambreChaud} />
            </TouchableOpacity>
          )}
          {/* Supprimer */}
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => handleDelete(cave)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.brunClair} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.brunMoka} />
        </TouchableOpacity>
        <Text style={s.title}>Mes caves</Text>
        <TouchableOpacity style={s.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {caves.length === 0 && !isLoading && (
          <View style={s.empty}>
            <Ionicons name="home-outline" size={48} color={Colors.parchemin} />
            <Text style={s.emptyTitle}>Aucune cave</Text>
            <Text style={s.emptyText}>Appuyez sur + pour créer votre première cave</Text>
          </View>
        )}

        {/* Caves groupées par lieu */}
        {Object.entries(lieuGroups).map(([lieu, cavesInLieu]) => (
          <View key={lieu}>
            <View style={s.lieuHeader}>
              <Ionicons name="location-outline" size={14} color={Colors.lieDeVin} />
              <Text style={s.lieuHeaderText}>{lieu}</Text>
              <Text style={s.lieuHeaderCount}>{cavesInLieu.length} cave{cavesInLieu.length > 1 ? 's' : ''}</Text>
            </View>
            {cavesInLieu.map(cave => <CaveCard key={cave._id} cave={cave} />)}
          </View>
        ))}

        {/* Caves sans lieu */}
        {noLieu.length > 0 && (
          <View>
            {existingLieux.length > 0 && (
              <View style={s.lieuHeader}>
                <Ionicons name="home-outline" size={14} color={Colors.brunClair} />
                <Text style={[s.lieuHeaderText, { color: Colors.brunClair }]}>Sans lieu</Text>
              </View>
            )}
            {noLieu.map(cave => <CaveCard key={cave._id} cave={cave} />)}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modal création / édition ── */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.overlay}>
            <View style={s.modal}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>
                {modalMode === 'create' ? 'Nouvelle cave' : 'Modifier la cave'}
              </Text>

              {/* Lieu */}
              <Text style={s.inputLabel}>
                Lieu / Habitation <Text style={s.inputLabelOpt}>(optionnel)</Text>
              </Text>
              <TextInput
                style={s.input}
                placeholder="ex : Lyon, Maison de vacances, Garage…"
                placeholderTextColor={Colors.brunClair}
                value={formLieu}
                onChangeText={v => { setFormLieu(v); setShowSugg(true); }}
                onFocus={() => setShowSugg(true)}
                returnKeyType="next"
              />
              {showSugg && existingLieux.filter(l => l.toLowerCase().includes(formLieu.toLowerCase()) && l !== formLieu).length > 0 && (
                <View style={s.suggList}>
                  {existingLieux
                    .filter(l => l.toLowerCase().includes(formLieu.toLowerCase()) && l !== formLieu)
                    .map(l => (
                      <TouchableOpacity key={l} style={s.suggItem} onPress={() => { setFormLieu(l); setShowSugg(false); }}>
                        <Ionicons name="location-outline" size={13} color={Colors.lieDeVin} />
                        <Text style={s.suggText}>{l}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}

              {/* Nom */}
              <Text style={s.inputLabel}>Nom de la cave *</Text>
              <TextInput
                style={s.input}
                placeholder="ex : Cave 1, Cave principale…"
                placeholderTextColor={Colors.brunClair}
                value={formName}
                onChangeText={setFormName}
                returnKeyType="next"
                onFocus={() => setShowSugg(false)}
                autoFocus={modalMode === 'create'}
              />

              {/* Emplacements */}
              <Text style={s.inputLabel}>
                Emplacements <Text style={s.inputLabelOpt}>(optionnel)</Text>
              </Text>
              <View style={s.empInputRow}>
                <TextInput
                  ref={empRef}
                  style={s.empInput}
                  placeholder="ex : Haut gauche, Étagère 2…"
                  placeholderTextColor={Colors.brunClair}
                  value={empInput}
                  onChangeText={setEmpInput}
                  returnKeyType="done"
                  onSubmitEditing={addEmplacement}
                  blurOnSubmit={false}
                  onFocus={() => setShowSugg(false)}
                />
                <TouchableOpacity
                  style={[s.empAddBtn, !empInput.trim() && s.empAddBtnDisabled]}
                  onPress={addEmplacement}
                  disabled={!empInput.trim()}
                >
                  <Ionicons name="add" size={20} color={Colors.white} />
                </TouchableOpacity>
              </View>

              {emplacements.length > 0 ? (
                <View style={s.empList}>
                  {emplacements.map((emp, i) => (
                    <View key={i} style={s.empChip}>
                      <Text style={s.empChipText} numberOfLines={1}>{emp}</Text>
                      <TouchableOpacity onPress={() => removeEmplacement(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <Ionicons name="close" size={13} color={Colors.brunMoyen} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={s.empEmpty}>Aucun emplacement défini.</Text>
              )}

              <View style={s.modalActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={s.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.createBtn, saving && s.createBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={s.createText}>
                    {saving
                      ? (modalMode === 'create' ? 'Création…' : 'Enregistrement…')
                      : (modalMode === 'create' ? 'Créer' : 'Enregistrer')}
                  </Text>
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

  content:    { padding: Spacing.lg, gap: Spacing.sm },
  empty:      { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.brunMoyen },
  emptyText:  { fontSize: 14, color: Colors.brunClair, textAlign: 'center' },

  lieuHeader:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: Spacing.sm, marginTop: Spacing.sm },
  lieuHeaderText:  { flex: 1, fontSize: 13, fontWeight: '800', color: Colors.lieDeVin, letterSpacing: 0.5, textTransform: 'uppercase' },
  lieuHeaderCount: { fontSize: 11, color: Colors.brunClair },

  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.champagne, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.parchemin, ...Shadow.sm, marginBottom: Spacing.sm },
  cardActive: { borderColor: Colors.lieDeVin, borderWidth: 2 },
  cardLeft:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconRing:       { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.cremeIvoire, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },
  iconRingActive: { backgroundColor: Colors.lieDeVin, borderColor: Colors.lieDeVin },
  caveName:       { fontSize: 15, fontWeight: '700', color: Colors.brunMoka },
  caveNameActive: { color: Colors.lieDeVin },
  caveSlots:      { fontSize: 11, color: Colors.brunClair, marginTop: 2 },
  defaultBadge:     { backgroundColor: Colors.ambreChaudLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  defaultBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.ambreChaud, letterSpacing: 0.5 },
  cardActions:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activePill:     { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.lieDeVin, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  activePillText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  actionBtn:      { padding: 4 },

  overlay:     { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modal:       { backgroundColor: Colors.champagne, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, paddingBottom: 36, maxHeight: '90%' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.parchemin, alignSelf: 'center', marginBottom: Spacing.lg },
  modalTitle:  { fontSize: 20, fontWeight: '800', color: Colors.brunMoka, textAlign: 'center', marginBottom: Spacing.xl },

  inputLabel:    { fontSize: 13, fontWeight: '600', color: Colors.brunMoyen, marginBottom: Spacing.sm },
  inputLabelOpt: { fontWeight: '400', color: Colors.brunClair },
  input:         { backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.parchemin, padding: Spacing.md, fontSize: 15, color: Colors.brunMoka, marginBottom: Spacing.md },

  suggList: { backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.parchemin, marginTop: -Spacing.md, marginBottom: Spacing.md, overflow: 'hidden' },
  suggItem: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.parchemin },
  suggText: { fontSize: 14, color: Colors.brunMoka, fontWeight: '500' },

  empInputRow:       { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  empInput:          { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.parchemin, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: 14, color: Colors.brunMoka },
  empAddBtn:         { width: 42, height: 42, borderRadius: Radius.md, backgroundColor: Colors.lieDeVin, alignItems: 'center', justifyContent: 'center' },
  empAddBtnDisabled: { backgroundColor: Colors.parchemin },
  empList:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  empChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.blancDoreLight, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.ambreChaud + '40' },
  empChipText:  { fontSize: 12, fontWeight: '600', color: Colors.brunMoka, maxWidth: 140 },
  empEmpty:     { fontSize: 12, color: Colors.brunClair, fontStyle: 'italic', marginBottom: Spacing.md },

  modalActions:      { flexDirection: 'row', gap: 10, marginTop: Spacing.lg },
  cancelBtn:         { flex: 1, padding: Spacing.md, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center' },
  cancelText:        { fontSize: 15, fontWeight: '600', color: Colors.brunMoyen },
  createBtn:         { flex: 2, padding: Spacing.md, borderRadius: Radius.full, backgroundColor: Colors.lieDeVin, alignItems: 'center' },
  createBtnDisabled: { opacity: 0.6 },
  createText:        { fontSize: 15, fontWeight: '700', color: Colors.white },
});
