import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Spacing, Radius } from '../../src/constants';
import { COULEURS_VIN, FORMATS_BOUTEILLE, PAYS, REGIONS, APPELLATIONS } from '../../src/constants';
import { useBottleStore, useCavesStore } from '../../src/stores';
import { Input, Button, SelectModal, StarRating } from '../../src/components/ui';
import type { SelectOption } from '../../src/components/ui';
import type { CouleurVin, FormatBouteille } from '../../src/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://cave-a-vin-kwx0.onrender.com';

const STEP_LABELS = ['Identité', 'Détails', 'Cave'];

interface ScanResult {
  nom:         string | null;
  producteur:  string | null;
  annee:       number | null;
  couleur:     string | null;
  region:      string | null;
  appellation: string | null;
  confidence:  number;
  detected:    string[];
  partial:     boolean;
  message:     string;
}

// Options pour selects
const couleurOptions: SelectOption[] = COULEURS_VIN.map(c => ({ label: c, value: c }));
const regionOptions: SelectOption[]  = REGIONS.map(r => ({ label: r, value: r }));
const appellationOptions: SelectOption[] = APPELLATIONS.map(a => ({ label: a, value: a }));
const paysOptions: SelectOption[]    = PAYS.map(p => ({ label: p, value: p }));
const formatOptions: SelectOption[]  = FORMATS_BOUTEILLE.map(f => ({ label: f.label, value: f.value }));

export default function AddScreen() {
  const { addBottle } = useBottleStore();
  const { caves, activeCave, fetchCaves } = useCavesStore();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Scan
  const [permission, requestPermission] = useCameraPermissions();
  const [showScan, setShowScan]         = useState(false);
  const [scanning, setScanning]         = useState(false);
  const [photoUri, setPhotoUri]         = useState<string | null>(null);
  const [scanResult, setScanResult]     = useState<ScanResult | null>(null);
  const [showResult, setShowResult]     = useState(false);
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
  const [notePerso, setNotePerso] = useState(0);

  // Étape 2 — cave
  const [cave, setCave]           = useState('');
  const [emplacement, setEmplacement] = useState('');

  useEffect(() => {
    fetchCaves();
  }, []);

  useEffect(() => {
    if (activeCave && !cave) setCave(activeCave.name);
  }, [activeCave]);

  // Caves avec leur lieu en contexte (ex : "Cave 1 — Lyon")
  const caveOptions: SelectOption[] = caves.map(c => ({
    label: c.location ? `${c.name} — ${c.location}` : c.name,
    value: c.name,
  }));
  const emplacementOptions: SelectOption[] = cave
    ? (caves.find(c => c.name === cave)?.emplacements ?? []).map(e => ({ label: e, value: e }))
    : [];

  // ── Scan étiquette ──
  const openScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) { Alert.alert('Permission caméra refusée'); return; }
    }
    setScanResult(null);
    setShowScan(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current || scanning) return;
    setScanning(true);
    try {
      // Qualité élevée pour meilleure reconnaissance OCR
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.92,
        base64: false,
        exif: false,
      });
      setPhotoUri(photo.uri);
      setShowScan(false);
      await analyzeLabel(photo.uri);
    } catch {
      Alert.alert('Erreur', 'Impossible de prendre la photo.');
    } finally {
      setScanning(false);
    }
  };

  const analyzeLabel = async (uri: string) => {
    setLoading(true);
    try {
      const SecureStore = await import('expo-secure-store');
      const ImageManipulator = await import('expo-image-manipulator');
      const token = await SecureStore.getItemAsync('cave_token');

      // Compression avant envoi : redimensionne à 1000px de large, qualité 0.8
      const compressed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1000 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const formData = new FormData();
      formData.append('image', { uri: compressed.uri, name: 'label.jpg', type: 'image/jpeg' } as any);

      const res = await fetch(API_URL + '/api/bottles/scan-label', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();

      if (res.ok && data) {
        setScanResult(data);
        setShowResult(true);
      } else {
        Alert.alert('Analyse impossible', 'Complétez les informations manuellement.');
      }
    } catch {
      Alert.alert('Analyse impossible', 'Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const applyScanResult = (result: ScanResult) => {
    if (result.nom)         setNom(result.nom);
    if (result.producteur)  setProducteur(result.producteur);
    if (result.annee)       setAnnee(String(result.annee));
    if (result.region)      setRegion(result.region);
    if (result.appellation) setAppellation(result.appellation);
    if (result.couleur)     setCouleur(result.couleur as CouleurVin);
    setShowResult(false);
  };

  // ── Validation ──
  const validateStep = (): boolean => {
    if (step === 0 && !nom.trim()) { Alert.alert('Le nom est obligatoire'); return false; }
    if (step === 1) {
      const q = parseInt(quantite);
      if (isNaN(q) || q < 1) { Alert.alert('Quantité invalide'); return false; }
    }
    if (step === 2 && !cave) { Alert.alert('Cave obligatoire'); return false; }
    // L'emplacement est obligatoire seulement si la cave en propose
    if (step === 2 && emplacementOptions.length > 0 && !emplacement) { Alert.alert('Emplacement obligatoire pour cette cave'); return false; }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };

  const resetForm = () => {
    setStep(0);
    setNom(''); setProducteur(''); setCouleur(''); setAnnee('');
    setRegion(''); setAppellation(''); setPays('France'); setCepage('');
    setQuantite('1'); setFormat(''); setPrixAchat(''); setConsommerAvant('');
    setLieuAchat(''); setDescription(''); setNotePerso(0);
    setCave(''); setEmplacement('');
    setPhotoUri(null); setScanResult(null);
  };

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
        notePerso: notePerso > 0 ? { note: notePerso, texte: '' } : undefined,
        source: 'manual',
        cave, emplacement,
      });
      resetForm();
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
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
        <ScrollView
          contentContainerStyle={s.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >

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
              <View style={s.notePersoRow}>
                <Text style={s.notePersoLabel}>Ma note</Text>
                <StarRating value={notePerso} onChange={setNotePerso} size={28} />
                {notePerso > 0 && (
                  <TouchableOpacity onPress={() => setNotePerso(0)}>
                    <Ionicons name="close-circle-outline" size={18} color={Colors.brunClair} />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* Étape 2 — Cave */}
          {step === 2 && (
            <>
              <SelectModal label="Cave" value={cave} options={caveOptions} onChange={v => { setCave(v); setEmplacement(''); }} placeholder="Choisir une cave" required />
              {/* L'emplacement n'est affiché que si la cave en possède (ex : pas pour Marseillan) */}
              {emplacementOptions.length > 0 && (
                <SelectModal label="Emplacement" value={emplacement} options={emplacementOptions} onChange={setEmplacement} placeholder="Choisir un emplacement" required />
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Actions bas */}
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        {step < 2
          ? <Button label="Continuer" onPress={handleNext} fullWidth icon={<Ionicons name="arrow-forward" size={16} color={Colors.white} />} />
          : <Button label="Ajouter à ma cave" onPress={handleSave} loading={loading} fullWidth icon={<Ionicons name="checkmark" size={16} color={Colors.white} />} />
        }
      </View>

      {/* Overlay analyse en cours */}
      {loading && (
        <View style={scan.loadingOverlay}>
          <View style={scan.loadingCard}>
            <ActivityIndicator color={Colors.lieDeVin} size="large" />
            <Text style={scan.loadingTitle}>Analyse de l'étiquette…</Text>
            <Text style={scan.loadingText}>Extraction des informations en cours</Text>
          </View>
        </View>
      )}

      {/* Modal camera */}
      <Modal visible={showScan} animationType="slide">
        <View style={cam.container}>
          <CameraView ref={cameraRef} style={cam.camera} facing="back">
            <View style={cam.overlay}>
              {/* Fermer */}
              <View style={cam.topBar}>
                <TouchableOpacity style={cam.close} onPress={() => setShowScan(false)}>
                  <Ionicons name="close" size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={cam.topTitle}>Scanner l'étiquette</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Cadre de guidage */}
              <View style={cam.guide}>
                <View style={cam.frameBorder}>
                  {/* Coins décoratifs */}
                  <View style={[cam.corner, cam.cornerTL]} />
                  <View style={[cam.corner, cam.cornerTR]} />
                  <View style={[cam.corner, cam.cornerBL]} />
                  <View style={[cam.corner, cam.cornerBR]} />
                </View>
                <Text style={cam.hint}>Centrez l'étiquette dans le cadre</Text>
                <Text style={cam.hintSub}>La lumière naturelle améliore la reconnaissance</Text>
              </View>

              {/* Déclencheur */}
              <View style={cam.shutterArea}>
                <TouchableOpacity style={cam.shutter} onPress={takePhoto} disabled={scanning} activeOpacity={0.8}>
                  {scanning
                    ? <ActivityIndicator color={Colors.white} size="large" />
                    : <View style={cam.shutterInner} />
                  }
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>

      {/* Modal résultat scan */}
      <Modal visible={showResult} animationType="slide" transparent>
        <View style={scan.backdrop}>
          <View style={scan.sheet}>
            {scanResult && (
              <ScanResultSheet
                result={scanResult}
                photoUri={photoUri}
                onApply={() => applyScanResult(scanResult)}
                onRetry={() => { setShowResult(false); openScan(); }}
                onDismiss={() => setShowResult(false)}
              />
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ── ScanResultSheet ────────────────────────────────────────────────────────────

function ScanResultSheet({ result, photoUri, onApply, onRetry, onDismiss }: {
  result: ScanResult;
  photoUri: string | null;
  onApply: () => void;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const confidenceColor = result.confidence >= 70 ? Colors.vertSauge : result.confidence >= 35 ? Colors.ambreChaud : Colors.rougeAlerte;
  const confidenceBg    = result.confidence >= 70 ? Colors.vertSaugeLight : result.confidence >= 35 ? Colors.ambreChaudLight : Colors.rougeAlerteLight;

  const fields = [
    { key: 'nom',         label: 'Nom du vin',  value: result.nom },
    { key: 'producteur',  label: 'Producteur',  value: result.producteur },
    { key: 'annee',       label: 'Millésime',   value: result.annee ? String(result.annee) : null },
    { key: 'couleur',     label: 'Couleur',     value: result.couleur },
    { key: 'region',      label: 'Région',      value: result.region },
    { key: 'appellation', label: 'Appellation', value: result.appellation },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* En-tête */}
      <View style={scan.sheetHeader}>
        {photoUri && (
          <Image source={{ uri: photoUri }} style={scan.thumb} />
        )}
        <View style={scan.sheetTitles}>
          <Text style={scan.sheetTitle}>Résultat du scan</Text>
          <View style={[scan.confidencePill, { backgroundColor: confidenceBg }]}>
            <Text style={[scan.confidenceText, { color: confidenceColor }]}>
              {result.confidence}% de confiance
            </Text>
          </View>
        </View>
      </View>

      {/* Message contextuel */}
      <View style={[scan.messageBanner, { backgroundColor: confidenceBg, borderColor: confidenceColor + '40' }]}>
        <Ionicons
          name={result.confidence >= 70 ? 'checkmark-circle-outline' : result.confidence >= 35 ? 'alert-circle-outline' : 'close-circle-outline'}
          size={16}
          color={confidenceColor}
        />
        <Text style={[scan.messageText, { color: confidenceColor }]}>{result.message}</Text>
      </View>

      {/* Champs détectés */}
      <Text style={scan.fieldsTitle}>Informations détectées</Text>
      {fields.map(f => (
        <View key={f.key} style={scan.fieldRow}>
          <View style={[scan.fieldCheck, { backgroundColor: f.value ? Colors.vertSaugeLight : Colors.parchemin }]}>
            <Ionicons
              name={f.value ? 'checkmark' : 'remove'}
              size={12}
              color={f.value ? Colors.vertSauge : Colors.brunClair}
            />
          </View>
          <Text style={scan.fieldLabel}>{f.label}</Text>
          <Text style={[scan.fieldValue, !f.value && scan.fieldValueEmpty]} numberOfLines={1}>
            {f.value ?? '—'}
          </Text>
        </View>
      ))}

      {/* Actions */}
      <View style={scan.actions}>
        <TouchableOpacity style={scan.btnPrimary} onPress={onApply} activeOpacity={0.85}>
          <Ionicons name="checkmark" size={16} color={Colors.white} />
          <Text style={scan.btnPrimaryText}>
            {result.confidence >= 35 ? 'Appliquer et vérifier' : 'Remplir quand même'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={scan.btnSecondary} onPress={onRetry} activeOpacity={0.8}>
          <Ionicons name="camera-outline" size={16} color={Colors.lieDeVin} />
          <Text style={scan.btnSecondaryText}>Rescanner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={scan.btnGhost} onPress={onDismiss}>
          <Text style={scan.btnGhostText}>Saisie manuelle</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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

  form:          { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  footer:        { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, backgroundColor: Colors.champagne, borderTopWidth: 1, borderTopColor: Colors.parchemin },
  notePersoRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md, paddingVertical: Spacing.sm },
  notePersoLabel:{ fontSize: 14, fontWeight: '600', color: Colors.brunMoyen, flex: 1 },
});

const cam = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#000' },
  camera:      { flex: 1 },
  overlay:     { flex: 1, justifyContent: 'space-between', backgroundColor: 'transparent' },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: Spacing.lg },
  close:       { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  topTitle:    { fontSize: 16, fontWeight: '700', color: Colors.white },
  guide:       { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxl },
  frameBorder: {
    width: 270, height: 170, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)',
    position: 'relative',
  },
  corner:   { position: 'absolute', width: 24, height: 24, borderColor: Colors.white, borderWidth: 3 },
  cornerTL: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  cornerTR: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  cornerBL: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  hint:        { color: Colors.white, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  hintSub:     { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center' },
  shutterArea: { alignItems: 'center', paddingBottom: 56 },
  shutter:     { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.white },
  shutterInner:{ width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.white },
});

const scan = StyleSheet.create({
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(250,250,248,0.92)', alignItems: 'center', justifyContent: 'center', zIndex: 99 },
  loadingCard:    { alignItems: 'center', gap: Spacing.md, padding: Spacing.xl },
  loadingTitle:   { fontSize: 17, fontWeight: '700', color: Colors.brunMoka },
  loadingText:    { fontSize: 13, color: Colors.brunMoyen },

  backdrop: { flex: 1, backgroundColor: 'rgba(26,16,8,0.5)', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: Colors.champagne, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: Spacing.lg, paddingBottom: 40, paddingTop: Spacing.lg, maxHeight: '90%' },

  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  thumb:        { width: 60, height: 80, borderRadius: Radius.md, backgroundColor: Colors.parchemin },
  sheetTitles:  { flex: 1, gap: 6 },
  sheetTitle:   { fontSize: 18, fontWeight: '800', color: Colors.brunMoka },
  confidencePill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  confidenceText: { fontSize: 12, fontWeight: '700' },

  messageBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1 },
  messageText:   { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },

  fieldsTitle: { fontSize: 12, fontWeight: '700', color: Colors.brunClair, letterSpacing: 0.8, marginBottom: Spacing.sm },
  fieldRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: Colors.parchemin },
  fieldCheck:  { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  fieldLabel:  { width: 90, fontSize: 13, color: Colors.brunMoyen },
  fieldValue:  { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.brunMoka, textAlign: 'right' },
  fieldValueEmpty: { color: Colors.brunClair, fontWeight: '400' },

  actions:         { gap: Spacing.sm, marginTop: Spacing.xl },
  btnPrimary:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.lieDeVin, borderRadius: Radius.full, paddingVertical: 15 },
  btnPrimaryText:  { fontSize: 15, fontWeight: '700', color: Colors.white },
  btnSecondary:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.rougeVinLight, borderRadius: Radius.full, paddingVertical: 14, borderWidth: 1, borderColor: Colors.lieDeVin + '30' },
  btnSecondaryText:{ fontSize: 14, fontWeight: '600', color: Colors.lieDeVin },
  btnGhost:        { alignItems: 'center', paddingVertical: 10 },
  btnGhostText:    { fontSize: 13, color: Colors.brunMoyen },
});
