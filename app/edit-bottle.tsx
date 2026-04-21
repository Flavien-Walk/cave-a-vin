import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../src/constants';
import { COULEURS_VIN, FORMATS_BOUTEILLE, PAYS, REGIONS, APPELLATIONS } from '../src/constants';
import { useBottleStore, useCavesStore } from '../src/stores';
import { Input, Button, SelectModal } from '../src/components/ui';
import type { SelectOption } from '../src/components/ui';
import type { CouleurVin, FormatBouteille } from '../src/types';
import { bottlesApi } from '../src/api';
import type { Bottle } from '../src/types';

const couleurOptions: SelectOption[] = COULEURS_VIN.map(c => ({ label: c, value: c }));
const regionOptions: SelectOption[]  = REGIONS.map(r => ({ label: r, value: r }));
const appellationOptions: SelectOption[] = APPELLATIONS.map(a => ({ label: a, value: a }));
const paysOptions: SelectOption[]    = PAYS.map(p => ({ label: p, value: p }));
const formatOptions: SelectOption[]  = FORMATS_BOUTEILLE.map(f => ({ label: f.label, value: f.value }));

export default function EditBottleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottles, updateBottle } = useBottleStore();
  const { caves, fetchCaves } = useCavesStore();

  const storeBottle = bottles.find(b => b._id === id);
  const [loading, setLoading] = useState(!storeBottle);
  const [saving,  setSaving]  = useState(false);

  const [nom,           setNom]           = useState(storeBottle?.nom ?? '');
  const [producteur,    setProducteur]    = useState(storeBottle?.producteur ?? '');
  const [couleur,       setCouleur]       = useState<CouleurVin | ''>(storeBottle?.couleur ?? '');
  const [annee,         setAnnee]         = useState(storeBottle?.annee ? String(storeBottle.annee) : '');
  const [region,        setRegion]        = useState(storeBottle?.region ?? '');
  const [appellation,   setAppellation]   = useState(storeBottle?.appellation ?? '');
  const [pays,          setPays]          = useState(storeBottle?.pays ?? 'France');
  const [cepage,        setCepage]        = useState(storeBottle?.cepage ?? '');
  const [quantite,      setQuantite]      = useState(storeBottle ? String(storeBottle.quantite) : '1');
  const [format,        setFormat]        = useState<FormatBouteille | ''>(storeBottle?.format ?? '');
  const [prixAchat,     setPrixAchat]     = useState(storeBottle?.prixAchat ? String(storeBottle.prixAchat) : '');
  const [consommerAvant,setConsommerAvant]= useState(storeBottle?.consommerAvant ? String(storeBottle.consommerAvant) : '');
  const [lieuAchat,     setLieuAchat]     = useState(storeBottle?.lieuAchat ?? '');
  const [cave,          setCave]          = useState(storeBottle?.cave ?? '');
  const [emplacement,   setEmplacement]   = useState(storeBottle?.emplacement ?? '');

  useEffect(() => { fetchCaves(); }, []);

  useEffect(() => {
    if (!storeBottle && id) {
      bottlesApi.getOne(id)
        .then((b: Bottle) => {
          setNom(b.nom ?? '');
          setProducteur(b.producteur ?? '');
          setCouleur((b.couleur ?? '') as CouleurVin | '');
          setAnnee(b.annee ? String(b.annee) : '');
          setRegion(b.region ?? '');
          setAppellation(b.appellation ?? '');
          setPays(b.pays ?? 'France');
          setCepage(b.cepage ?? '');
          setQuantite(String(b.quantite ?? 1));
          setFormat((b.format ?? '') as FormatBouteille | '');
          setPrixAchat(b.prixAchat ? String(b.prixAchat) : '');
          setConsommerAvant(b.consommerAvant ? String(b.consommerAvant) : '');
          setLieuAchat(b.lieuAchat ?? '');
          setCave(b.cave ?? '');
          setEmplacement(b.emplacement ?? '');
        })
        .catch(() => {
          Alert.alert('Erreur', 'Impossible de charger la bouteille.');
          router.back();
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const caveOptions: SelectOption[] = caves.map(c => ({
    label: c.location ? `${c.name} — ${c.location}` : c.name,
    value: c.name,
  }));

  const emplacementOptions: SelectOption[] = cave
    ? (caves.find(c => c.name === cave)?.emplacements ?? []).map(e => ({ label: e, value: e }))
    : [];

  const handleSave = async () => {
    if (!nom.trim()) { Alert.alert('Le nom est obligatoire'); return; }
    const qty = parseInt(quantite);
    if (isNaN(qty) || qty < 0) { Alert.alert('Quantité invalide'); return; }
    if (!cave) { Alert.alert('Cave obligatoire'); return; }
    if (emplacementOptions.length > 0 && !emplacement) { Alert.alert('Emplacement obligatoire pour cette cave'); return; }

    setSaving(true);
    try {
      await updateBottle(id!, {
        nom:           nom.trim(),
        producteur:    producteur.trim() || undefined,
        couleur:       (couleur as CouleurVin) || undefined,
        annee:         annee ? parseInt(annee) : undefined,
        region:        region || undefined,
        appellation:   appellation || undefined,
        pays:          pays || undefined,
        cepage:        cepage.trim() || undefined,
        quantite:      qty,
        format:        (format as FormatBouteille) || undefined,
        prixAchat:     prixAchat ? parseFloat(prixAchat) : undefined,
        consommerAvant:consommerAvant ? parseInt(consommerAvant) : undefined,
        lieuAchat:     lieuAchat.trim() || undefined,
        cave,
        emplacement,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ActivityIndicator color={Colors.lieDeVin} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.brunMoka} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{nom || 'Modifier la bouteille'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          <Text style={s.sectionLabel}>Identité</Text>
          <Input label="Nom du vin" value={nom} onChangeText={setNom} required placeholder="ex : Château Margaux" />
          <Input label="Producteur / Domaine" value={producteur} onChangeText={setProducteur} placeholder="ex : Château Margaux" />
          <SelectModal label="Couleur" value={couleur} options={couleurOptions} onChange={v => setCouleur(v as CouleurVin)} placeholder="Sélectionner" searchable={false} />
          <Input label="Millésime" value={annee} onChangeText={setAnnee} keyboardType="numeric" placeholder="ex : 2019" />
          <SelectModal label="Région" value={region} options={regionOptions} onChange={setRegion} placeholder="Sélectionner" searchable />
          <SelectModal label="Appellation" value={appellation} options={appellationOptions} onChange={setAppellation} placeholder="Sélectionner" searchable />
          <SelectModal label="Pays" value={pays} options={paysOptions} onChange={setPays} placeholder="Sélectionner" searchable />
          <Input label="Cépage(s)" value={cepage} onChangeText={setCepage} placeholder="ex : Cabernet Sauvignon, Merlot" />

          <Text style={[s.sectionLabel, { marginTop: Spacing.lg }]}>Détails</Text>
          <Input label="Quantité" value={quantite} onChangeText={setQuantite} keyboardType="numeric" required />
          <SelectModal label="Format" value={format} options={formatOptions} onChange={v => setFormat(v as FormatBouteille)} placeholder="Bouteille 75cl" searchable={false} />
          <Input label="Prix d'achat (€)" value={prixAchat} onChangeText={setPrixAchat} keyboardType="decimal-pad" placeholder="ex : 25" />
          <Input label="À consommer avant (année)" value={consommerAvant} onChangeText={setConsommerAvant} keyboardType="numeric" placeholder="ex : 2030" />
          <Input label="Lieu d'achat" value={lieuAchat} onChangeText={setLieuAchat} placeholder="ex : Cave Nicolas, En ligne" />

          <Text style={[s.sectionLabel, { marginTop: Spacing.lg }]}>Cave</Text>
          <SelectModal
            label="Cave"
            value={cave}
            options={caveOptions}
            onChange={v => { setCave(v); setEmplacement(''); }}
            placeholder="Choisir une cave"
            required
          />
          {emplacementOptions.length > 0 && (
            <SelectModal
              label="Emplacement"
              value={emplacement}
              options={emplacementOptions}
              onChange={setEmplacement}
              placeholder="Choisir un emplacement"
            />
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={s.footer}>
          <Button
            label="Enregistrer les modifications"
            onPress={handleSave}
            loading={saving}
            fullWidth
            icon={<Ionicons name="checkmark" size={16} color={Colors.white} />}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.cremeIvoire },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.parchemin, backgroundColor: Colors.champagne },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.brunMoka, textAlign: 'center', marginHorizontal: Spacing.sm },
  form:        { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  sectionLabel:{ fontSize: 11, fontWeight: '800', color: Colors.lieDeVin, letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.md },
  footer:      { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md, backgroundColor: Colors.champagne, borderTopWidth: 1, borderTopColor: Colors.parchemin },
});
