import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '../constants';
import { API_URL } from '../constants';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

type Phase = 'checking' | 'waking' | 'ready' | 'timeout';

interface Props { onReady: () => void; }

export function ServerWakeup({ onReady }: Props) {
  const [phase, setPhase]     = useState<Phase>('checking');
  const [elapsed, setElapsed] = useState(0);

  const fadeAnim   = useRef(new Animated.Value(1)).current;
  const fillAnim   = useRef(new Animated.Value(0)).current;   // wine fill 0→1
  const glowAnim   = useRef(new Animated.Value(0)).current;   // glow pulse
  const dot1       = useRef(new Animated.Value(0.3)).current;
  const dot2       = useRef(new Animated.Value(0.3)).current;
  const dot3       = useRef(new Animated.Value(0.3)).current;
  const scaleAnim  = useRef(new Animated.Value(0.85)).current;

  // Entry scale-in
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
  }, []);

  // Wine fill animation — slow pour from top to bottom
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: 1,
      duration: 28000,
      useNativeDriver: false,
    }).start();
  }, []);

  // Glow pulse on fill bar
  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, []);

  // Dots pulsing
  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ]));
    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 220);
    const a3 = pulse(dot3, 440);
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
        Animated.delay(1000),
        Animated.timing(fadeAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
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

  // Wine fill interpolated height (top-down, fills the glass)
  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0.4, 1],
    outputRange: [0.4, 1],
  });

  return (
    <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>

      {/* Background wine fill — pours from top */}
      <View style={s.fillContainer} pointerEvents="none">
        <Animated.View style={[s.fillBar, { height: fillHeight }]} />
      </View>

      {/* Card */}
      <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>

        {/* Logo / icon */}
        <View style={s.logoRing}>
          <Text style={s.logoEmoji}>🍷</Text>
        </View>
        <Text style={s.appTitle}>Cave à vin</Text>

        {/* Progress glass */}
        <View style={s.glassWrap}>
          <View style={s.glassBg} />
          <Animated.View style={[s.glassFill, { height: fillHeight }]} />
          <Animated.View style={[s.glassShine, { opacity: glowOpacity }]} />
        </View>

        {/* Message */}
        <Text style={s.title}>{msg}</Text>
        {sub ? <Text style={s.sub}>{sub}</Text> : null}

        {/* Dots */}
        {phase !== 'ready' && phase !== 'timeout' && (
          <View style={s.dots}>
            {[dot1, dot2, dot3].map((d, i) => (
              <Animated.View key={i} style={[s.dot, { opacity: d }]} />
            ))}
          </View>
        )}

        {/* Ready */}
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

const GLASS_W = 56;
const GLASS_H = 72;

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.cremeIvoire,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },

  // Background fill — very subtle tinted wash from top
  fillContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  fillBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.lieDeVin + '08',
  },

  card: {
    width: SCREEN_W * 0.82,
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.champagne,
    borderRadius: Radius.xxl,
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.parchemin,
    shadowColor: Colors.brunMoka,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },

  logoRing: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: Colors.cremeIvoire,
    borderWidth: 1.5,
    borderColor: Colors.lieDeVin + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoEmoji: { fontSize: 32 },
  appTitle:  { fontSize: 22, fontWeight: '900', color: Colors.lieDeVin, letterSpacing: -0.5, marginBottom: 4 },

  // Mini wine glass progress indicator
  glassWrap: {
    width: GLASS_W,
    height: GLASS_H,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: 4,
  },
  glassBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.parchemin,
    borderRadius: Radius.md,
  },
  glassFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.lieDeVin,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
  },
  glassShine: {
    position: 'absolute',
    top: 6,
    left: 8,
    width: 10,
    height: GLASS_H * 0.6,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 5,
  },

  title: { ...Typography.h3, color: Colors.brunMoka, textAlign: 'center' },
  sub:   { ...Typography.bodySmall, color: Colors.brunMoyen, textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.sm },

  dots:  { flexDirection: 'row', gap: 8, marginTop: 4 },
  dot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.lieDeVin },

  readyRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  readyDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5CB85C' },
  readyText: { ...Typography.bodySmall, color: '#5CB85C', fontWeight: '700' },

  retryBtn:  { marginTop: Spacing.lg, backgroundColor: Colors.lieDeVin, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.full },
  retryText: { ...Typography.bodySmall, color: Colors.white, fontWeight: '700' },

  elapsed:   { ...Typography.caption, color: Colors.brunClair, marginTop: 4 },
});
