import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../../src/constants';
import { Input } from '../../src/components/ui';
import { API_URL } from '../../src/constants';
import { useAuthStore } from '../../src/stores';

export default function ResetPasswordScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { login } = useAuthStore();

  const [code,     setCode]     = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>([null, null, null, null, null, null]);

  const handleCodeChange = (val: string, idx: number) => {
    const digits = val.replace(/\D/g, '');

    if (digits.length > 1) {
      // Collage : distribuer chaque chiffre depuis la case 0
      const next = ['', '', '', '', '', ''];
      digits.slice(0, 6).split('').forEach((d, j) => { next[j] = d; });
      setCode(next);
      inputRefs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }

    const next = [...code];
    next[idx] = digits;
    setCode(next);
    if (digits && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const fullCode = code.join('');

  const handleReset = async () => {
    if (fullCode.length < 6) {
      Alert.alert('Code incomplet', 'Entrez le code à 6 chiffres reçu par email.');
      return;
    }
    if (!password) {
      Alert.alert('Mot de passe requis', 'Renseignez votre nouveau mot de passe.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Mot de passe trop court', 'Au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mots de passe différents', 'La confirmation ne correspond pas.');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(API_URL + '/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    (emailParam ?? '').trim().toLowerCase(),
          code:     fullCode,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? 'Erreur réseau.');

      // Connecter directement avec le token reçu
      if (data.token) {
        const SecureStore = await import('expo-secure-store');
        await SecureStore.setItemAsync('cave_token', data.token);
        await SecureStore.setItemAsync('cave_user', JSON.stringify(data.user));
      }

      Alert.alert(
        'Mot de passe mis à jour',
        'Votre mot de passe a été changé avec succès.',
        [{ text: 'Continuer', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Retour */}
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.brunMoka} />
          </TouchableOpacity>

          {/* Titre */}
          <View style={s.titleArea}>
            <View style={s.iconRing}>
              <Ionicons name="lock-closed-outline" size={28} color={Colors.lieDeVin} />
            </View>
            <Text style={s.title}>Nouveau mot de passe</Text>
            {emailParam ? (
              <Text style={s.subtitle}>
                Code envoyé à <Text style={{ fontWeight: '700', color: Colors.brunMoka }}>{emailParam}</Text>
              </Text>
            ) : (
              <Text style={s.subtitle}>Entrez le code reçu par email.</Text>
            )}
          </View>

          {/* Saisie OTP */}
          <Text style={s.otpLabel}>Code à 6 chiffres</Text>
          <View style={s.otpRow}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                style={[s.otpInput, digit && s.otpInputFilled]}
                value={digit}
                onChangeText={val => handleCodeChange(val, i)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && !digit && i > 0) {
                    inputRefs.current[i - 1]?.focus();
                  }
                }}
                keyboardType="number-pad"
                selectTextOnFocus
                textAlign="center"
              />
            ))}
          </View>

          {/* Nouveau mot de passe */}
          <View style={s.form}>
            <View>
              <Input
                label="Nouveau mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                placeholder="Minimum 6 caractères"
                autoComplete="password-new"
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
              placeholder="Répétez le mot de passe"
              autoComplete="password-new"
            />

            <TouchableOpacity
              style={[s.btn, loading && { opacity: 0.7 }]}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={s.btnText}>Réinitialiser le mot de passe</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={s.linkBtn}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={s.linkText}>Renvoyer un code</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.cremeIvoire },
  scroll:  { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },

  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },

  titleArea: { alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.md, paddingTop: Spacing.lg },
  iconRing:  {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: Colors.rougeVinLight,
    borderWidth: 1, borderColor: Colors.lieDeVin + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  title:    { fontSize: 22, fontWeight: '800', color: Colors.brunMoka, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { ...Typography.body, color: Colors.brunMoyen, textAlign: 'center', lineHeight: 22 },

  otpLabel: { fontSize: 12, fontWeight: '700', color: Colors.brunMoyen, letterSpacing: 0.5, marginBottom: Spacing.sm },
  otpRow:   { flexDirection: 'row', gap: 10, marginBottom: Spacing.xl },
  otpInput: {
    flex: 1,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.parchemin,
    backgroundColor: Colors.champagne,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.brunMoka,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: Colors.lieDeVin,
    backgroundColor: Colors.rougeVinLight,
    color: Colors.lieDeVin,
  },

  form:   { gap: Spacing.md },
  eyeBtn: { position: 'absolute', right: 12, bottom: 12, padding: 4 },

  btn: {
    backgroundColor: Colors.lieDeVin,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: Colors.white },

  linkBtn:  { paddingVertical: Spacing.md, alignItems: 'center' },
  linkText: { ...Typography.body, color: Colors.lieDeVin, fontWeight: '700' },
});
