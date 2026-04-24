import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants';

/**
 * Logo CAVOU — bouteille minimaliste dessinée avec des Views RN.
 * Pas d'icône de librairie. Pas d'emoji.
 *
 * Anatomie (de haut en bas) :
 *   [capsule / foil — ambreChaud]
 *   [col / neck — ivoire]
 *   [épaule + corps — ivoire, arrondi haut]
 *     ↳ [remplissage vin — gradient lieDeVin, animé si fillProgress fourni]
 *     ↳ [reflet latéral — shine subtil]
 */

interface CavouLogoProps {
  /** Hauteur cible de la bouteille (hors wordmark). Base interne : 72px. */
  size?: number;
  /** Affiche "CAVOU / C'EST VOTRE CAVE" sous la bouteille. */
  showWordmark?: boolean;
  /** Mode fond sombre (splash gradient) — bouteille ivoire + texte or. */
  dark?: boolean;
  /**
   * Animated.Value 0→1 qui pilote la montée du vin dans la bouteille.
   * Si absent, le vin est affiché à un niveau statique (50 %).
   */
  fillProgress?: Animated.Value;
}

// Proportions définies pour une hauteur de base de 72 px.
// Toutes les dimensions sont multipliées par (size / BASE).
const BASE       = 72;
const CAP_W_R    = 13 / BASE;   // largeur capsule
const CAP_H_R    =  5 / BASE;   // hauteur capsule
const NK_W_R     =  9 / BASE;   // largeur col
const NK_H_R     = 15 / BASE;   // hauteur col
const BD_W_R     = 24 / BASE;   // largeur corps
const BD_H_R     = 52 / BASE;   // hauteur corps
const BD_TOP_R   = 10 / BASE;   // radius haut corps (épaule)
const BD_BOT_R   =  8 / BASE;   // radius bas corps
const WINE_MAX_R = 30 / BASE;   // hauteur max du remplissage vin

export function CavouLogo({
  size = 72,
  showWordmark = false,
  dark = false,
  fillProgress,
}: CavouLogoProps) {
  const sc = size / BASE;

  const CAP_W  = CAP_W_R  * BASE * sc;
  const CAP_H  = CAP_H_R  * BASE * sc;
  const NK_W   = NK_W_R   * BASE * sc;
  const NK_H   = NK_H_R   * BASE * sc;
  const BD_W   = BD_W_R   * BASE * sc;
  const BD_H   = BD_H_R   * BASE * sc;
  const BD_TOP = BD_TOP_R * BASE * sc;
  const BD_BOT = BD_BOT_R * BASE * sc;
  const WINE_MAX = WINE_MAX_R * BASE * sc;

  // Couleurs selon le mode
  const bottleColor = Colors.cremeIvoire;  // corps de la bouteille toujours ivoire
  const capColor    = Colors.ambreChaud;
  const wineLight   = dark ? Colors.lieDeVin + 'CC' : Colors.lieDeVin;
  const wineDark    = '#2A0A15';
  const shineAlpha  = 'rgba(255,255,255,0.30)';

  // Hauteur animée du remplissage (0 → WINE_MAX) ou statique à 52 %
  const wineH: number | Animated.AnimatedInterpolation<number> = fillProgress
    ? fillProgress.interpolate({ inputRange: [0, 1], outputRange: [0, WINE_MAX] })
    : WINE_MAX * 0.52;

  return (
    <View style={ss.root}>
      {/* ── Bouteille ── */}
      <View style={{ alignItems: 'center' }}>

        {/* Capsule / foil — or chaud */}
        <View style={{
          width: CAP_W,
          height: CAP_H,
          borderRadius: CAP_H / 2,
          backgroundColor: capColor,
        }} />

        {/* Col / neck — ivoire */}
        <View style={{
          width: NK_W,
          height: NK_H,
          backgroundColor: bottleColor,
        }} />

        {/* Corps — borderTop crée la transition d'épaule */}
        <View style={{
          width: BD_W,
          height: BD_H,
          borderTopLeftRadius: BD_TOP,
          borderTopRightRadius: BD_TOP,
          borderBottomLeftRadius: BD_BOT,
          borderBottomRightRadius: BD_BOT,
          overflow: 'hidden',
          backgroundColor: bottleColor,
        }}>

          {/* Remplissage vin — monte depuis le bas */}
          <Animated.View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: wineH as any,   // number ou AnimatedInterpolation
            overflow: 'hidden',
          }}>
            {/* Gradient ancré en bas du conteneur animé */}
            <LinearGradient
              colors={[wineLight, wineDark]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: WINE_MAX,   // hauteur max du gradient
              }}
            />
          </Animated.View>

          {/* Reflet latéral — illusion de verre */}
          <View style={{
            position: 'absolute',
            top: 5 * sc,
            left: 5 * sc,
            width: 3 * sc,
            height: BD_H * 0.42,
            borderRadius: 1.5 * sc,
            backgroundColor: shineAlpha,
          }} />

        </View>
      </View>

      {/* ── Wordmark ── */}
      {showWordmark && (
        <View style={ss.wordmark}>
          <Text style={[ss.brand, { color: dark ? Colors.ambreChaud : Colors.lieDeVin }]}>
            CAVOU
          </Text>
          <Text style={[ss.tagline, { color: dark ? 'rgba(255,255,255,0.40)' : Colors.brunClair }]}>
            C'EST VOTRE CAVE
          </Text>
        </View>
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  root:     { alignItems: 'center', gap: 16 },
  wordmark: { alignItems: 'center', gap: 5 },
  brand:    { fontSize: 22, fontWeight: '900', letterSpacing: 6, textTransform: 'uppercase' },
  tagline:  { fontSize: 8, fontWeight: '600', letterSpacing: 2.5, textTransform: 'uppercase' },
});
