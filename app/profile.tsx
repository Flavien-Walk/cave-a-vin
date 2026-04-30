import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, Image, Modal, ActionSheetIOS, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Colors, Spacing, Radius, Shadow, Typography } from '../src/constants';
import { useAuthStore, useBottleStore } from '../src/stores';

export default function ProfileScreen() {
  const { user, logout, updateMe, deleteMe, profilePhotoUri, setProfilePhoto, uploadProfilePhoto } = useAuthStore();
  const { bottles } = useBottleStore();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName]         = useState(user?.name ?? '');
  const [savingName, setSavingName]   = useState(false);

  // Suppression de compte
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword]   = useState('');
  const [deleting, setDeleting]               = useState(false);

  // Changement de mot de passe
  const [showPwdModal, setShowPwdModal]   = useState(false);
  const [currentPwd, setCurrentPwd]       = useState('');
  const [newPwd, setNewPwd]               = useState('');
  const [confirmPwd, setConfirmPwd]       = useState('');
  const [changingPwd, setChangingPwd]     = useState(false);

  // Photo de profil
  const [showCam, setShowCam]     = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [permission, requestPerm] = useCameraPermissions();
  const cameraRef                 = useRef<any>(null);

  const compressPhoto = async (uri: string) => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 400 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  };

  const handlePhotoSource = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Annuler', 'Prendre une photo', 'Choisir dans la galerie'], cancelButtonIndex: 0 },
        async (idx) => {
          if (idx === 1) await openCamera();
          if (idx === 2) await pickFromGallery();
        }
      );
    } else {
      Alert.alert('Photo de profil', undefined, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Caméra', onPress: openCamera },
        { text: 'Galerie', onPress: pickFromGallery },
      ]);
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPerm();
      if (!res.granted) { Alert.alert('Permission refusée', 'Autorisez la caméra dans les réglages.'); return; }
    }
    setShowCam(true);
  };

  const takeProfilePhoto = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, base64: false });
      const compressed = await compressPhoto(photo.uri);
      setShowCam(false);
      await uploadProfilePhoto(compressed);
    } catch {
      Alert.alert('Erreur', 'Impossible de prendre la photo.');
    } finally {
      setCapturing(false);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', 'Autorisez l\'accès à la galerie dans les réglages.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      const compressed = await compressPhoto(result.assets[0].uri);
      await uploadProfilePhoto(compressed);
    }
  };

  const removeProfilePhoto = () => {
    Alert.alert('Supprimer la photo de profil ?', undefined, [
      { text: 'Annuler' },
      { text: 'Supprimer', style: 'destructive', onPress: () => setProfilePhoto(null) },
    ]);
  };

  const totalBottles = bottles.reduce((s, b) => s + b.quantite, 0);
  const memberSince  = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '';

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSavingName(true);
    try {
      await updateMe(newName.trim());
      setEditingName(false);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Se déconnecter',
      'Votre cave et vos données resteront sur le serveur.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes vos bouteilles, caves, listes et données seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Continuer', style: 'destructive', onPress: () => { setDeletePassword(''); setShowDeleteModal(true); } },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword) return;
    setDeleting(true);
    try {
      await deleteMe(deletePassword);
      setShowDeleteModal(false);
      router.replace('/(auth)/login');
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Mot de passe incorrect ou erreur réseau.');
    } finally {
      setDeleting(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPwd.length < 6) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    setChangingPwd(true);
    try {
      await updateMe(undefined, newPwd, currentPwd);
      setShowPwdModal(false);
      Alert.alert('Succès', 'Mot de passe mis à jour.');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.brunMoka} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar + nom */}
        <View style={s.avatarSection}>
          <View style={s.avatarWrap}>
            {profilePhotoUri
              ? <Image source={{ uri: profilePhotoUri }} style={s.avatarPhoto} />
              : (
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{(user?.name?.[0] ?? '?').toUpperCase()}</Text>
                </View>
              )
            }
            <TouchableOpacity style={s.avatarEditBtn} onPress={handlePhotoSource} activeOpacity={0.8}>
              <Ionicons name="camera" size={14} color={Colors.white} />
            </TouchableOpacity>
            {profilePhotoUri && (
              <TouchableOpacity style={s.avatarDeleteBtn} onPress={removeProfilePhoto} activeOpacity={0.8}>
                <Ionicons name="close" size={12} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>

          {editingName ? (
            <View style={s.editNameRow}>
              <TextInput
                style={s.nameInput}
                value={newName}
                onChangeText={setNewName}
                autoFocus
                selectTextOnFocus
              />
              <TouchableOpacity style={s.saveBtn} onPress={handleSaveName} disabled={savingName}>
                {savingName
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Ionicons name="checkmark" size={18} color={Colors.white} />
                }
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setEditingName(false); setNewName(user?.name ?? ''); }}>
                <Ionicons name="close" size={18} color={Colors.brunMoyen} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.nameRow} onPress={() => setEditingName(true)}>
              <Text style={s.userName}>{user?.name}</Text>
              <Ionicons name="pencil-outline" size={14} color={Colors.brunClair} />
            </TouchableOpacity>
          )}

          <Text style={s.userEmail}>{user?.email}</Text>
          {memberSince ? <Text style={s.memberSince}>Membre depuis {memberSince}</Text> : null}
        </View>

        {/* Statistiques rapides */}
        <View style={s.statsRow}>
          <StatPill value={totalBottles} label="bouteilles" icon="wine-outline" />
          <StatPill value={bottles.filter(b => b.isFavorite).length} label="favoris" icon="heart-outline" color={Colors.rosePale} />
          <StatPill value={bottles.length} label="références" icon="list-outline" color={Colors.ambreChaud} />
        </View>

        {/* Section Mon compte */}
        <SectionHeader label="Mon compte" />

        <View style={s.card}>
          <Row
            icon="mail-outline"
            label="Adresse e-mail"
            value={user?.email}
          />
          <Divider />
          <Row
            icon="lock-closed-outline"
            label="Changer le mot de passe"
            onPress={() => { setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); setShowPwdModal(true); }}
          />
        </View>

        {/* Section Données */}
        <SectionHeader label="Mes données" />

        <View style={s.card}>
          <Row
            icon="bar-chart-outline"
            label="Statistiques complètes"
            onPress={() => { router.back(); setTimeout(() => router.push('/(tabs)/stats'), 100); }}
          />
          <Divider />
          <Row
            icon="compass-outline"
            label="Recommandations & accords"
            onPress={() => { router.back(); setTimeout(() => router.push('/(tabs)/discover'), 100); }}
          />
        </View>

        {/* Note stockage local */}
        <View style={s.localStorageNote}>
          <Ionicons name="information-circle-outline" size={15} color={Colors.brunClair} />
          <Text style={s.localStorageText}>
            Les photos de bouteilles scannées sont stockées localement sur cet appareil. Elles ne sont pas sauvegardées dans le cloud et seront perdues en cas de réinstallation.
          </Text>
        </View>

        {/* Section Légal */}
        <SectionHeader label="Légal & confidentialité" />
        <View style={s.card}>
          <Row
            icon="shield-checkmark-outline"
            label="Politique de confidentialité"
            onPress={() => router.push('/privacy')}
          />
          <Divider />
          <Row
            icon="document-text-outline"
            label="Conditions d'utilisation"
            onPress={() => router.push('/privacy')}
          />
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={Colors.rougeAlerte} />
          <Text style={s.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* Suppression de compte */}
        <SectionHeader label="Zone de danger" />
        <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={16} color={Colors.rougeAlerte} />
          <Text style={s.deleteText}>Supprimer mon compte</Text>
        </TouchableOpacity>

        <Text style={s.version}>CAVOU v2.0 · Flavien</Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal changement de mot de passe */}
      <Modal visible={showPwdModal} transparent animationType="fade">
        <View style={del.backdrop}>
          <View style={del.box}>
            <Ionicons name="lock-closed-outline" size={32} color={Colors.lieDeVin} style={{ marginBottom: Spacing.sm }} />
            <Text style={del.title}>Changer le mot de passe</Text>
            <Text style={del.sub}>Saisissez votre mot de passe actuel puis le nouveau.</Text>
            <TextInput
              style={[del.input, { marginBottom: Spacing.sm }]}
              placeholder="Mot de passe actuel"
              placeholderTextColor={Colors.brunClair}
              secureTextEntry
              value={currentPwd}
              onChangeText={setCurrentPwd}
              autoFocus
            />
            <TextInput
              style={[del.input, { marginBottom: Spacing.sm }]}
              placeholder="Nouveau mot de passe (min. 6 car.)"
              placeholderTextColor={Colors.brunClair}
              secureTextEntry
              value={newPwd}
              onChangeText={setNewPwd}
            />
            <TextInput
              style={del.input}
              placeholder="Confirmer le nouveau mot de passe"
              placeholderTextColor={Colors.brunClair}
              secureTextEntry
              value={confirmPwd}
              onChangeText={setConfirmPwd}
            />
            <View style={del.row}>
              <TouchableOpacity style={del.cancelBtn} onPress={() => setShowPwdModal(false)} disabled={changingPwd}>
                <Text style={del.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[del.confirmBtn, { backgroundColor: Colors.lieDeVin }]}
                onPress={handleChangePassword}
                disabled={changingPwd || !currentPwd || !newPwd || !confirmPwd}
              >
                {changingPwd
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Text style={del.confirmText}>Confirmer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal suppression de compte */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={del.backdrop}>
          <View style={del.box}>
            <Ionicons name="warning-outline" size={32} color={Colors.rougeAlerte} style={{ marginBottom: Spacing.sm }} />
            <Text style={del.title}>Confirmer la suppression</Text>
            <Text style={del.sub}>Entrez votre mot de passe pour confirmer. Cette action est définitive.</Text>
            <TextInput
              style={del.input}
              placeholder="Mot de passe"
              placeholderTextColor={Colors.brunClair}
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
              autoFocus
            />
            <View style={del.row}>
              <TouchableOpacity style={del.cancelBtn} onPress={() => setShowDeleteModal(false)} disabled={deleting}>
                <Text style={del.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={del.confirmBtn} onPress={confirmDeleteAccount} disabled={deleting || !deletePassword}>
                {deleting
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Text style={del.confirmText}>Supprimer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal caméra — photo de profil */}
      <Modal visible={showCam} animationType="slide">
        <View style={cam.container}>
          <CameraView ref={cameraRef} style={cam.camera} facing="front">
            <View style={cam.overlay}>
              <View style={cam.topBar}>
                <TouchableOpacity style={cam.close} onPress={() => setShowCam(false)}>
                  <Ionicons name="close" size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={cam.topTitle}>Photo de profil</Text>
                <View style={{ width: 40 }} />
              </View>
              <View style={cam.shutterArea}>
                <TouchableOpacity style={cam.shutter} onPress={takeProfilePhoto} disabled={capturing} activeOpacity={0.8}>
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

// ── Subcomponents ──────────────────────────────────────────────────────────────

const StatPill = ({ value, label, icon, color = Colors.lieDeVin }: { value: number; label: string; icon: any; color?: string }) => (
  <View style={[sp.pill, { borderColor: color + '30' }]}>
    <View style={[sp.iconBox, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <Text style={[sp.value, { color }]}>{value}</Text>
    <Text style={sp.label}>{label}</Text>
  </View>
);

const sp = StyleSheet.create({
  pill:    { flex: 1, backgroundColor: Colors.champagne, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 4, borderWidth: 1 },
  iconBox: { width: 32, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  value:   { fontSize: 20, fontWeight: '800' },
  label:   { ...Typography.caption, color: Colors.brunMoyen, textAlign: 'center' },
});

const SectionHeader = ({ label }: { label: string }) => (
  <Text style={sh.text}>{label.toUpperCase()}</Text>
);
const sh = StyleSheet.create({
  text: { fontSize: 11, fontWeight: '700', color: Colors.brunClair, letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.lg, paddingHorizontal: 2 },
});

const Divider = () => <View style={{ height: 1, backgroundColor: Colors.parchemin, marginLeft: 44 }} />;

const Row = ({ icon, label, value, onPress }: { icon: any; label: string; value?: string; onPress?: () => void }) => (
  <TouchableOpacity style={rw.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
    <View style={rw.iconBox}>
      <Ionicons name={icon} size={18} color={Colors.brunMoyen} />
    </View>
    <Text style={rw.label}>{label}</Text>
    {value && <Text style={rw.value} numberOfLines={1}>{value}</Text>}
    {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.parchemin} />}
  </TouchableOpacity>
);
const rw = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 14, paddingHorizontal: Spacing.md },
  iconBox: { width: 28, alignItems: 'center' },
  label:   { flex: 1, ...Typography.body, color: Colors.brunMoka },
  value:   { ...Typography.bodySmall, color: Colors.brunClair, maxWidth: 140 },
});

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.cremeIvoire },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.brunMoka },

  avatarSection:   { alignItems: 'center', paddingVertical: Spacing.xl, gap: 6 },
  avatarWrap:      { position: 'relative', marginBottom: Spacing.sm },
  avatar:          { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.lieDeVin, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  avatarPhoto:     { width: 80, height: 80, borderRadius: 40, ...Shadow.sm },
  avatarText:      { fontSize: 32, fontWeight: '800', color: Colors.white },
  avatarEditBtn:   { position: 'absolute', bottom: 0, right: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.lieDeVin, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.cremeIvoire },
  avatarDeleteBtn: { position: 'absolute', top: -2, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.rougeAlerte, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.cremeIvoire },

  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName:   { fontSize: 22, fontWeight: '800', color: Colors.brunMoka },
  editNameRow:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  nameInput:  { borderWidth: 1.5, borderColor: Colors.lieDeVin, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 8, fontSize: 18, fontWeight: '700', color: Colors.brunMoka, minWidth: 140 },
  saveBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.lieDeVin, alignItems: 'center', justifyContent: 'center' },
  cancelBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },

  userEmail:   { ...Typography.body, color: Colors.brunMoyen },
  memberSince: { ...Typography.caption, color: Colors.brunClair },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  card:     { backgroundColor: Colors.champagne, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.parchemin, ...Shadow.sm, overflow: 'hidden' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginTop: Spacing.xl,
    backgroundColor: Colors.rougeAlerteLight,
    borderRadius: Radius.xl, paddingVertical: 16,
    borderWidth: 1, borderColor: Colors.rougeAlerte + '40',
  },
  logoutText: { ...Typography.body, color: Colors.rougeAlerte, fontWeight: '700' },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginTop: Spacing.xs,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.rougeAlerte + '30',
    backgroundColor: Colors.rougeAlerteLight,
  },
  deleteText: { ...Typography.body, color: Colors.rougeAlerte, fontWeight: '600' },

  version: { ...Typography.caption, color: Colors.brunClair, textAlign: 'center', marginTop: Spacing.xl },

  localStorageNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.champagne, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.parchemin, padding: Spacing.md, marginBottom: Spacing.sm },
  localStorageText: { flex: 1, fontSize: 12, color: Colors.brunClair, lineHeight: 18 },
});

const cam = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#000' },
  camera:       { flex: 1 },
  overlay:      { flex: 1, justifyContent: 'space-between', backgroundColor: 'transparent' },
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: Spacing.lg },
  close:        { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  topTitle:     { fontSize: 16, fontWeight: '700', color: Colors.white },
  shutterArea:  { alignItems: 'center', paddingBottom: 64 },
  shutter:      { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.white },
  shutterInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.white },
});

const del = StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(26,16,8,0.6)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  box:        { backgroundColor: Colors.champagne, borderRadius: Radius.xl, padding: Spacing.xl, width: '100%', alignItems: 'center', ...Shadow.lg },
  title:      { fontSize: 17, fontWeight: '800', color: Colors.brunMoka, marginBottom: Spacing.xs },
  sub:        { fontSize: 13, color: Colors.brunMoyen, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg },
  input:      { width: '100%', borderWidth: 1.5, borderColor: Colors.parchemin, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: 15, color: Colors.brunMoka, marginBottom: Spacing.lg, backgroundColor: Colors.cremeIvoire },
  row:        { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  cancelBtn:  { flex: 1, paddingVertical: 14, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: Colors.brunMoyen },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.lg, backgroundColor: Colors.rougeAlerte, alignItems: 'center' },
  confirmText:{ fontSize: 14, fontWeight: '700', color: Colors.white },
});
