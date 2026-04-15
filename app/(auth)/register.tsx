import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  TouchableOpacity, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../../src/constants';
import { Input } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores';

export default function RegisterScreen() {
  const { register } = useAuthStore();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Champs requis', 'Renseignez tous les champs.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Mot de passe trop court', 'Minimum 6 caractères.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mots de passe différents', 'Les deux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="arrow-back" size={20} color={Colors.brunMoka} />
            </TouchableOpacity>
          </View>

          <View style={s.logoArea}>
            <View style={s.logoRing}>
              <Text style={s.logoIcon}>🍷</Text>
            </View>
            <Text style={s.appName}>Créer un compte</Text>
            <Text style={s.tagline}>Votre cave vous appartient.</Text>
          </View>

          <View style={s.form}>
            <Input
              label="Prénom ou pseudonyme"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholder="Jean-Pierre"
            />
            <Input
              label="Adresse e-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="vous@exemple.com"
            />
            <View>
              <Input
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                placeholder="6 caractères minimum"
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPwd(v => !v)}>
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.brunClair} />
              </TouchableOpacity>
            </View>
            <Input
              label="Confirmer le mot de passe"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPwd}
              placeholder="••••••••"
            />

            <TouchableOpacity
              style={[s.btn, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={s.btnText}>Créer mon compte</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Déjà un compte ?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={s.footerLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.cremeIvoire },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },

  header:  { marginBottom: Spacing.lg },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },

  logoArea: { alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.sm },
  logoRing: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs,
  },
  logoIcon: { fontSize: 32 },
  appName:  { fontSize: 24, fontWeight: '800', color: Colors.brunMoka, letterSpacing: -0.5 },
  tagline:  { ...Typography.body, color: Colors.brunMoyen },

  form:   { gap: Spacing.md },
  eyeBtn: { position: 'absolute', right: 12, bottom: 12, padding: 4 },

  btn: {
    backgroundColor: Colors.lieDeVin, borderRadius: Radius.full,
    paddingVertical: 16, alignItems: 'center', marginTop: Spacing.sm,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: Colors.white },

  footer:     { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing.xl, paddingBottom: Spacing.xl },
  footerText: { ...Typography.body, color: Colors.brunMoyen },
  footerLink: { ...Typography.body, color: Colors.lieDeVin, fontWeight: '700' },
});
