import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius } from '../constants';
import { API_URL } from '../constants';
import { CavouLogo } from './CavouLogo';

type Phase = 'checking' | 'waking' | 'ready' | 'timeout';
interface Props { onReady: () => void; }

export function ServerWakeup({ onReady }: Props) {
  const [phase, setPhase]     = useState<Phase>('checking');
  const [elapsed, setElapsed] = useState(0);

  // Opacité générale (fade-out à la fin)
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  // Remplissage vin 0→1 sur 28s — pilote la bouteille comme progressbar
  const fillAnim  = useRef(new Animated.Value(0)).current;
  // Spring d'entrée sur le contenu
  const scaleAnim = useRef(new Animated.Value(0.86)).current;
  // Révélation progressive du logo
  const logoFade  = useRef(new Animated.Value(0)).current;
  // Flottement vertical doux du logo
  const floatAnim = useRef(new Animated.Value(0)).current;
  // Respiration du halo radial
  const haloAnim  = useRef(new Animated.Value(1)).current;
  // Dots
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  // ── Animations d'entrée ──
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1, tension: 60, friction: 8, useNativeDriver: true,
    }).start();
    Animated.timing(logoFade, {
      toValue: 1, duration: 900, delay: 300, useNativeDriver: true,
    }).start();
  }, []);

  // ── Remplissage vin (JS driver — anime height) ──
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: 1, duration: 28000, useNativeDriver: false,
    }).start();
  }, []);

  // ── Flottement Y du logo ──
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -7, duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0, duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ── Respiration du halo ──
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(haloAnim, {
          toValue: 1.07, duration: 3200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloAnim, {
          toValue: 1, duration: 3200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
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
    checking: 'Ouverture de votre cave…',
    waking:   'Votre cave se prépare…',
    ready:    'Cave prête !',
    timeout:  'Impossible de joindre le serveur.',
  }[phase];

  const sub = phase === 'waking'
    ? `Cela peut prendre jusqu'à 30 secondes.`
    : phase === 'timeout'
      ? 'Vérifiez votre connexion ou entrez quand même.'
      : '';

  return (
    <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>

      {/* Fond — gradient 3 stops pour plus de profondeur */}
      <LinearGradient
        colors={['#4A0F1E', '#200A12', '#080207']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Lueur centrale bordeaux */}
      <LinearGradient
        colors={['transparent', Colors.lieDeVin + '18', 'transparent']}
        style={[StyleSheet.absoluteFillObject, { transform: [{ scaleX: 1.5 }] }]}
        start={{ x: 0.5, y: 0.10 }}
        end={{ x: 0.5, y: 0.72 }}
      />

      {/* Halo radial concentrique — respire indépendamment */}
      <View style={[StyleSheet.absoluteFillObject, s.haloWrap]} pointerEvents="none">
        <Animated.View style={[s.haloOuter, { transform: [{ scale: haloAnim }] }]}>
          <View style={s.haloMid}>
            <View style={s.haloCore} />
          </View>
        </Animated.View>
      </View>

      {/* Contenu centré */}
      <Animated.View style={[s.content, { transform: [{ scale: scaleAnim }] }]}>

        {/* Logo — révélé + flottement Y */}
        <Animated.View style={{
          opacity: logoFade,
          transform: [{ translateY: floatAnim }],
        }}>
          <CavouLogo size={120} dark showWordmark fillProgress={fillAnim} />
        </Animated.View>

        {/* Séparateur doré discret */}
        <View style={s.separator} />

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

  // Halo — centré via flex sur le parent absoluteFill
  haloWrap: { alignItems: 'center', justifyContent: 'center' },
  haloOuter: {
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: Colors.lieDeVin + '0C',
    alignItems: 'center', justifyContent: 'center',
  },
  haloMid: {
    width: 210, height: 210, borderRadius: 105,
    backgroundColor: Colors.lieDeVin + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  haloCore: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.ambreChaud + '0D',
  },

  content: {
    alignItems: 'center',
    gap: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    width: '100%',
  },

  separator: {
    width: 44, height: 1,
    backgroundColor: Colors.ambreChaud + '45',
    marginVertical: -Spacing.sm,
  },

  statusBlock: { alignItems: 'center', gap: Spacing.xs },
  msg: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.82)', textAlign: 'center' },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.40)', textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.md },

  dots: { flexDirection: 'row', gap: 9 },
  dot:  { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.ambreChaud },

  readyRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  readyDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5CB85C' },
  readyText: { fontSize: 13, color: '#5CB85C', fontWeight: '700' },

  retryBtn: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  retryText: { fontSize: 13, color: Colors.white, fontWeight: '600' },

  elapsed: { fontSize: 11, color: 'rgba(255,255,255,0.25)' },
});
