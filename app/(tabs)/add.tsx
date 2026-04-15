import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../src/constants';
import { CAVES, COULEURS_VIN, FORMATS_BOUTEILLE, PAYS, REGIONS, APPELLATIONS } from '../../src/constants';
import { useBottleStore } from '../../src/stores';
import { Input, Button, SelectModal } from '../../src/components/ui';
import type { SelectOption } from '../../src/components/ui';
import type { CouleurVin, FormatBouteille } from '../../src/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://cave-a-vin-kwx0.onrender.com';

const STEP_LABELS = ['Identité', 'Détails', 'Cave'];

// Options pour selects
const couleurOptions: SelectOption[] = COULEURS_VIN.map(c => ({ label: c, value: c }));
const regionOptions: SelectOption[]  = REGIONS.map(r => ({ label: r, value: r }));
const appellationOptions: SelectOption[] = APPELLATIONS.map(a => ({ label: a, value: a }));
const paysOptions: SelectOption[]    = PAYS.map(p => ({ label: p, value: p }));
const formatOptions: SelectOption[]  = FORMATS_BOUTEILLE.map(f => ({ label: f.label, value: f.value }));

export default function AddScreen() {
  const { addBottle } = useBottleStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Scan
  const [permission, requestPermission] = useCameraPermissions();
  const [showScan, setShowScan]   = useState(false);
  const [scanning, setScanning]   = useState(false);
  const [photoUri, setPhotoUri]   = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  // Étape 0 — identité
  const [nom, setNom]           = useState('');
  const [producteur, setProducteur] = useState('');
  const [couleur, setCouleur]   = useState<CouleurVin | ''>('');
  const [annee, setAnnee]       = useState('');
  const [region, setRegion]     = useState('');
  const [appellation, setAppellation] = useState('');
  const [pays, setPays]         = useState('France');
  const [cepage, setCepage]     = useState('');

  // Étape 1 — détails
  const [quantite, setQuantite] = useState('1');
  const [format, setFormat]     = useState<FormatBouteille | ''>('');
  const [prixAchat, setPrixAchat] = useState('');
  const [consommerAvant, setConsommerAvant] = useState('');
  const [lieuAchat, setLieuAchat] = useState('');
  const [description, setDescription] = useState('');

  // Étape 2 — cave
  const [cave, setCave]           = useState('');
  const [emplacement, setEmplacement] = useState('');

  const caveOptions: SelectOption[] = CAVES.map(c => ({ label: c.name, value: c.name }));
  const emplacementOptions: SelectOption[] = cave
    ? (CAVES.find(c => c.name === cave)?.emplacements ?? []).map(e => ({ label: e, value: e }))
    : [];

  // ── Scan étiquette ──
  const openScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) { Alert.alert('Permission caméra refusée'); return; }
    }
    setShowScan(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current || scanning) return;
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      setPhotoUri(photo.uri);
      setShowScan(false);
      await analyzeLabel(photo.uri);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de prendre la photo.');
    } finally {
      setScanning(false);
    }
  };

  const analyzeLabel = async (uri: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', { uri, name: 'label.jpg', type: 'image/jpeg' } as any);
      const res = await fetch(API_URL + '/bottles/scan-label', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.nom)         setNom(data.nom);
        if (data.producteur)  setProducteur(data.producteur);
        if (data.annee)       setAnnee(String(data.annee));
        if (data.region)      setRegion(data.region);
        if (data.appellation) setAppellation(data.appellation);
        if (data.couleur)     setCouleur(data.couleur);
        Alert.alert('Étiquette analysée', 'Vérifiez et complétez les informations.');
      } else {
        Alert.alert('Non reconnu', 'Complétez les informations manuellement.');
      }
    } catch {
      Alert.alert('Non reconnu', 'Complétez les informations manuellement.');
    } finally {
      setLoading(false);
    }
  };

  // ── Validation ──
  const validateStep = (): boolean => {
    if (step === 0 && !nom.trim()) { Alert.alert('Le nom est obligatoire'); return false; }
    if (step === 1) {
      const q = parseInt(quantite);
      if (isNaN(q) || q < 1) { Alert.alert('Quantité invalide'); return false; }
    }
    if (step === 2 && (!cave || !emplacement)) { Alert.alert('Cave et emplacement obligatoires'); return false; }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };

  const handleSave = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      await addBottle({
        nom: nom.trim(), producteur: producteur.trim() || undefined,
        couleur: (couleur as CouleurVin) || undefined,
        annee: annee ? parseInt(annee) : undefined,
        region: region || undefined, appellation: appellation || undefined,
        pays: pays || undefined, cepage: cepage.trim() || undefined,
        quantite: parseInt(quantite),
        format: (format as FormatBouteille) || undefined,
        prixAchat: prixAchat ? parseFloat(prixAchat) : undefined,
        consommerAvant: consommerAvant ? parseInt(consommerAvant) : undefined,
        lieuAchat: lieuAchat.trim() || undefined,
        source: 'manual',
        cave, emplacement,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => step === 0 ? router.back() : setStep(p => p - 1)} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.brunMoka} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Ajouter une bouteille</Text>
        {step === 0
          ? <TouchableOpacity style={s.scanBtn} onPress={openScan}>
              <Ionicons name="camera-outline" size={20} color={Colors.lieDeVin} />
              <Text style={s.scanBtnText}>Scanner</Text>
            </TouchableOpacity>
          : <View style={{ width: 80 }} />
        }
      </View>

      {/* Stepper */}
      <View style={s.stepperRow}>
        {STEP_LABELS.map((label, i) => (
          <React.Fragment key={i}>
            <View style={s.stepItem}>
              <View style={[s.stepDot, i <= step && s.stepDotActive, i < step && s.stepDotDone]}>
                {i < step
                  ? <Ionicons name="checkmark" size={12} color={Colors.white} />
                  : <Text style={[s.stepNum, i === step && s.stepNumActive]}>{i + 1}</Text>
                }
              </View>
              <Text style={[s.stepLabel, i === step && s.stepLabelActive]}>{label}</Text>
            </View>
            {i < 2 && <View style={[s.stepLine, i < step && s.stepLineDone]} />}
          </React.Fragment>
        ))}
      </View>

      {/* Photo scannée */}
      {photoUri && step === 0 && (
        <View style={s.photoPreview}>
          <Image source={{ uri: photoUri }} style={s.photoThumb} />
          <Text style={s.photoText}>Étiquette scannée — vérifiez les champs</Text>
          <TouchableOpacity onPress={() => setPhotoUri(null)}>
            <Ionicons name="close-circle" size={20} color={Colors.brunClair} />
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">

          {/* Étape 0 — Identité */}
          {step === 0 && (
            <>
              <Input label="Nom du vin" value={nom} onChangeText={setNom} required placeholder="ex : Château Margaux" />
              <Input label="Producteur / Domaine" value={producteur} onChangeText={setProducteur} placeholder="ex : Château Margaux" />
              <SelectModal label="Couleur" value={couleur} options={couleurOptions} onChange={v => setCouleur(v as CouleurVin)} placeholder="Sélectionner" searchable={false} />
              <Input label="Millésime" value={annee} onChangeText={setAnnee} keyboardType="numeric" placeholder="ex : 2019" />
              <SelectModal label="Région" value={region} options={regionOptions} onChange={setRegion} placeholder="Sélectionner" searchable />
              <SelectModal label="Appellation" value={appellation} options={appellationOptions} onChange={setAppellation} placeholder="Sélectionner" searchable />
              <SelectModal label="Pays" value={pays} options={paysOptions} onChange={setPays} placeholder="Sélectionner" searchable />
              <Input label="Cépage(s)" value={cepage} onChangeText={setCepage} placeholder="ex : Cabernet Sauvignon, Merlot" />
            </>
          )}

          {/* Étape 1 — Détails */}
          {step === 1 && (
            <>
              <Input label="Quantité" value={quantite} onChangeText={setQuantite} keyboardType="numeric" required />
              <SelectModal label="Format" value={format} options={formatOptions} onChange={v => setFormat(v as FormatBouteille)} placeholder="Bouteille 75cl" searchable={false} />
              <Input label="Prix d'achat (€)" value={prixAchat} onChangeText={setPrixAchat} keyboardType="decimal-pad" placeholder="ex : 25" />
              <Input label="À consommer avant (année)" value={consommerAvant} onChangeText={setConsommerAvant} keyboardType="numeric" placeholder="ex : 2030" />
              <Input label="Lieu d'achat" value={lieuAchat} onChangeText={setLieuAchat} placeholder="ex : Cave Nicolas, En ligne" />
              <Input label="Notes personnelles" value={description} onChangeText={setDescription} multiline numberOfLines={3} placeholder="Impressions, contexte..." />
            </>
          )}

          {/* Étape 2 — Cave */}
          {step === 2 && (
            <>
              <SelectModal label="Cave" value={cave} options={caveOptions} onChange={v => { setCave(v); setEmplacement(''); }} placeholder="Choisir une cave" required />
              <SelectModal label="Emplacement" value={emplacement} options={emplacementOptions} onChange={setEmplacement} placeholder={cave ? 'Choisir un emplacement' : 'Sélectionnez d\'abord une cave'} required />
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Actions bas */}
      <View style={s.footer}>
        {step < 2
          ? <Button label="Continuer" onPress={handleNext} fullWidth icon={<Ionicons name="arrow-forward" size={16} color={Colors.white} />} />
          : <Button label="Ajouter à ma cave" onPress={handleSave} loading={loading} fullWidth icon={<Ionicons name="checkmark" size={16} color={Colors.white} />} />
        }
      </View>

      {/* Modal camera */}
      <Modal visible={showScan} animationType="slide">
        <View style={cam.container}>
          <CameraView ref={cameraRef} style={cam.camera} facing="back">
            <View style={cam.overlay}>
              <TouchableOpacity style={cam.close} onPress={() => setShowScan(false)}>
                <Ionicons name="close" size={28} color={Colors.white} />
              </TouchableOpacity>
              <View style={cam.guide}>
                <View style={cam.frame} />
                <Text style={cam.hint}>Cadrez l'étiquette de la bouteille</Text>
              </View>
              <TouchableOpacity style={cam.shutter} onPress={takePhoto} disabled={scanning}>
                {scanning
                  ? <ActivityIndicator color={Colors.white} />
                  : <View style={cam.shutterInner} />
                }
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.cremeIvoire },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.parchemin, backgroundColor: Colors.champagne },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.brunMoka },
  scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.rougeVinLight, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: Colors.lieDeVin + '40' },
  scanBtnText: { fontSize: 13, fontWeight: '700', color: Colors.lieDeVin },

  stepperRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, backgroundColor: Colors.champagne, borderBottomWidth: 1, borderBottomColor: Colors.parchemin },
  stepItem:    { alignItems: 'center', gap: 4 },
  stepDot:     { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },
  stepDotActive:{ backgroundColor: Colors.lieDeVin },
  stepDotDone: { backgroundColor: Colors.vertSauge },
  stepNum:     { fontSize: 11, fontWeight: '700', color: Colors.brunClair },
  stepNumActive:{ color: Colors.white },
  stepLabel:   { fontSize: 10, color: Colors.brunClair, fontWeight: '500' },
  stepLabelActive: { color: Colors.lieDeVin, fontWeight: '700' },
  stepLine:    { flex: 1, height: 1, backgroundColor: Colors.parchemin, marginBottom: 14 },
  stepLineDone:{ backgroundColor: Colors.vertSauge },

  photoPreview: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, margin: Spacing.lg, padding: Spacing.sm, backgroundColor: Colors.blancDoreLight, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.ambreChaud + '40' },
  photoThumb:   { width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: Colors.parchemin },
  photoText:    { flex: 1, fontSize: 12, color: Colors.ambreChaud, fontWeight: '600' },

  form:    { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  footer:  { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, paddingBottom: Spacing.xl, backgroundColor: Colors.champagne, borderTopWidth: 1, borderTopColor: Colors.parchemin },
});

const cam = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera:    { flex: 1 },
  overlay:   { flex: 1, justifyContent: 'space-between', paddingVertical: 50, paddingHorizontal: Spacing.lg },
  close:     { alignSelf: 'flex-end', padding: Spacing.sm },
  guide:     { alignItems: 'center', gap: Spacing.lg },
  frame: {
    width: 260, height: 160, borderRadius: Radius.lg,
    borderWidth: 2, borderColor: Colors.white,
    borderStyle: 'dashed',
  },
  hint:       { color: Colors.white, fontSize: 14, fontWeight: '600', textAlign: 'center', opacity: 0.85 },
  shutter:    { alignSelf: 'center', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.white },
  shutterInner:{ width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.white },
});
