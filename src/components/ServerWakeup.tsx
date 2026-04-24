import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius } from '../constants';
import { API_URL } from '../constants';
import { CavouLogo } from './CavouLogo';

const { width: SCREEN_W } = Dimensions.get('window');

const PROGRESS_W = SCREEN_W * 0.52;

type Phase = 'checking' | 'waking' | 'ready' | 'timeout';

interface Props { onReady: () => void; }

export function ServerWakeup({ onReady }: Props) {
  const [phase, setPhase]     = useState<Phase>('checking');
  const [elapsed, setElapsed] = useState(0);

  const fadeAnim    = useRef(new Animated.Value(1)).current;
  const fillAnim    = useRef(new Animated.Value(0)).current;  // progress 0→1
  const scaleAnim   = useRef(new Animated.Value(0.88)).current;
  const dot1        = useRef(new Animated.Value(0.3)).current;
  const dot2        = useRef(new Animated.Value(0.3)).current;
  const dot3        = useRef(new Animated.Value(0.3)).current;

  // Entry spring
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }).start();
  }, []);

  // Progress bar — parcourt la durée max serveur (28s)
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: 1,
      duration: 28000,
      useNativeDriver: false,
    }).start();
  }, []);

  // Dots pulsing
  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0.3, duration: 480, useNativeDriver: true }),
      ]));
    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 200);
    const a3 = pulse(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  // Server polling
  useEffect(() => {
    let cancelled = false;
    let attempt   = 0;
    const start   = Date.now();
    const MAX     = 22;

    const dismiss = () => {
      if (cancelled) return;
      setPhase('ready');
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(fadeAnim, { toValue: 0, duration: 550, useNativeDriver: true }),
      ]).start(() => { if (!cancelled) onReady(); });
    };

    const check = async () => {
      if (cancelled) return;
      attempt++;
      setElapsed(Math.round((Date.now() - start) / 1000));
      if (attempt > 1) setPhase('waking');

      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`${API_URL}/health`, { signal: controller.signal });
        clearTimeout(t);
        if (res.ok && !cancelled) { dismiss(); return; }
      } catch { /* retry */ }

      if (attempt >= MAX) { if (!cancelled) setPhase('timeout'); return; }
      if (!cancelled) setTimeout(check, 2000);
    };

    const warmup = setTimeout(check, 600);
    return () => { cancelled = true; clearTimeout(warmup); };
  }, []);

  const msg = {
    checking: 'Connexion à votre cave…',
    waking:   'Réveil du serveur…',
    ready:    'Cave prête !',
    timeout:  'Le serveur met du temps à répondre.',
  }[phase];

  const sub = phase === 'waking'
    ? `Votre cave démarre. Jusqu'à 30 secondes.`
    : phase === 'timeout'
      ? 'Vérifiez votre connexion ou entrez quand même.'
      : '';

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PROGRESS_W],
  });

  return (
    <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>

      {/* Fond gradient sombre — identité CAVOU */}
      <LinearGradient
        colors={['#5E1226', '#1A0510']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.35, y: 0 }}
        end={{ x: 0.65, y: 1 }}
      />

      {/* Grain de texture subtil */}
      <View style={s.grainOverlay} pointerEvents="none" />

      {/* Contenu centré */}
      <Animated.View style={[s.content, { transform: [{ scale: scaleAnim }] }]}>

        {/* Logo CAVOU */}
        <CavouLogo size={84} dark showWordmark />

        {/* Barre de progression fine — or */}
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { width: fillWidth }]} />
        </View>

        {/* Message d'état */}
        <Text style={s.title}>{msg}</Text>
        {sub ? <Text style={s.sub}>{sub}</Text> : null}

        {/* Dots — phase loading */}
        {phase !== 'ready' && phase !== 'timeout' && (
          <View style={s.dots}>
            {[dot1, dot2, dot3].map((d, i) => (
              <Animated.View key={i} style={[s.dot, { opacity: d }]} />
            ))}
          </View>
        )}

        {/* Prêt */}
        {phase === 'ready' && (
          <View style={s.readyRow}>
            <View style={s.readyDot} />
            <Text style={s.readyText}>Connecté</Text>
          </View>
        )}

        {/* Timeout */}
        {phase === 'timeout' && (
          <TouchableOpacity style={s.retryBtn} onPress={onReady} activeOpacity={0.8}>
            <Text style={s.retryText}>Entrer quand même</Text>
          </TouchableOpacity>
        )}

        {phase === 'waking' && elapsed > 5 && (
          <Text style={s.elapsed}>{elapsed}s</Text>
        )}

      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },

  // Grain très léger pour texture premium
  grainOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },

  content: {
    alignItems: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    width: '100%',
  },

  // Barre de progression horizontale en or
  progressTrack: {
    width: PROGRESS_W,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 1,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  progressFill: {
    height: 2,
    backgroundColor: Colors.ambreChaud,
    borderRadius: 1,
  },

  title: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.82)', textAlign: 'center' },
  sub:   { fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.sm },

  dots:  { flexDirection: 'row', gap: 8, marginTop: 2 },
  dot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.ambreChaud },

  readyRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  readyDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5CB85C' },
  readyText: { fontSize: 13, color: '#5CB85C', fontWeight: '700' },

  retryBtn:  {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  retryText: { fontSize: 13, color: Colors.white, fontWeight: '600' },

  elapsed: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
});
