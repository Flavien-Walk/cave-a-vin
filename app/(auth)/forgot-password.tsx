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
import { API_URL } from '../../src/constants';

export default function ForgotPasswordScreen() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Email requis', 'Renseignez votre adresse e-mail.');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(API_URL + '/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? 'Erreur réseau.');
      setSent(true);
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

          {/* Icône */}
          <View style={s.iconArea}>
            <View style={s.iconRing}>
              <Ionicons name="mail-outline" size={32} color={Colors.lieDeVin} />
            </View>
            <Text style={s.title}>Mot de passe oublié</Text>
            <Text style={s.subtitle}>
              Renseignez votre email et nous vous enverrons un code de réinitialisation.
            </Text>
          </View>

          {!sent ? (
            <View style={s.form}>
              <Input
                label="Adresse e-mail"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="vous@exemple.com"
              />

              <TouchableOpacity
                style={[s.btn, loading && { opacity: 0.7 }]}
                onPress={handleSend}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={s.btnText}>Envoyer le code</Text>
                }
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.sentCard}>
              <View style={s.sentIcon}>
                <Ionicons name="checkmark-circle" size={40} color={Colors.vertSauge} />
              </View>
              <Text style={s.sentTitle}>Email envoyé !</Text>
              <Text style={s.sentText}>
                Si <Text style={{ fontWeight: '700', color: Colors.brunMoka }}>{email.trim()}</Text> est
                enregistré, vous recevrez un code dans quelques secondes.
              </Text>
              <Text style={s.sentHint}>Vérifiez aussi vos spams.</Text>

              <TouchableOpacity
                style={s.btn}
                onPress={() => router.push({ pathname: '/(auth)/reset-password', params: { email: email.trim() } })}
                activeOpacity={0.85}
              >
                <Text style={s.btnText}>Entrer le code</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.linkBtn} onPress={() => setSent(false)}>
                <Text style={s.linkText}>Renvoyer un code</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.cremeIvoire },
  scroll:  { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },

  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },

  iconArea: { alignItems: 'center', marginBottom: Spacing.xxxl, gap: Spacing.md, paddingTop: Spacing.xl },
  iconRing: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: Colors.rougeVinLight,
    borderWidth: 1, borderColor: Colors.lieDeVin + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  title:    { fontSize: 24, fontWeight: '800', color: Colors.brunMoka, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { ...Typography.body, color: Colors.brunMoyen, textAlign: 'center', lineHeight: 22 },

  form: { gap: Spacing.md },

  btn: {
    backgroundColor: Colors.lieDeVin,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: Colors.white },

  sentCard:  { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.lg },
  sentIcon:  { marginBottom: Spacing.sm },
  sentTitle: { fontSize: 20, fontWeight: '800', color: Colors.brunMoka },
  sentText:  { ...Typography.body, color: Colors.brunMoyen, textAlign: 'center', lineHeight: 22 },
  sentHint:  { fontSize: 12, color: Colors.brunClair, textAlign: 'center' },

  linkBtn:  { paddingVertical: Spacing.md },
  linkText: { ...Typography.body, color: Colors.lieDeVin, fontWeight: '700', textAlign: 'center' },
});
