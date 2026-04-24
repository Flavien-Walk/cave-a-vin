import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';

interface CavouLogoProps {
  size?: number;
  showWordmark?: boolean;
  /** true = fond sombre (gradient lieDeVin) — icône + texte en or */
  dark?: boolean;
}

export function CavouLogo({ size = 56, showWordmark = false, dark = false }: CavouLogoProps) {
  const bw    = Math.max(2.5, Math.round(size * 0.055));
  const ico   = Math.round(size * 0.40);
  const arcColor = Colors.ambreChaud;
  const icoColor = dark ? Colors.ambreChaud : Colors.lieDeVin;

  return (
    <View style={ss.root}>
      {/* Arc "C" : cercle avec bord droit supprimé + icône bouteille centrée */}
      <View style={[ss.arc, {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: bw,
        borderColor: arcColor,
        borderRightWidth: 0,
      }]}>
        {/* Décalage léger à gauche pour compenser l'ouverture du C */}
        <Ionicons name="wine" size={ico} color={icoColor} style={{ marginRight: bw }} />
      </View>

      {showWordmark && (
        <View style={ss.wordmark}>
          <Text style={[ss.brand, { color: dark ? Colors.ambreChaud : Colors.lieDeVin }]}>
            CAVOU
          </Text>
          <Text style={[ss.tagline, { color: dark ? 'rgba(255,255,255,0.45)' : Colors.brunClair }]}>
            C'EST VOTRE CAVE
          </Text>
        </View>
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  root:     { alignItems: 'center', gap: 12 },
  arc:      { alignItems: 'center', justifyContent: 'center' },
  wordmark: { alignItems: 'center', gap: 4 },
  brand:    { fontSize: 22, fontWeight: '900', letterSpacing: 6, textTransform: 'uppercase' },
  tagline:  { fontSize: 8, fontWeight: '600', letterSpacing: 2.5, textTransform: 'uppercase' },
});
