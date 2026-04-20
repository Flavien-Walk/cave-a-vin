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

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Champs requis', 'Renseignez votre email et mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Connexion impossible', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={s.logoArea}>
            <View style={s.logoRing}>
              <Text style={s.logoIcon}>🍷</Text>
            </View>
            <Text style={s.appName}>Cave à Vin</Text>
            <Text style={s.tagline}>Votre cave, vos règles.</Text>
          </View>

          {/* Formulaire */}
          <View style={s.form}>
            <Text style={s.formTitle}>Connexion</Text>

            <Input
              label="Adresse e-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="vous@exemple.com"
            />

            <Input
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              autoComplete="password"
              placeholder="••••••••"
              rightIcon={
                <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.brunClair} />
                </TouchableOpacity>
              }
            />

            <TouchableOpacity
              style={[s.btn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={s.btnText}>Se connecter</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={s.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={s.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </View>

          {/* Lien vers register */}
          <View style={s.footer}>
            <Text style={s.footerText}>Pas encore de compte ?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={s.footerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.cremeIvoire },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxxl },

  logoArea: { alignItems: 'center', marginBottom: Spacing.xxxl, gap: Spacing.sm },
  logoRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.champagne,
    borderWidth: 1, borderColor: Colors.parchemin,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  logoIcon: { fontSize: 36 },
  appName:  { fontSize: 28, fontWeight: '800', color: Colors.brunMoka, letterSpacing: -0.5 },
  tagline:  { ...Typography.body, color: Colors.brunMoyen },

  form:      { gap: Spacing.md },
  formTitle: { fontSize: 22, fontWeight: '700', color: Colors.brunMoka, marginBottom: Spacing.sm },

  btn: {
    backgroundColor: Colors.lieDeVin,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: Colors.white },

  forgotBtn:  { alignItems: 'center', paddingVertical: Spacing.sm, marginTop: 2 },
  forgotText: { ...Typography.bodySmall, color: Colors.brunMoyen },

  footer:     { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing.xl, paddingBottom: Spacing.xxxl },
  footerText: { ...Typography.body, color: Colors.brunMoyen },
  footerLink: { ...Typography.body, color: Colors.lieDeVin, fontWeight: '700' },
});
