import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '../constants';
import { API_URL } from '../constants';

type Phase = 'checking' | 'waking' | 'ready' | 'timeout';

interface Props { onReady: () => void; }

export function ServerWakeup({ onReady }: Props) {
  const [phase, setPhase]   = useState<Phase>('checking');
  const [elapsed, setElapsed] = useState(0);
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const dot1      = useRef(new Animated.Value(0.3)).current;
  const dot2      = useRef(new Animated.Value(0.3)).current;
  const dot3      = useRef(new Animated.Value(0.3)).current;

  // Animation 3 points pulsants décalés
  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ]));
    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 200);
    const a3 = pulse(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let attempt   = 0;
    const start   = Date.now();
    const MAX     = 22; // ~44 secondes

    const dismiss = () => {
      if (cancelled) return;
      setPhase('ready');
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
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

    // Petite pause avant le 1er essai pour ne pas flasher si le backend répond vite
    const warmup = setTimeout(check, 600);
    return () => { cancelled = true; clearTimeout(warmup); };
  }, []);

  const msg = {
    checking: 'Connexion à votre cave…',
    waking:   'Le serveur se réveille…',
    ready:    'Cave prête !',
    timeout:  'Le serveur met du temps à répondre.',
  }[phase];

  const sub = phase === 'waking'
    ? `Votre cave démarre. Cela peut prendre jusqu'à 30 secondes.`
    : phase === 'timeout'
      ? 'Vérifiez votre connexion ou réessayez dans quelques instants.'
      : '';

  return (
    <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
      <View style={s.card}>
        {/* Icône */}
        <View style={s.iconRing}>
          <Text style={s.iconText}>🍷</Text>
        </View>

        {/* Message */}
        <Text style={s.title}>{msg}</Text>
        {sub ? <Text style={s.sub}>{sub}</Text> : null}

        {/* Indicateur animé */}
        {phase !== 'ready' && phase !== 'timeout' && (
          <View style={s.dots}>
            {[dot1, dot2, dot3].map((d, i) => (
              <Animated.View key={i} style={[s.dot, { opacity: d }]} />
            ))}
          </View>
        )}

        {/* Succès */}
        {phase === 'ready' && (
          <View style={s.readyRow}>
            <View style={s.readyDot} />
            <Text style={s.readyText}>Connecté</Text>
          </View>
        )}

        {/* Timeout — bouton retry */}
        {phase === 'timeout' && (
          <TouchableOpacity style={s.retryBtn} onPress={onReady} activeOpacity={0.8}>
            <Text style={s.retryText}>Accéder quand même</Text>
          </TouchableOpacity>
        )}

        {/* Durée discrète */}
        {phase === 'waking' && elapsed > 5 && (
          <Text style={s.elapsed}>{elapsed}s</Text>
        )}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.cremeIvoire,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    width: '80%',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconRing: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: Colors.champagne,
    borderWidth: 1, borderColor: Colors.parchemin,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  iconText:  { fontSize: 36 },
  title:     { ...Typography.h3, color: Colors.brunMoka, textAlign: 'center' },
  sub:       { ...Typography.body, color: Colors.brunMoyen, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.md },
  dots:      { flexDirection: 'row', gap: 8, marginTop: Spacing.sm },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.lieDeVin },
  readyRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm },
  readyDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.vertSauge },
  readyText: { ...Typography.bodySmall, color: Colors.vertSauge, fontWeight: '700' },
  retryBtn:  {
    marginTop: Spacing.lg,
    backgroundColor: Colors.lieDeVin,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  retryText: { ...Typography.bodySmall, color: Colors.white, fontWeight: '700' },
  elapsed:   { ...Typography.caption, color: Colors.brunClair, marginTop: Spacing.xs },
});
