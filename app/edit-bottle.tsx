import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
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
  const { bottles, updateBottle, localPhotos, updateLocalPhoto, uploadBottlePhoto } = useBottleStore();
  const { caves, fetchCaves } = useCavesStore();

  // Photo
  const [photoUri, setPhotoUri]     = useState<string | null>(id ? (localPhotos[id] ?? null) : null);
  const [showCam, setShowCam]       = useState(false);
  const [capturing, setCapturing]   = useState(false);
  const [permission, requestPerm]   = useCameraPermissions();
  const cameraRef                   = useRef<any>(null);

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

  useEffect(() => {
    fetchCaves();
    // Sync photo when id becomes available
    if (id) setPhotoUri(localPhotos[id] ?? null);
  }, [id]);

  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPerm();
      if (!res.granted) { Alert.alert('Permission refusée', 'Autorisez la caméra dans les réglages.'); return; }
    }
    setShowCam(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.92, base64: false, exif: false });
      setPhotoUri(photo.uri);
      setShowCam(false);
    } catch {
      Alert.alert('Erreur', 'Impossible de prendre la photo.');
    } finally {
      setCapturing(false);
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', 'Autorisez l\'accès à la galerie dans les réglages.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setPhotoUri(compressed.uri);
    }
  };

  const removePhoto = () => {
    Alert.alert('Supprimer la photo ?', undefined, [
      { text: 'Annuler' },
      { text: 'Supprimer', style: 'destructive', onPress: () => setPhotoUri(null) },
    ]);
  };

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

      // Gérer le changement de photo : upload DB + local
      const currentPhoto = localPhotos[id!] ?? null;
      const photoChanged = photoUri !== currentPhoto;
      if (photoChanged) {
        if (photoUri) {
          await uploadBottlePhoto(id!, photoUri); // upload DB + local
        } else {
          await updateLocalPhoto(id!, null); // suppression locale uniquement
        }
      }

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
          {/* ── Photo ── */}
          <Text style={s.sectionLabel}>Photo</Text>
          {photoUri ? (
            <View style={s.photoRow}>
              <Image source={{ uri: photoUri }} style={s.photoThumb} />
              <View style={{ flex: 1 }}>
                <Text style={s.photoTitle}>Photo enregistrée</Text>
                <Text style={s.photoSub}>Stockée localement sur cet appareil</Text>
              </View>
              <View style={s.photoActions}>
                <TouchableOpacity onPress={openCamera} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="camera-outline" size={20} color={Colors.lieDeVin} />
                </TouchableOpacity>
                <TouchableOpacity onPress={openGallery} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="images-outline" size={20} color={Colors.lieDeVin} />
                </TouchableOpacity>
                <TouchableOpacity onPress={removePhoto} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle-outline" size={20} color={Colors.rougeAlerte} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={s.photoAddRow}>
              <TouchableOpacity style={[s.photoAdd, { flex: 1 }]} onPress={openCamera} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={22} color={Colors.lieDeVin} />
                <Text style={s.photoAddText}>Caméra</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.photoAdd, { flex: 1 }]} onPress={openGallery} activeOpacity={0.8}>
                <Ionicons name="images-outline" size={22} color={Colors.lieDeVin} />
                <Text style={s.photoAddText}>Galerie</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={[s.sectionLabel, { marginTop: Spacing.lg }]}>Identité</Text>
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

      {/* Caméra pour photo */}
      <Modal visible={showCam} animationType="slide">
        <View style={cam.container}>
          <CameraView ref={cameraRef} style={cam.camera} facing="back">
            <View style={cam.overlay}>
              <View style={cam.topBar}>
                <TouchableOpacity style={cam.close} onPress={() => setShowCam(false)}>
                  <Ionicons name="close" size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={cam.title}>Photo de la bouteille</Text>
                <View style={{ width: 40 }} />
              </View>
              <View style={cam.shutterArea}>
                <TouchableOpacity style={cam.shutter} onPress={takePhoto} disabled={capturing} activeOpacity={0.8}>
                  {capturing
                    ? <ActivityIndicator color={Colors.white} size="large" />
                    : <View style={cam.shutterInner} />
                  }
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>
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

  // Photo section
  photoRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.vertSaugeLight, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.vertSauge + '50', padding: Spacing.sm, marginBottom: Spacing.lg },
  photoThumb:   { width: 56, height: 72, borderRadius: Radius.sm, backgroundColor: Colors.parchemin },
  photoTitle:   { fontSize: 13, fontWeight: '700', color: Colors.vertSauge },
  photoSub:     { fontSize: 11, color: Colors.brunMoyen, marginTop: 2 },
  photoActions: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  photoAddRow:  { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  photoAdd:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.champagne, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.lieDeVin + '30', borderStyle: 'dashed', padding: Spacing.lg },
  photoAddText: { fontSize: 14, fontWeight: '600', color: Colors.lieDeVin },
});

const cam = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#000' },
  camera:       { flex: 1 },
  overlay:      { flex: 1, justifyContent: 'space-between', backgroundColor: 'transparent' },
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: Spacing.lg },
  close:        { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  title:        { fontSize: 16, fontWeight: '700', color: Colors.white },
  shutterArea:  { paddingBottom: 56, alignItems: 'center' },
  shutter:      { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.parchemin },
});
