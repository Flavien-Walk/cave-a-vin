import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Spacing, Radius, API_URL } from '../../src/constants';
import { COULEURS_VIN, FORMATS_BOUTEILLE, PAYS, REGIONS, APPELLATIONS } from '../../src/constants';
import { useBottleStore, useCavesStore } from '../../src/stores';
import { Input, Button, SelectModal, StarRating } from '../../src/components/ui';
import { normalizeWineStr } from '../../src/utils/recommendation';
import type { SelectOption } from '../../src/components/ui';
import type { CouleurVin, FormatBouteille } from '../../src/types';

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

const couleurOptions: SelectOption[] = COULEURS_VIN.map(c => ({ label: c, value: c }));
const regionOptions:  SelectOption[] = REGIONS.map(r => ({ label: r, value: r }));
const appellationOptions: SelectOption[] = APPELLATIONS.map(a => ({ label: a, value: a }));
const paysOptions:    SelectOption[] = PAYS.map(p => ({ label: p, value: p }));
const formatOptions:  SelectOption[] = FORMATS_BOUTEILLE.map(f => ({ label: f.label, value: f.value }));

export default function AddScreen() {
  const { addBottle, bottles, localPhotos } = useBottleStore();
  const { caves, activeCave, activeLieu, fetchCaves } = useCavesStore();
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [cavesLoaded, setCavesLoaded] = useState(false);

  // Caméra
  const [permission, requestPermission] = useCameraPermissions();
  const [showScan, setShowScan]   = useState(false);
  const [scanning, setScanning]   = useState(false);
  const [analyzeMode, setAnalyzeMode] = useState(true); // true = scan+OCR, false = photo seule
  const [photoUri, setPhotoUri]   = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const cameraRef = useRef<any>(null);

  // Étape 0 — identité
  const [nom, setNom]               = useState('');
  const [producteur, setProducteur] = useState('');
  const [couleur, setCouleur]       = useState<CouleurVin | ''>('');
  const [annee, setAnnee]           = useState('');
  const [region, setRegion]         = useState('');
  const [appellation, setAppellation] = useState('');
  const [pays, setPays]             = useState('France');
  const [cepage, setCepage]         = useState('');

  // Étape 1 — détails
  const [quantite, setQuantite]     = useState('1');
  const [format, setFormat]         = useState<FormatBouteille | ''>('');
  const [prixAchat, setPrixAchat]   = useState('');
  const [consommerAvant, setConsommerAvant] = useState('');
  const [lieuAchat, setLieuAchat]   = useState('');
  const [description, setDescription] = useState('');
  const [notePerso, setNotePerso]   = useState(0);

  // Étape 2 — cave
  const [cave, setCave]             = useState('');
  const [emplacement, setEmplacement] = useState('');

  // Suggestion bouteille similaire (métadonnées + photo)
  const [suggestedBottleId, setSuggestedBottleId] = useState<string | null>(null);

  // Autocomplete : suggestions de vins existants
  const [suggestions, setSuggestions]       = useState<typeof bottles>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchCaves().finally(() => setCavesLoaded(true));
  }, []);

  const normalizeFormat = (value?: string) => normalizeWineStr(value ?? '');

  // Autocomplete : chercher parmi les bouteilles existantes
  useEffect(() => {
    const normQuery = normalizeWineStr(nom);
    if (normQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    // Dédupliquer par identité produit logique (nom + année + format + producteur)
    const seen = new Set<string>();
    const matches = bottles.filter(b => {
      const normNom = normalizeWineStr(b.nom);
      if (!normNom.includes(normQuery)) return false;
      const key =
        normNom +
        '\0' +
        String(b.annee ?? '') +
        '\0' +
        normalizeFormat(b.format) +
        '\0' +
        normalizeWineStr(b.producteur);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 6);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0 && !photoUri);
  }, [nom, bottles, photoUri]);

  useEffect(() => {
    if (activeCave && !cave) setCave(activeCave.name);
  }, [activeCave]);

  const similarSuggestion = useMemo(() => {
    const normNom = normalizeWineStr(nom);
    if (normNom.length < 3) return null;

    const normProd = normalizeWineStr(producteur);
    const typedYear = annee ? parseInt(annee, 10) : NaN;
    const typedFormat = normalizeFormat(format);
    const normRegion = normalizeWineStr(region);
    const normApp = normalizeWineStr(appellation);
    const normCepage = normalizeWineStr(cepage);

    const scored = bottles.map(b => {
      const bNom = normalizeWineStr(b.nom);
      if (!bNom) return { bottle: b, score: -1 };

      let score = 0;
      const exactName = bNom === normNom;
      const closeName = !exactName && (bNom.includes(normNom) || normNom.includes(bNom));
      if (exactName) score += 55;
      else if (closeName) score += 35;
      else return { bottle: b, score: -1 };

      const bProd = normalizeWineStr(b.producteur);
      if (normProd && bProd) {
        if (normProd === bProd) score += 20;
        else if (normProd.includes(bProd) || bProd.includes(normProd)) score += 10;
        else score -= 10;
      }

      if (!Number.isNaN(typedYear) && b.annee) {
        const yearDelta = Math.abs(b.annee - typedYear);
        if (yearDelta === 0) score += 20;
        else if (yearDelta <= 2) score += 10;
        else score -= 15;
      } else if (b.annee) {
        score += 4;
      }

      const bFormat = normalizeFormat(b.format);
      if (typedFormat && bFormat) {
        if (typedFormat === bFormat) score += 18;
        else score -= 18;
      } else if (bFormat) {
        score += 3;
      }

      if (normRegion && normalizeWineStr(b.region) === normRegion) score += 6;
      if (normApp && normalizeWineStr(b.appellation) === normApp) score += 6;
      if (normCepage && normalizeWineStr(b.cepage) === normCepage) score += 4;

      const reusablePhoto = localPhotos[b._id] ?? b.photoUrl ?? null;
      if (reusablePhoto) score += 4;

      return { bottle: b, score, reusablePhoto };
    })
      .filter(x => x.score >= 60)
      .sort((a, b) => b.score - a.score);

    if (!scored.length) return null;
    const best = scored[0];
    return {
      bottle: best.bottle,
      score: best.score,
      reusablePhoto: best.reusablePhoto ?? null,
    };
  }, [nom, producteur, annee, format, region, appellation, cepage, bottles, localPhotos]);

  useEffect(() => {
    if (!similarSuggestion) {
      setSuggestedBottleId(null);
      return;
    }
    if (suggestedBottleId === null || suggestedBottleId !== similarSuggestion.bottle._id) {
      setSuggestedBottleId(similarSuggestion.bottle._id);
    }
  }, [similarSuggestion, suggestedBottleId]);

  // Pré-remplir le formulaire depuis une bouteille existante sélectionnée
  const applySuggestion = (b: typeof bottles[number]) => {
    setNom(b.nom ?? '');
    setProducteur(b.producteur ?? '');
    setCouleur((b.couleur ?? '') as CouleurVin | '');
    setAnnee(b.annee ? String(b.annee) : '');
    setFormat((b.format as FormatBouteille) ?? '');
    setRegion(b.region ?? '');
    setAppellation(b.appellation ?? '');
    setPays(b.pays ?? 'France');
    setCepage(b.cepage ?? '');
    // Réutiliser la photo locale sinon la photo backend déjà liée à la bouteille
    const existingPhoto = localPhotos[b._id] ?? b.photoUrl ?? null;
    if (existingPhoto && !photoUri) setPhotoUri(existingPhoto);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const filteredCaves = activeLieu ? caves.filter(c => c.location === activeLieu) : caves;
  const caveOptions: SelectOption[] = filteredCaves.map(c => ({
    label: c.location ? `${c.name} — ${c.location}` : c.name,
    value: c.name,
  }));
  const emplacementOptions: SelectOption[] = cave
    ? (caves.find(c => c.name === cave)?.emplacements ?? []).map(e => ({ label: e, value: e }))
    : [];

  // ── Caméra ──────────────────────────────────────────────────────────────────

  const openCamera = async (analyze: boolean) => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) { Alert.alert('Permission refusée', 'Autorisez l\'accès à la caméra dans les réglages.'); return; }
    }
    setScanResult(null);
    setAnalyzeMode(analyze);
    setShowScan(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current || scanning) return;
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.92, base64: false, exif: false });
      setPhotoUri(photo.uri);
      setShowScan(false);
      if (analyzeMode) await analyzeLabel(photo.uri);
    } catch {
      Alert.alert('Erreur', 'Impossible de prendre la photo.');
    } finally {
      setScanning(false);
    }
  };

  const analyzeLabel = async (uri: string) => {
    setLoading(true);
    try {
      const SecureStore      = await import('expo-secure-store');
      const ImageManipulator = await import('expo-image-manipulator');
      const token = await SecureStore.getItemAsync('cave_token');
      const compressed = await ImageManipulator.manipulateAsync(
        uri, [{ resize: { width: 1000 } }], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      const formData = new FormData();
      formData.append('image', { uri: compressed.uri, name: 'label.jpg', type: 'image/jpeg' } as any);
      const res  = await fetch(API_URL + '/api/bottles/scan-label', {
        method: 'POST', body: formData,
        headers: { 'Content-Type': 'multipart/form-data', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (res.ok && data) { setScanResult(data); setShowResult(true); }
      else Alert.alert('Analyse impossible', 'Complétez les informations manuellement.');
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

  // ── Validation ───────────────────────────────────────────────────────────────

  const validateStep = (): boolean => {
    if (step === 0 && !photoUri) {
      Alert.alert('Photo obligatoire', 'Ajoutez une photo de la bouteille pour continuer.');
      return false;
    }
    if (step === 0 && !nom.trim()) { Alert.alert('Nom obligatoire'); return false; }
    if (step === 1) {
      const q = parseInt(quantite);
      if (isNaN(q) || q < 1) { Alert.alert('Quantité invalide'); return false; }
    }
    if (step === 2 && !cave) { Alert.alert('Cave obligatoire'); return false; }
    if (step === 2 && emplacementOptions.length > 0 && !emplacement) {
      Alert.alert('Emplacement obligatoire pour cette cave'); return false;
    }
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
    setPhotoUri(null); setScanResult(null); setSuggestedBottleId(null);
    setSuggestions([]); setShowSuggestions(false);
  };

  const applySimilarBottle = () => {
    if (!similarSuggestion) return;
    const b = similarSuggestion.bottle;
    setNom(b.nom ?? '');
    setProducteur(b.producteur ?? '');
    setCouleur((b.couleur as CouleurVin) ?? '');
    setAnnee(b.annee ? String(b.annee) : '');
    setFormat((b.format as FormatBouteille) ?? '');
    setRegion(b.region ?? '');
    setAppellation(b.appellation ?? '');
    setPays(b.pays ?? 'France');
    setCepage(b.cepage ?? '');
    if (!photoUri && similarSuggestion.reusablePhoto) {
      setPhotoUri(similarSuggestion.reusablePhoto);
    }
    setSuggestedBottleId(b._id);
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
        source: 'manual', cave, emplacement,
      }, photoUri ?? undefined);
      resetForm();
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Guard : aucune cave ──────────────────────────────────────────────────────

  if (cavesLoaded && caves.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.brunMoka} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Ajouter une bouteille</Text>
          <View style={{ width: 80 }} />
        </View>
        <View style={s.noCaveContainer}>
          <View style={s.noCaveIcon}>
            <Ionicons name="home-outline" size={40} color={Colors.lieDeVin} />
          </View>
          <Text style={s.noCaveTitle}>Aucune cave créée</Text>
          <Text style={s.noCaveText}>
            Vous devez d'abord créer une cave pour pouvoir y stocker des bouteilles.
          </Text>
          <TouchableOpacity style={s.noCaveBtn} onPress={() => router.push('/manage-caves' as any)} activeOpacity={0.8}>
            <Ionicons name="add" size={16} color={Colors.white} />
            <Text style={s.noCaveBtnText}>Créer ma première cave</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Rendu formulaire ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => step === 0 ? router.back() : setStep(p => p - 1)} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.brunMoka} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Ajouter une bouteille</Text>
        <View style={s.headerRightSlot}>
          {step > 0 && <Text style={s.stepBackHint}>Retour étape</Text>}
        </View>
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >

          {/* ── Étape 0 — Identité ── */}
          {step === 0 && (
            <>
              {/* Bloc photo — obligatoire — en haut */}
              {!photoUri ? (
                <View style={s.photoCta}>
                  <Text style={s.photoCtaLabel}>Photo obligatoire</Text>
                  <View style={s.photoCtaRow}>
                    <TouchableOpacity style={s.photoCtaBtn} onPress={() => openCamera(true)} activeOpacity={0.8}>
                      <Ionicons name="scan-outline" size={24} color={Colors.lieDeVin} />
                      <Text style={s.photoCtaBtnText}>Scanner l'étiquette</Text>
                      <Text style={s.photoCtaBtnSub}>Remplit les champs auto</Text>
                    </TouchableOpacity>
                    <View style={s.photoCtaDivider} />
                    <TouchableOpacity style={s.photoCtaBtn} onPress={() => openCamera(false)} activeOpacity={0.8}>
                      <Ionicons name="camera-outline" size={24} color={Colors.lieDeVin} />
                      <Text style={s.photoCtaBtnText}>Prendre une photo</Text>
                      <Text style={s.photoCtaBtnSub}>Saisie manuelle des champs</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={s.photoConfirmed}>
                  <Image source={{ uri: photoUri }} style={s.photoConfirmedThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.photoConfirmedTitle}>Photo ajoutée</Text>
                    <Text style={s.photoConfirmedSub}>Vérifiez et complétez les champs</Text>
                  </View>
                  <View style={s.photoConfirmedActions}>
                    <TouchableOpacity onPress={() => openCamera(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="scan-outline" size={20} color={Colors.lieDeVin} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openCamera(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="camera-outline" size={20} color={Colors.lieDeVin} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setPhotoUri(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle-outline" size={20} color={Colors.rougeAlerte} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <Input
                label="Nom du vin"
                value={nom}
                onChangeText={v => { setNom(v); }}
                required
                placeholder="ex : Château du Barry"
              />

              {/* ── Autocomplete suggestions ── */}
              {showSuggestions && suggestions.length > 0 && (
                <View style={s.suggestBox}>
                  <Text style={s.suggestTitle}>Vins existants dans votre cave</Text>
                  {suggestions.map(b => (
                    <TouchableOpacity
                      key={b._id}
                      style={s.suggestRow}
                      onPress={() => applySuggestion(b)}
                      activeOpacity={0.75}
                    >
                      {localPhotos[b._id] && (
                        <Image source={{ uri: localPhotos[b._id] }} style={s.suggestThumb} />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={s.suggestNom} numberOfLines={1}>{b.nom}</Text>
                        <Text style={s.suggestSub} numberOfLines={1}>
                          {[b.producteur, b.couleur, b.annee, b.format].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                      <View style={s.suggestFill}>
                        <Ionicons name="arrow-forward" size={13} color={Colors.lieDeVin} />
                        <Text style={s.suggestFillText}>Utiliser</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={s.suggestDismiss} onPress={() => setShowSuggestions(false)}>
                    <Text style={s.suggestDismissText}>Ignorer les suggestions</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Input label="Producteur / Domaine" value={producteur} onChangeText={setProducteur} placeholder="ex : Château du Barry" />

              {/* Suggestion bouteille similaire */}
              {similarSuggestion && (
                <View style={s.photoSuggestion}>
                  {similarSuggestion.reusablePhoto ? (
                    <Image source={{ uri: similarSuggestion.reusablePhoto }} style={s.photoSuggThumb} />
                  ) : (
                    <View style={s.photoSuggThumbFallback}>
                      <Ionicons name="wine-outline" size={16} color={Colors.ambreChaud} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.photoSuggText} numberOfLines={2}>
                      Bouteille similaire trouvée : « {similarSuggestion.bottle.nom} »
                    </Text>
                    <Text style={s.photoSuggSub}>
                      Correspondance {similarSuggestion.score}% · pré-remplissage + photo
                    </Text>
                  </View>
                  <TouchableOpacity style={s.photoSuggBtn} onPress={applySimilarBottle}>
                    <Text style={s.photoSuggBtnText}>
                      {suggestedBottleId === similarSuggestion.bottle._id ? 'Appliqué' : 'Utiliser'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <SelectModal label="Couleur" value={couleur} options={couleurOptions} onChange={v => setCouleur(v as CouleurVin)} placeholder="Sélectionner" searchable={false} />
              <Input label="Millésime" value={annee} onChangeText={setAnnee} keyboardType="numeric" placeholder="ex : 2019" />
              <SelectModal label="Région" value={region} options={regionOptions} onChange={setRegion} placeholder="Sélectionner" searchable />
              <SelectModal label="Appellation" value={appellation} options={appellationOptions} onChange={setAppellation} placeholder="Sélectionner" searchable />
              <SelectModal label="Pays" value={pays} options={paysOptions} onChange={setPays} placeholder="Sélectionner" searchable />
              <Input label="Cépage(s)" value={cepage} onChangeText={setCepage} placeholder="ex : Cabernet Sauvignon, Merlot" />
            </>
          )}

          {/* ── Étape 1 — Détails ── */}
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

          {/* ── Étape 2 — Cave ── */}
          {step === 2 && (
            <>
              <SelectModal label="Cave" value={cave} options={caveOptions} onChange={v => { setCave(v); setEmplacement(''); }} placeholder="Choisir une cave" required />
              {emplacementOptions.length > 0 && (
                <SelectModal label="Emplacement" value={emplacement} options={emplacementOptions} onChange={setEmplacement} placeholder="Choisir un emplacement" required />
              )}
            </>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={s.footer}>
          {step < 2
            ? <Button label="Continuer" onPress={handleNext} fullWidth icon={<Ionicons name="arrow-forward" size={16} color={Colors.white} />} />
            : <Button label="Ajouter à ma cave" onPress={handleSave} loading={loading} fullWidth icon={<Ionicons name="checkmark" size={16} color={Colors.white} />} />
          }
        </View>
      </KeyboardAvoidingView>

      {/* Overlay analyse OCR */}
      {loading && (
        <View style={scan.loadingOverlay}>
          <View style={scan.loadingCard}>
            <ActivityIndicator color={Colors.lieDeVin} size="large" />
            <Text style={scan.loadingTitle}>Analyse de l'étiquette…</Text>
            <Text style={scan.loadingText}>Extraction des informations en cours</Text>
          </View>
        </View>
      )}

      {/* Modal caméra */}
      <Modal visible={showScan} animationType="slide">
        <View style={cam.container}>
          <CameraView ref={cameraRef} style={cam.camera} facing="back">
            <View style={cam.overlay}>
              <View style={cam.topBar}>
                <TouchableOpacity style={cam.close} onPress={() => setShowScan(false)}>
                  <Ionicons name="close" size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={cam.topTitle}>{analyzeMode ? 'Scanner l\'étiquette' : 'Photo de la bouteille'}</Text>
                <View style={{ width: 40 }} />
              </View>
              {analyzeMode && (
                <View style={cam.guide}>
                  <View style={cam.frameBorder}>
                    <View style={[cam.corner, cam.cornerTL]} />
                    <View style={[cam.corner, cam.cornerTR]} />
                    <View style={[cam.corner, cam.cornerBL]} />
                    <View style={[cam.corner, cam.cornerBR]} />
                  </View>
                  <Text style={cam.hint}>Centrez l'étiquette dans le cadre</Text>
                  <Text style={cam.hintSub}>La lumière naturelle améliore la reconnaissance</Text>
                </View>
              )}
              <View style={[cam.shutterArea, !analyzeMode && { flex: 1, justifyContent: 'flex-end', paddingBottom: 56 }]}>
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
                onRetry={() => { setShowResult(false); openCamera(true); }}
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
  result: ScanResult; photoUri: string | null;
  onApply: () => void; onRetry: () => void; onDismiss: () => void;
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
      <View style={scan.sheetHeader}>
        {photoUri && <Image source={{ uri: photoUri }} style={scan.thumb} />}
        <View style={scan.sheetTitles}>
          <Text style={scan.sheetTitle}>Résultat du scan</Text>
          <View style={[scan.confidencePill, { backgroundColor: confidenceBg }]}>
            <Text style={[scan.confidenceText, { color: confidenceColor }]}>{result.confidence}% de confiance</Text>
          </View>
        </View>
      </View>
      <View style={[scan.messageBanner, { backgroundColor: confidenceBg, borderColor: confidenceColor + '40' }]}>
        <Ionicons name={result.confidence >= 70 ? 'checkmark-circle-outline' : result.confidence >= 35 ? 'alert-circle-outline' : 'close-circle-outline'} size={16} color={confidenceColor} />
        <Text style={[scan.messageText, { color: confidenceColor }]}>{result.message}</Text>
      </View>
      <Text style={scan.fieldsTitle}>Informations détectées</Text>
      {fields.map(f => (
        <View key={f.key} style={scan.fieldRow}>
          <View style={[scan.fieldCheck, { backgroundColor: f.value ? Colors.vertSaugeLight : Colors.parchemin }]}>
            <Ionicons name={f.value ? 'checkmark' : 'remove'} size={12} color={f.value ? Colors.vertSauge : Colors.brunClair} />
          </View>
          <Text style={scan.fieldLabel}>{f.label}</Text>
          <Text style={[scan.fieldValue, !f.value && scan.fieldValueEmpty]} numberOfLines={1}>{f.value ?? '—'}</Text>
        </View>
      ))}
      <View style={scan.actions}>
        <TouchableOpacity style={scan.btnPrimary} onPress={onApply} activeOpacity={0.85}>
          <Ionicons name="checkmark" size={16} color={Colors.white} />
          <Text style={scan.btnPrimaryText}>{result.confidence >= 35 ? 'Appliquer et vérifier' : 'Remplir quand même'}</Text>
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

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.cremeIvoire },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.parchemin, backgroundColor: Colors.champagne },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.brunMoka },
  headerRightSlot: { width: 84, alignItems: 'flex-end' },
  stepBackHint: { fontSize: 11, fontWeight: '600', color: Colors.brunClair },
  stepperRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, backgroundColor: Colors.champagne, borderBottomWidth: 1, borderBottomColor: Colors.parchemin },
  stepItem:        { alignItems: 'center', gap: 4 },
  stepDot:         { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },
  stepDotActive:   { backgroundColor: Colors.lieDeVin },
  stepDotDone:     { backgroundColor: Colors.vertSauge },
  stepNum:         { fontSize: 11, fontWeight: '700', color: Colors.brunClair },
  stepNumActive:   { color: Colors.white },
  stepLabel:       { fontSize: 10, color: Colors.brunClair, fontWeight: '500' },
  stepLabelActive: { color: Colors.lieDeVin, fontWeight: '700' },
  stepLine:        { flex: 1, height: 1, backgroundColor: Colors.parchemin, marginBottom: 14 },
  stepLineDone:    { backgroundColor: Colors.vertSauge },

  // Bloc photo CTA (aucune photo)
  photoCta:       { backgroundColor: Colors.champagne, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.lieDeVin + '30', marginBottom: Spacing.lg, overflow: 'hidden' },
  photoCtaLabel:  { fontSize: 10, fontWeight: '800', color: Colors.lieDeVin, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  photoCtaRow:    { flexDirection: 'row' },
  photoCtaBtn:    { flex: 1, alignItems: 'center', gap: 6, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md },
  photoCtaBtnText:{ fontSize: 13, fontWeight: '700', color: Colors.lieDeVin, textAlign: 'center' },
  photoCtaBtnSub: { fontSize: 10, color: Colors.brunClair, textAlign: 'center' },
  photoCtaDivider:{ width: 1, backgroundColor: Colors.parchemin, marginVertical: Spacing.md },

  // Bloc photo confirmée
  photoConfirmed:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.vertSaugeLight, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.vertSauge + '50', marginBottom: Spacing.lg },
  photoConfirmedThumb:  { width: 52, height: 64, borderRadius: Radius.sm, backgroundColor: Colors.parchemin },
  photoConfirmedTitle:  { fontSize: 13, fontWeight: '700', color: Colors.vertSauge },
  photoConfirmedSub:    { fontSize: 11, color: Colors.brunMoyen, marginTop: 2 },
  photoConfirmedActions:{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },

  // Suggestion réutilisation photo
  photoSuggestion: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.ambreChaudLight, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.ambreChaud + '40', padding: Spacing.sm, marginBottom: Spacing.md },
  photoSuggThumb:  { width: 36, height: 48, borderRadius: Radius.sm, backgroundColor: Colors.parchemin },
  photoSuggThumbFallback: { width: 36, height: 48, borderRadius: Radius.sm, backgroundColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },
  photoSuggText:   { flex: 1, fontSize: 12, color: Colors.ambreChaud, fontWeight: '600' },
  photoSuggSub:    { fontSize: 10, color: Colors.brunClair, marginTop: 2 },
  photoSuggBtn:    { backgroundColor: Colors.ambreChaud, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  photoSuggBtnText:{ fontSize: 12, fontWeight: '700', color: Colors.white },

  form:         { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  footer:       { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md, backgroundColor: Colors.champagne, borderTopWidth: 1, borderTopColor: Colors.parchemin },
  notePersoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md, paddingVertical: Spacing.sm },
  notePersoLabel:{ fontSize: 14, fontWeight: '600', color: Colors.brunMoyen, flex: 1 },

  // Autocomplete
  suggestBox:         { backgroundColor: Colors.champagne, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.lieDeVin + '30', marginBottom: Spacing.md, overflow: 'hidden' },
  suggestTitle:       { fontSize: 10, fontWeight: '800', color: Colors.lieDeVin, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 6 },
  suggestRow:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: Colors.parchemin },
  suggestThumb:       { width: 32, height: 40, borderRadius: Radius.sm, backgroundColor: Colors.parchemin },
  suggestNom:         { fontSize: 13, fontWeight: '700', color: Colors.brunMoka },
  suggestSub:         { fontSize: 11, color: Colors.brunClair, marginTop: 1 },
  suggestFill:        { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.rougeVinLight, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 4 },
  suggestFillText:    { fontSize: 11, fontWeight: '700', color: Colors.lieDeVin },
  suggestDismiss:     { alignItems: 'center', paddingVertical: Spacing.sm, borderTopWidth: 0.5, borderTopColor: Colors.parchemin },
  suggestDismissText: { fontSize: 11, color: Colors.brunClair },

  // Guard aucune cave
  noCaveContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg },
  noCaveIcon:      { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.rougeVinLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.lieDeVin + '30' },
  noCaveTitle:     { fontSize: 20, fontWeight: '800', color: Colors.brunMoka, textAlign: 'center' },
  noCaveText:      { fontSize: 14, color: Colors.brunMoyen, textAlign: 'center', lineHeight: 22 },
  noCaveBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.lieDeVin, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  noCaveBtnText:   { fontSize: 15, fontWeight: '700', color: Colors.white },
});

const cam = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#000' },
  camera:      { flex: 1 },
  overlay:     { flex: 1, justifyContent: 'space-between', backgroundColor: 'transparent' },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: Spacing.lg },
  close:       { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  topTitle:    { fontSize: 16, fontWeight: '700', color: Colors.white },
  guide:       { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxl },
  frameBorder: { width: 270, height: 170, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)', position: 'relative' },
  corner:      { position: 'absolute', width: 24, height: 24, borderColor: Colors.white, borderWidth: 3 },
  cornerTL:    { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  cornerTR:    { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  cornerBL:    { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  cornerBR:    { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
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
  backdrop:  { flex: 1, backgroundColor: 'rgba(26,16,8,0.5)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: Colors.champagne, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: Spacing.lg, paddingBottom: 40, paddingTop: Spacing.lg, maxHeight: '90%' },
  sheetHeader:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  thumb:          { width: 60, height: 80, borderRadius: Radius.md, backgroundColor: Colors.parchemin },
  sheetTitles:    { flex: 1, gap: 6 },
  sheetTitle:     { fontSize: 18, fontWeight: '800', color: Colors.brunMoka },
  confidencePill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  confidenceText: { fontSize: 12, fontWeight: '700' },
  messageBanner:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1 },
  messageText:    { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  fieldsTitle:    { fontSize: 12, fontWeight: '700', color: Colors.brunClair, letterSpacing: 0.8, marginBottom: Spacing.sm },
  fieldRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: Colors.parchemin },
  fieldCheck:     { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  fieldLabel:     { width: 90, fontSize: 13, color: Colors.brunMoyen },
  fieldValue:     { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.brunMoka, textAlign: 'right' },
  fieldValueEmpty:{ color: Colors.brunClair, fontWeight: '400' },
  actions:        { gap: Spacing.sm, marginTop: Spacing.xl },
  btnPrimary:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.lieDeVin, borderRadius: Radius.full, paddingVertical: 15 },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  btnSecondary:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.rougeVinLight, borderRadius: Radius.full, paddingVertical: 14, borderWidth: 1, borderColor: Colors.lieDeVin + '30' },
  btnSecondaryText:{ fontSize: 14, fontWeight: '600', color: Colors.lieDeVin },
  btnGhost:       { alignItems: 'center', paddingVertical: 10 },
  btnGhostText:   { fontSize: 13, color: Colors.brunMoyen },
});
