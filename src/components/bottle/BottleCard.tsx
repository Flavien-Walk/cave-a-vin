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
  compact?: boolean;
}

export const BottleCard: React.FC<BottleCardProps> = ({ bottle, onPress, compact = false }) => {
  const avg = getAverageNote(bottle);
  const urgent = isNearUrgent(bottle);
  const colorHex = getWineColorHex(bottle.couleur);

  if (compact) {
    return (
      <TouchableOpacity style={grid.card} onPress={onPress} activeOpacity={0.85}>
        {/* Bande couleur haute */}
        <View style={[grid.colorStrip, { backgroundColor: colorHex }]}>
          {bottle.isFavorite && (
            <Ionicons name="heart" size={12} color={Colors.white} style={grid.heart} />
          )}
          {urgent && (
            <View style={grid.urgentDot} />
          )}
        </View>
        <View style={grid.body}>
          <Text style={grid.name} numberOfLines={2}>{bottle.nom}</Text>
          {bottle.annee ? <Text style={grid.year}>{bottle.annee}</Text> : null}
          <View style={grid.footer}>
            {bottle.couleur && <WineBadge couleur={bottle.couleur} size="sm" />}
            <View style={grid.qty}>
              <Text style={grid.qtyText}>{bottle.quantite}</Text>
            </View>
          </View>
          {avg !== null && (
            <View style={grid.noteRow}>
              <Ionicons name="star" size={10} color={Colors.ambreChaud} />
              <Text style={grid.note}>{avg.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={list.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${bottle.nom}${bottle.annee ? ', ' + bottle.annee : ''}`}
    >
      <View style={[list.colorBar, { backgroundColor: colorHex }]} />
      <View style={list.body}>
        <View style={list.nameRow}>
          <Text style={list.name} numberOfLines={1}>{bottle.nom}</Text>
          {bottle.isFavorite && <Ionicons name="heart" size={16} color={Colors.rougeAlerte} />}
        </View>
        {bottle.producteur ? <Text style={list.producer} numberOfLines={1}>{bottle.producteur}</Text> : null}
        <View style={list.metaRow}>
          {bottle.region ? <Text style={list.meta}>{bottle.region}</Text> : null}
          {bottle.region && bottle.annee ? <Text style={list.metaSep}>·</Text> : null}
          {bottle.annee ? <Text style={list.meta}>{bottle.annee}</Text> : null}
          {bottle.cave ? (
            <>
              <Text style={list.metaSep}>·</Text>
              <Text style={list.meta} numberOfLines={1}>{bottle.cave}</Text>
            </>
          ) : null}
        </View>
        <View style={list.footer}>
          <View style={list.badges}>
            {bottle.couleur && <WineBadge couleur={bottle.couleur} size="sm" />}
            <QuantityBadge quantity={bottle.quantite} urgent={urgent} />
            {urgent && (
              <View style={list.alertBadge}>
                <Ionicons name="time-outline" size={12} color={Colors.rougeAlerte} />
                <Text style={list.alertText}>À boire</Text>
              </View>
            )}
          </View>
          <View style={list.right}>
            {avg !== null && (
              <View style={list.noteRow}>
                <Ionicons name="star" size={12} color={Colors.ambreChaud} />
                <Text style={list.note}>{avg.toFixed(1)}</Text>
              </View>
            )}
            {bottle.prixAchat ? <Text style={list.price}>{formatPrice(bottle.prixAchat)}</Text> : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── List mode styles ──────────────────────────────────────────────────────────

const list = StyleSheet.create({
  card:      { flexDirection: 'row', backgroundColor: Colors.champagne, borderRadius: Radius.lg, marginBottom: Spacing.sm, overflow: 'hidden', ...Shadow.sm },
  colorBar:  { width: 5 },
  body:      { flex: 1, padding: Spacing.md, gap: 3 },
  nameRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  name:      { ...Typography.h4, flex: 1 },
  producer:  { ...Typography.bodySmall, color: Colors.brunMoyen },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  meta:      { ...Typography.caption, color: Colors.brunClair },
  metaSep:   { ...Typography.caption, color: Colors.parchemin },
  footer:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  badges:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 },
  alertBadge:{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.rougeAlerteLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  alertText: { fontSize: 11, fontWeight: '600', color: Colors.rougeAlerte },
  right:     { alignItems: 'flex-end', gap: 2 },
  noteRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  note:      { fontSize: 12, fontWeight: '600', color: Colors.ambreChaud },
  price:     { fontSize: 11, color: Colors.brunClair },
});

// ── Grid / compact mode styles ────────────────────────────────────────────────

const grid = StyleSheet.create({
  card:        { flex: 1, margin: 4, backgroundColor: Colors.champagne, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm, minHeight: 130 },
  colorStrip:  { height: 36, position: 'relative' },
  heart:       { position: 'absolute', top: 6, right: 6 },
  urgentDot:   { position: 'absolute', top: 6, left: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.rougeAlerte },
  body:        { padding: Spacing.sm, gap: 4, flex: 1 },
  name:        { fontSize: 13, fontWeight: '700', color: Colors.brunMoka, lineHeight: 17 },
  year:        { fontSize: 11, color: Colors.brunClair },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  qty:         { backgroundColor: Colors.parchemin, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  qtyText:     { fontSize: 11, fontWeight: '700', color: Colors.brunMoka },
  noteRow:     { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  note:        { fontSize: 10, fontWeight: '600', color: Colors.ambreChaud },
});
