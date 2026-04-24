import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants';

interface CavouLogoProps {
  size?: number;
  showWordmark?: boolean;
  dark?: boolean;
  fillProgress?: Animated.Value;
}

// Proportions pour une hauteur de base de 80 px (tous les éléments en ratios).
const BASE       = 80;
const CAP_W_R    = 15 / BASE;   // capsule — légèrement plus large que le col
const CAP_H_R    =  6 / BASE;
const NK_W_R     =  9 / BASE;
const NK_H_R     = 17 / BASE;
const BD_W_R     = 26 / BASE;
const BD_H_R     = 54 / BASE;
const BD_TOP_R   = 12 / BASE;   // épaule prononcée
const BD_BOT_R   =  8 / BASE;
const WINE_MAX_R = 34 / BASE;   // hauteur max du vin (42 % du corps)
const LBL_MX_R   =  3 / BASE;  // marge horizontale de l'étiquette
const LBL_H_R    = 14 / BASE;  // hauteur de l'étiquette
const LBL_Y_R    =  8 / BASE;  // distance bas étiquette / bas du corps

export function CavouLogo({
  size = 80,
  showWordmark = false,
  dark = false,
  fillProgress,
}: CavouLogoProps) {
  const sc = size / BASE;

  const CAP_W    = CAP_W_R  * BASE * sc;
  const CAP_H    = CAP_H_R  * BASE * sc;
  const NK_W     = NK_W_R   * BASE * sc;
  const NK_H     = NK_H_R   * BASE * sc;
  const BD_W     = BD_W_R   * BASE * sc;
  const BD_H     = BD_H_R   * BASE * sc;
  const BD_TOP   = BD_TOP_R * BASE * sc;
  const BD_BOT   = BD_BOT_R * BASE * sc;
  const WINE_MAX = WINE_MAX_R * BASE * sc;
  const LBL_MX   = LBL_MX_R * BASE * sc;
  const LBL_H    = LBL_H_R  * BASE * sc;
  const LBL_Y    = LBL_Y_R  * BASE * sc;

  // Le wordmark grossit avec la bouteille (plafonné à 1.4× pour rester lisible)
  const wmSc = Math.min(sc, 1.4);

  const bottleColor = Colors.cremeIvoire;
  const wineLight   = dark ? Colors.lieDeVin + 'DD' : Colors.lieDeVin;
  const wineDark    = '#18040E';

  // Hauteur animée du remplissage ou statique à 52 %
  const wineH: number | Animated.AnimatedInterpolation<number> = fillProgress
    ? fillProgress.interpolate({ inputRange: [0, 1], outputRange: [0, WINE_MAX] })
    : WINE_MAX * 0.52;

  return (
    <View style={ss.root}>
      <View style={{ alignItems: 'center' }}>

        {/* Capsule foil — gradient doré chaud */}
        <LinearGradient
          colors={[Colors.ambreChaud, '#D4A840', Colors.ambreChaud + 'BB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: CAP_W, height: CAP_H, borderRadius: CAP_H / 2 }}
        />

        {/* Col */}
        <View style={{ width: NK_W, height: NK_H, backgroundColor: bottleColor }} />

        {/* Corps avec épaule arrondie */}
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
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: wineH as any, overflow: 'hidden',
          }}>
            <LinearGradient
              colors={[wineLight, wineDark]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: WINE_MAX }}
            />
          </Animated.View>

          {/* Zone étiquette — identité bouteille, visible au-dessus du vin */}
          <View style={{
            position: 'absolute',
            bottom: LBL_Y, left: LBL_MX, right: LBL_MX,
            height: LBL_H,
            borderRadius: 2 * sc,
            borderWidth: 0.5,
            borderColor: Colors.ambreChaud + '75',
            backgroundColor: 'rgba(0,0,0,0.05)',
          }}>
            <View style={{
              position: 'absolute', top: 3 * sc, left: 3 * sc, right: 3 * sc,
              height: 0.5, backgroundColor: Colors.ambreChaud + '85',
            }} />
            <View style={{
              position: 'absolute', bottom: 3 * sc, left: 3 * sc, right: 3 * sc,
              height: 0.5, backgroundColor: Colors.ambreChaud + '85',
            }} />
          </View>

          {/* Glacis verre — shimmer horizontal gauche→droite */}
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'transparent', 'rgba(0,0,0,0.04)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Reflet vertical principal */}
          <View style={{
            position: 'absolute', top: 6 * sc, left: 5 * sc,
            width: 2.5 * sc, height: BD_H * 0.44,
            borderRadius: 1.5 * sc, backgroundColor: 'rgba(255,255,255,0.33)',
          }} />

          {/* Micro-reflet secondaire */}
          <View style={{
            position: 'absolute', top: 10 * sc, left: 9 * sc,
            width: 1 * sc, height: BD_H * 0.20,
            borderRadius: 1 * sc, backgroundColor: 'rgba(255,255,255,0.16)',
          }} />

        </View>
      </View>

      {showWordmark && (
        <View style={ss.wordmark}>
          <Text style={[ss.brand, {
            color: dark ? Colors.ambreChaud : Colors.lieDeVin,
            fontSize: 22 * wmSc,
            letterSpacing: 6 * wmSc,
          }]}>
            CAVOU
          </Text>
          <Text style={[ss.tagline, {
            color: dark ? 'rgba(255,255,255,0.38)' : Colors.brunClair,
            fontSize: 8 * wmSc,
            letterSpacing: 2.5 * wmSc,
          }]}>
            C'EST VOTRE CAVE
          </Text>
        </View>
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  root:     { alignItems: 'center', gap: 16 },
  wordmark: { alignItems: 'center', gap: 6 },
  brand:    { fontWeight: '900', textTransform: 'uppercase' },
  tagline:  { fontWeight: '600', textTransform: 'uppercase' },
});
