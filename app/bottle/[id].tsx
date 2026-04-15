import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../src/constants';
import { FORMATS_BOUTEILLE } from '../../src/constants';
import { useBottleStore } from '../../src/stores';
import { bottlesApi } from '../../src/api';
import { StarRating, Button, WineBadge } from '../../src/components/ui';
import { Input } from '../../src/components/ui/Input';
import { getWineGradient, getAverageNote, formatPrice, isNearUrgent } from '../../src/utils/bottle.utils';
import type { Bottle, ConsumptionEntry } from '../../src/types';

export default function BottleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottles, toggleFavorite, drinkBottle, addNote, deleteNote, deleteBottle } = useBottleStore();

  const [bottle, setBottle]   = useState<Bottle | null>(bottles.find(b => b._id === id) ?? null);
  const [history, setHistory] = useState<ConsumptionEntry[]>([]);
  const [loading, setLoading] = useState(!bottle);

  // Modals
  const [showDrink, setShowDrink] = useState(false);
  const [showNote,  setShowNote]  = useState(false);

  // Drink modal state
  const [drinkQty,     setDrinkQty]     = useState('1');
  const [drinkNote,    setDrinkNote]    = useState(0);
  const [drinkComment, setDrinkComment] = useState('');
  const [drinkLoading, setDrinkLoading] = useState(false);

  // Note modal state
  const [noteValue,    setNoteValue]   = useState(0);
  const [noteTexte,    setNoteTexte]   = useState('');
  const [noteOccasion, setNoteOccasion] = useState('');
  const [noteLoading,  setNoteLoading] = useState(false);

  const loadFull = useCallback(async () => {
    if (!id) return;
    try {
      const [b, h] = await Promise.all([
        bottlesApi.getOne(id),
        bottlesApi.getHistory(id),
      ]);
      setBottle(b);
      setHistory(h);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger la bouteille.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadFull(); }, [loadFull]);

  if (loading || !bottle) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ActivityIndicator color={Colors.lieDeVin} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const avg     = getAverageNote(bottle);
  const urgent  = isNearUrgent(bottle);
  const gradient = getWineGradient(bottle.couleur);
  const formatLabel = FORMATS_BOUTEILLE.find(f => f.value === bottle.format)?.label ?? bottle.format;

  const handleToggleFavorite = async () => {
    await toggleFavorite(bottle._id);
    setBottle(b => b ? { ...b, isFavorite: !b.isFavorite } : b);
  };

  const handleDrink = async () => {
    const qty = Number(drinkQty);
    if (!qty || qty < 1) { Alert.alert('Quantité invalide'); return; }
    setDrinkLoading(true);
    try {
      await drinkBottle(bottle._id, { quantity: qty, note: drinkNote || undefined, comment: drinkComment || undefined });
      setBottle(b => b ? { ...b, quantite: b.quantite - qty } : b);
      setShowDrink(false);
      setDrinkQty('1'); setDrinkNote(0); setDrinkComment('');
      await loadFull();
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setDrinkLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteValue) { Alert.alert('Choisissez une note'); return; }
    setNoteLoading(true);
    try {
      await addNote(bottle._id, { note: noteValue, texte: noteTexte || undefined, occasion: noteOccasion || undefined });
      setShowNote(false);
      setNoteValue(0); setNoteTexte(''); setNoteOccasion('');
      await loadFull();
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setNoteLoading(false);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert('Supprimer cette note ?', undefined, [
      { text: 'Annuler' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await deleteNote(bottle._id, noteId);
        await loadFull();
      }},
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer cette bouteille ?',
      `"${bottle.nom}" sera définitivement supprimée.`,
      [
        { text: 'Annuler' },
        { text: 'Supprimer', style: 'destructive', onPress: async () => {
          await deleteBottle(bottle._id);
          router.back();
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header gradient ── */}
      <LinearGradient colors={gradient} style={styles.gradientHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Retour">
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.nom} numberOfLines={2}>{bottle.nom}</Text>
          {bottle.producteur ? <Text style={styles.producteur}>{bottle.producteur}</Text> : null}
          {bottle.annee ? <Text style={styles.annee}>{bottle.annee}</Text> : null}

          <View style={styles.headerBadges}>
            {bottle.couleur && <WineBadge couleur={bottle.couleur} size="sm" />}
            {avg !== null && (
              <View style={styles.avgBadge}>
                <Ionicons name="star" size={12} color={Colors.ambreChaud} />
                <Text style={styles.avgText}>{avg.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.favoriteBtn} onPress={handleToggleFavorite} accessibilityLabel={bottle.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
          <Ionicons name={bottle.isFavorite ? 'heart' : 'heart-outline'} size={24} color={bottle.isFavorite ? Colors.rougeAlerte : Colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Alerte urgence ── */}
        {urgent && bottle.quantite > 0 && (
          <View style={styles.urgentBanner}>
            <Ionicons name="time" size={16} color={Colors.rougeAlerte} />
            <Text style={styles.urgentText}>
              À consommer avant {bottle.consommerAvant} — {bottle.quantite} bouteille{bottle.quantite > 1 ? 's' : ''} restante{bottle.quantite > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* ── Identité ── */}
        <InfoCard title="Identité" icon="wine-outline">
          <InfoRow label="Région"      value={bottle.region} />
          <InfoRow label="Appellation" value={bottle.appellation} />
          <InfoRow label="Pays"        value={bottle.pays} />
          <InfoRow label="Cépage(s)"   value={bottle.cepage} />
          <InfoRow label="Format"      value={formatLabel} />
          <InfoRow label="Source"      value={bottle.source} />
        </InfoCard>

        {/* ── Emplacement ── */}
        <InfoCard title="Emplacement" icon="home-outline">
          <InfoRow label="Cave"        value={bottle.cave} />
          <InfoRow label="Emplacement" value={bottle.emplacement} highlight />
          <InfoRow label="Stock"       value={`${bottle.quantite} bouteille${bottle.quantite !== 1 ? 's' : ''}`} highlight />
        </InfoCard>

        {/* ── Achat ── */}
        {(bottle.prixAchat || bottle.lieuAchat || bottle.dateAchat) && (
          <InfoCard title="Achat" icon="cash-outline">
            <InfoRow label="Prix"  value={bottle.prixAchat ? formatPrice(bottle.prixAchat) : undefined} />
            <InfoRow label="Lieu"  value={bottle.lieuAchat} />
            <InfoRow label="Garde" value={bottle.consommerAvant ? `Jusqu'en ${bottle.consommerAvant}` : undefined} />
          </InfoCard>
        )}

        {/* ── Notes de dégustation ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="star-outline" size={16} color={Colors.lieDeVin} />
            <Text style={styles.cardTitle}>Notes de dégustation</Text>
            <TouchableOpacity
              style={styles.addNoteBtn}
              onPress={() => setShowNote(true)}
              accessibilityLabel="Ajouter une note"
            >
              <Ionicons name="add" size={18} color={Colors.lieDeVin} />
            </TouchableOpacity>
          </View>

          {bottle.notes.length === 0
            ? <Text style={styles.emptyNotes}>Aucune note pour l'instant.</Text>
            : bottle.notes.slice().reverse().map(n => (
                <View key={n._id} style={styles.noteRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.noteTop}>
                      <StarRating value={n.note} readonly size={14} />
                      {n.occasion ? <Text style={styles.noteOccasion}>{n.occasion}</Text> : null}
                    </View>
                    {n.texte ? <Text style={styles.noteTexte}>{n.texte}</Text> : null}
                    <Text style={styles.noteDate}>{new Date(n.date).toLocaleDateString('fr-FR')}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteNote(n._id)} accessibilityLabel="Supprimer cette note">
                    <Ionicons name="trash-outline" size={16} color={Colors.brunClair} />
                  </TouchableOpacity>
                </View>
              ))
          }
        </View>

        {/* ── Historique consommation ── */}
        {history.length > 0 && (
          <InfoCard title={`Historique (${history.length} entrées)`} icon="time-outline">
            {history.map(h => (
              <View key={h._id} style={styles.historyRow}>
                <Text style={styles.historyDate}>{new Date(h.date).toLocaleDateString('fr-FR')}</Text>
                <Text style={styles.historyQty}>−{h.quantity}</Text>
                {h.comment ? <Text style={styles.historyComment}>{h.comment}</Text> : null}
              </View>
            ))}
          </InfoCard>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Actions sticky ── */}
      <View style={styles.stickyBar}>
        <Button
          label="Consommer"
          onPress={() => setShowDrink(true)}
          disabled={bottle.quantite === 0}
          style={{ flex: 2 }}
          icon={<Ionicons name="wine" size={16} color={Colors.white} />}
        />
        <Button
          label="Supprimer"
          onPress={handleDelete}
          variant="danger"
          style={{ flex: 1 }}
          icon={<Ionicons name="trash-outline" size={16} color={Colors.white} />}
        />
      </View>

      {/* ── Modal Consommer ── */}
      <Modal visible={showDrink} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Consommer une bouteille</Text>
            <Input label="Nombre de bouteilles" value={drinkQty} onChangeText={setDrinkQty} keyboardType="numeric" />
            <Text style={styles.modalLabel}>Votre appréciation</Text>
            <StarRating value={drinkNote} onChange={setDrinkNote} size={32} />
            <Input label="Commentaire (optionnel)" placeholder="ex : Parfait avec un agneau, un peu fermé…" value={drinkComment} onChangeText={setDrinkComment} multiline numberOfLines={2} style={{ marginTop: Spacing.md }} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.lg }}>
              <Button label="Annuler" variant="secondary" onPress={() => setShowDrink(false)} style={{ flex: 1 }} />
              <Button label="Valider" onPress={handleDrink} loading={drinkLoading} style={{ flex: 2 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal Ajouter note ── */}
      <Modal visible={showNote} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ajouter une note</Text>
            <Text style={styles.modalLabel}>Note *</Text>
            <StarRating value={noteValue} onChange={setNoteValue} size={36} />
            <Input label="Commentaire" placeholder="Arômes, texture, accord…" value={noteTexte} onChangeText={setNoteTexte} multiline numberOfLines={3} style={{ marginTop: Spacing.md }} />
            <Input label="Occasion" placeholder="ex : Repas de famille, apéritif…" value={noteOccasion} onChangeText={setNoteOccasion} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.lg }}>
              <Button label="Annuler" variant="secondary" onPress={() => setShowNote(false)} style={{ flex: 1 }} />
              <Button label="Enregistrer" onPress={handleAddNote} loading={noteLoading} style={{ flex: 2 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const InfoCard = ({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Ionicons name={icon} size={16} color={Colors.lieDeVin} />
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const InfoRow = ({ label, value, highlight }: { label: string; value?: string | null; highlight?: boolean }) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHL]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cremeIvoire },

  gradientHeader: { paddingTop: Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, position: 'relative' },
  backBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  headerContent:  { gap: 4 },
  nom:            { ...Typography.h1, color: Colors.white },
  producteur:     { ...Typography.body, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' },
  annee:          { fontSize: 28, fontWeight: '300', color: 'rgba(255,255,255,0.7)' },
  headerBadges:   { flexDirection: 'row', gap: 8, marginTop: Spacing.sm },
  avgBadge:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  avgText:        { color: Colors.white, fontWeight: '700', fontSize: 13 },
  favoriteBtn:    { position: 'absolute', top: Spacing.md, right: Spacing.lg, padding: Spacing.sm },

  scroll: { padding: Spacing.lg },

  urgentBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.rougeAlerteLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.rougeAlerte + '30' },
  urgentText:   { ...Typography.bodySmall, color: Colors.rougeAlerte, fontWeight: '600', flex: 1 },

  card:       { backgroundColor: Colors.champagne, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.parchemin, ...Shadow.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  cardTitle:  { ...Typography.h4, flex: 1 },
  addNoteBtn: { padding: 4, backgroundColor: Colors.champagne, borderRadius: Radius.full },

  infoRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: Colors.parchemin },
  infoLabel:    { ...Typography.caption, color: Colors.brunClair },
  infoValue:    { ...Typography.bodySmall, color: Colors.brunMoka, maxWidth: '55%', textAlign: 'right' },
  infoValueHL:  { fontWeight: '700', color: Colors.lieDeVin },

  emptyNotes: { ...Typography.bodySmall, color: Colors.brunClair, fontStyle: 'italic', textAlign: 'center', paddingVertical: Spacing.md },
  noteRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 0.5, borderBottomColor: Colors.parchemin },
  noteTop:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  noteOccasion:{ ...Typography.caption, color: Colors.brunMoyen, fontStyle: 'italic' },
  noteTexte:  { ...Typography.bodySmall, color: Colors.brunMoka, marginTop: 4, lineHeight: 18 },
  noteDate:   { ...Typography.caption, color: Colors.brunClair, marginTop: 2 },

  historyRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: Colors.parchemin },
  historyDate:    { ...Typography.caption, color: Colors.brunClair, width: 80 },
  historyQty:     { ...Typography.bodySmall, color: Colors.rougeAlerte, fontWeight: '700', width: 28 },
  historyComment: { ...Typography.caption, color: Colors.brunMoyen, flex: 1, fontStyle: 'italic' },

  stickyBar: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, paddingBottom: Spacing.xl, backgroundColor: Colors.cremeIvoire, borderTopWidth: 1, borderTopColor: Colors.champagne },

  overlay:    { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalCard:  { backgroundColor: Colors.cremeIvoire, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, paddingBottom: 40 },
  modalTitle: { ...Typography.h3, textAlign: 'center', marginBottom: Spacing.xl },
  modalLabel: { ...Typography.bodySmall, fontWeight: '600', color: Colors.brunMoyen, marginBottom: Spacing.sm },
});
