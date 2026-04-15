import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../constants';
import { getWineColorHex, getAverageNote, isNearUrgent, formatPrice } from '../../utils/bottle.utils';
import { WineBadge, QuantityBadge } from '../ui/Badge';
import type { Bottle } from '../../types';

interface BottleCardProps {
  bottle: Bottle;
  onPress: () => void;
}

export const BottleCard: React.FC<BottleCardProps> = ({ bottle, onPress }) => {
  const avg = getAverageNote(bottle);
  const urgent = isNearUrgent(bottle);
  const colorHex = getWineColorHex(bottle.couleur);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${bottle.nom}${bottle.annee ? ', ' + bottle.annee : ''}`}
    >
      {/* Bande couleur */}
      <View style={[styles.colorBar, { backgroundColor: colorHex }]} />

      <View style={styles.body}>
        {/* Ligne 1 : nom + favori */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{bottle.nom}</Text>
          {bottle.isFavorite && (
            <Ionicons name="heart" size={16} color={Colors.rougeAlerte} />
          )}
        </View>

        {/* Ligne 2 : producteur */}
        {bottle.producteur ? (
          <Text style={styles.producer} numberOfLines={1}>{bottle.producteur}</Text>
        ) : null}

        {/* Ligne 3 : région + millésime */}
        <View style={styles.metaRow}>
          {bottle.region ? <Text style={styles.meta}>{bottle.region}</Text> : null}
          {bottle.region && bottle.annee ? <Text style={styles.metaSep}>·</Text> : null}
          {bottle.annee ? <Text style={styles.meta}>{bottle.annee}</Text> : null}
          {bottle.cave ? (
            <>
              <Text style={styles.metaSep}>·</Text>
              <Text style={styles.meta} numberOfLines={1}>{bottle.cave}</Text>
            </>
          ) : null}
        </View>

        {/* Footer : badges */}
        <View style={styles.footer}>
          <View style={styles.badges}>
            {bottle.couleur && <WineBadge couleur={bottle.couleur} size="sm" />}
            <QuantityBadge quantity={bottle.quantite} urgent={urgent} />
            {urgent && (
              <View style={styles.alertBadge}>
                <Ionicons name="time-outline" size={12} color={Colors.rougeAlerte} />
                <Text style={styles.alertText}>À boire</Text>
              </View>
            )}
          </View>

          <View style={styles.right}>
            {avg !== null && (
              <View style={styles.noteRow}>
                <Ionicons name="star" size={12} color={Colors.ambreChaud} />
                <Text style={styles.note}>{avg.toFixed(1)}</Text>
              </View>
            )}
            {bottle.prixAchat ? (
              <Text style={styles.price}>{formatPrice(bottle.prixAchat)}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.champagne,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  colorBar: { width: 5 },
  body: { flex: 1, padding: Spacing.md, gap: 3 },

  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  name:     { ...Typography.h4, flex: 1 },
  producer: { ...Typography.bodySmall, color: Colors.brunMoyen },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  meta:     { ...Typography.caption, color: Colors.brunClair },
  metaSep:  { ...Typography.caption, color: Colors.parchemin },

  footer:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  badges:  { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 },

  alertBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.rougeAlerteLight,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  alertText: { fontSize: 11, fontWeight: '600', color: Colors.rougeAlerte },

  right:   { alignItems: 'flex-end', gap: 2 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  note:    { fontSize: 12, fontWeight: '600', color: Colors.ambreChaud },
  price:   { fontSize: 11, color: Colors.brunClair },
});
