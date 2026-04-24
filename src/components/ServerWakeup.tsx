import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius } from '../constants';
import { API_URL } from '../constants';
import { CavouLogo } from './CavouLogo';

type Phase = 'checking' | 'waking' | 'ready' | 'timeout';
interface Props { onReady: () => void; }

export function ServerWakeup({ onReady }: Props) {
  const [phase, setPhase]     = useState<Phase>('checking');
  const [elapsed, setElapsed] = useState(0);

  // Opacity générale (fade-out à la fin)
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  // Remplissage vin 0→1 sur 28s (durée max wake-up serveur)
  const fillAnim  = useRef(new Animated.Value(0)).current;
  // Spring d'entrée sur le contenu
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  // Révélation progressive du logo
  const logoFade  = useRef(new Animated.Value(0)).current;
  // Dots
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  // ── Animations d'entrée ──
  useEffect(() => {
    // Spring sur le contenu
    Animated.spring(scaleAnim, {
      toValue: 1, tension: 65, friction: 9, useNativeDriver: true,
    }).start();
    // Logo : fade in légèrement décalé → effet de révélation
    Animated.timing(logoFade, {
      toValue: 1, duration: 1000, delay: 200, useNativeDriver: true,
    }).start();
  }, []);

  // ── Remplissage vin (JS driver — anime la hauteur) ──
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: 1, duration: 28000, useNativeDriver: false,
    }).start();
  }, []);

  // ── Dots pulsants ──
  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: 1,    duration: 480, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0.25, duration: 480, useNativeDriver: true }),
      ]));
    const [a1, a2, a3] = [pulse(dot1, 0), pulse(dot2, 200), pulse(dot3, 400)];
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  // ── Polling serveur ──
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
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3500);
        const res = await fetch(`${API_URL}/health`, { signal: ctrl.signal });
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

  return (
    <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>

      {/* Fond gradient bordeaux profond → noir vineux */}
      <LinearGradient
        colors={['#5E1226', '#1A0510']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.35, y: 0 }}
        end={{ x: 0.65, y: 1 }}
      />

      {/* Lueur centrale très subtile pour profondeur */}
      <LinearGradient
        colors={['transparent', Colors.lieDeVin + '18', 'transparent']}
        style={[StyleSheet.absoluteFillObject, { transform: [{ scaleX: 1.4 }] }]}
        start={{ x: 0.5, y: 0.2 }}
        end={{ x: 0.5, y: 0.8 }}
      />

      {/* Contenu centré */}
      <Animated.View style={[s.content, { transform: [{ scale: scaleAnim }] }]}>

        {/* Logo — révélé progressivement */}
        <Animated.View style={{ opacity: logoFade }}>
          <CavouLogo
            size={88}
            dark
            showWordmark
            fillProgress={fillAnim}
          />
        </Animated.View>

        {/* Message d'état */}
        <View style={s.statusBlock}>
          <Text style={s.msg}>{msg}</Text>
          {!!sub && <Text style={s.sub}>{sub}</Text>}
        </View>

        {/* Dots de chargement */}
        {phase !== 'ready' && phase !== 'timeout' && (
          <View style={s.dots}>
            {[dot1, dot2, dot3].map((d, i) => (
              <Animated.View key={i} style={[s.dot, { opacity: d }]} />
            ))}
          </View>
        )}

        {/* Connecté */}
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

        {/* Compteur secondes en phase waking */}
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
  content: {
    alignItems: 'center',
    gap: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    width: '100%',
  },
  statusBlock: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  msg:  { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.80)', textAlign: 'center' },
  sub:  { fontSize: 12, color: 'rgba(255,255,255,0.42)', textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.sm },
  dots: { flexDirection: 'row', gap: 8 },
  dot:  { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.ambreChaud },

  readyRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  readyDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5CB85C' },
  readyText: { fontSize: 13, color: '#5CB85C', fontWeight: '700' },

  retryBtn: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  retryText: { fontSize: 13, color: Colors.white, fontWeight: '600' },

  elapsed: { fontSize: 11, color: 'rgba(255,255,255,0.28)' },
});
