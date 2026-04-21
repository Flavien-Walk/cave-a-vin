import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useAuthStore } from '../src/stores';
import { ServerWakeup } from '../src/components/ServerWakeup';

export default function RootLayout() {
  const { loadSession, token } = useAuthStore();
  const [wakeupDone, setWakeupDone] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Vérification des mises à jour OTA
  useEffect(() => {
    (async () => {
      try {
        if (!__DEV__) {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            Alert.alert(
              'Mise à jour disponible',
              "Une nouvelle version de l'app est disponible. Installer maintenant ?",
              [
                { text: 'Plus tard', style: 'cancel' },
                {
                  text: 'Installer',
                  onPress: async () => {
                    await Updates.fetchUpdateAsync();
                    await Updates.reloadAsync();
                  },
                },
              ]
            );
          }
        }
      } catch { /* Pas d'update channel configuré en dev */ }
    })();
  }, []);

  // Chargement de la session en parallèle du wakeup serveur
  useEffect(() => {
    loadSession().then(() => setSessionChecked(true));
  }, []);

  // Une fois wakeup + session chargés → rediriger vers login si pas de session
  useEffect(() => {
    if (!wakeupDone || !sessionChecked) return;
    if (!token) {
      router.replace('/(auth)/login');
    }
  }, [wakeupDone, sessionChecked, token]);

  // Affiche le wakeup serveur tant que pas prêt
  if (!wakeupDone) {
    return (
      <>
        <StatusBar style="dark" />
        <ServerWakeup onReady={() => setWakeupDone(true)} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="bottle/[id]"  options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="edit-bottle"   options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile"       options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="cave-value"    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="cave-filtered" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="manage-caves"  options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}
