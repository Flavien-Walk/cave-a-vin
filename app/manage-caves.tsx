import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Modal, TextInput, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../src/constants';
import { useCavesStore } from '../src/stores';
import type { UserCave } from '../src/api/caves.api';

const DEFAULT_EMPLACEMENTS = [
  'Haut Derrière', 'Haut Devant',
  '1ère Clayette', '2ème Clayette', '3ème Clayette',
  'Milieu Derrière', 'Milieu Devant',
  'Bas Derrière', 'Bas Devant', 'Très Bas',
];

export default function ManageCavesScreen() {
  const { caves, activeCave, isLoading, fetchCaves, createCave, removeCave, setDefault, setActiveCave } = useCavesStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchCaves(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) { Alert.alert('Nom obligatoire'); return; }
    setAdding(true);
    try {
      await createCave({ name: newName.trim(), location: newLocation.trim() || undefined, emplacements: DEFAULT_EMPLACEMENTS });
      setShowAdd(false);
      setNewName('');
      setNewLocation('');
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
          text: 'Supprimer',
          style: 'destructive',
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

      <ScrollView contentContainerStyle={s.content}>
        {caves.length === 0 && !isLoading && (
          <View style={s.empty}>
            <Ionicons name="home-outline" size={48} color={Colors.parchemin} />
            <Text style={s.emptyTitle}>Aucune cave</Text>
            <Text style={s.emptyText}>Appuyez sur + pour créer votre première cave</Text>
          </View>
        )}

        {caves.map(cave => {
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
                  <Text style={s.caveSlots}>{cave.emplacements.length} emplacements</Text>
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
                placeholder="ex : Cave principale, Studio Paris..."
                placeholderTextColor={Colors.brunClair}
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />

              <Text style={s.inputLabel}>Adresse / Lieu (optionnel)</Text>
              <TextInput
                style={s.input}
                placeholder="ex : Appartement Lyon, Maison de campagne..."
                placeholderTextColor={Colors.brunClair}
                value={newLocation}
                onChangeText={setNewLocation}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.lg }}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowAdd(false); setNewName(''); setNewLocation(''); }}>
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
});
