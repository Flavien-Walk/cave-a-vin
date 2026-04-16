import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../src/constants';
import { useBottleStore } from '../../src/stores';
import { getWineColorHex, formatPrice, isUrgent } from '../../src/utils/bottle.utils';
import { router } from 'expo-router';
import type { CaveStats, Bottle } from '../../src/types';

const WINE_LABELS: Record<string, string> = {
  rouge: 'Rouge', blanc: 'Blanc', rosé: 'Rosé',
  effervescent: 'Effervescent', moelleux: 'Moelleux', autre: 'Autre',
};

// ── Insights engine ────────────────────────────────────────────────────────────

interface Insight { icon: any; color: string; text: string; urgent?: boolean }

function computeInsights(stats: CaveStats, bottles: Bottle[]): Insight[] {
  const insights: Insight[] = [];

  // 1. Alerte urgence
  if (stats.urgent > 0) {
    insights.push({ icon: 'warning-outline', color: Colors.rougeAlerte, urgent: true,
      text: `${stats.urgent} bouteille${stats.urgent > 1 ? 's' : ''} à ouvrir de toute urgence` });
  }

  // 2. Couleur dominante
  if (stats.byColor.length > 0 && stats.totalBottles > 0) {
    const top = [...stats.byColor].sort((a, b) => b.count - a.count)[0];
    const pct = Math.round((top.count / stats.totalBottles) * 100);
    const lbl = (WINE_LABELS[top.couleur] ?? top.couleur).toLowerCase();
    if (pct >= 60) {
      insights.push({ icon: 'wine', color: getWineColorHex(top.couleur),
        text: `Cave dominée par les ${lbl}s — ${pct}% de vos bouteilles` });
    } else if (stats.byColor.length >= 3) {
      insights.push({ icon: 'color-palette-outline', color: Colors.rosePale,
        text: `Cave bien diversifiée — ${stats.byColor.length} couleurs différentes` });
    }
  }

  // 3. Prix / valeur
  const priced = bottles.filter(b => b.prixAchat && b.prixAchat > 0);
  if (priced.length >= 3) {
    const avg = priced.reduce((s, b) => s + (b.prixAchat ?? 0), 0) / priced.length;
    const max = Math.max(...priced.map(b => b.prixAchat ?? 0));
    insights.push({ icon: 'pricetag-outline', color: Colors.ambreChaud,
      text: `Prix moyen d'achat ${Math.round(avg)} € · bouteille la plus chère ${Math.round(max)} €` });
  }

  // 4. Concentration géographique
  if (stats.byRegion.length > 0 && stats.totalBottles > 0) {
    const top = [...stats.byRegion].sort((a, b) => b.count - a.count)[0];
    const pct = Math.round((top.count / stats.totalBottles) * 100);
    if (pct >= 45) {
      insights.push({ icon: 'map-outline', color: Colors.lieDeVin,
        text: `Cave essentiellement ${top.region} (${pct}% de vos bouteilles)` });
    } else if (stats.byRegion.length >= 5) {
      insights.push({ icon: 'map-outline', color: Colors.lieDeVin,
        text: `Belle diversité régionale — ${stats.byRegion.length} régions représentées` });
    }
  }

  // 5. Notes
  const rated = bottles.filter(b => b.notePerso?.note != null);
  if (rated.length >= 3) {
    const avg = rated.reduce((s, b) => s + b.notePerso!.note, 0) / rated.length;
    insights.push({ icon: 'star-outline', color: Colors.ambreChaud,
      text: `Note moyenne ${avg.toFixed(1)}/10 sur ${rated.length} vin${rated.length > 1 ? 's' : ''} dégusté${rated.length > 1 ? 's' : ''}` });
  }

  // 6. Diversité des millésimes
  if (stats.byYear.length >= 6) {
    const years = stats.byYear.map(y => y.annee).filter(Boolean);
    const span  = years.length > 1 ? Math.max(...years) - Math.min(...years) : 0;
    insights.push({ icon: 'calendar-outline', color: Colors.brunMoyen,
      text: `${stats.byYear.length} millésimes différents — de ${Math.min(...years)} à ${Math.max(...years)} (${span} ans de cave)` });
  }

  return insights.slice(0, 5);
}

// ── Équilibre cave ─────────────────────────────────────────────────────────────

interface EquilibreItem { icon: any; color: string; text: string; ok: boolean }

function computeEquilibre(stats: CaveStats): EquilibreItem[] {
  if (!stats.totalBottles || stats.totalBottles === 0) return [];
  const byC: Record<string, number> = {};
  stats.byColor.forEach(c => { byC[c.couleur] = Math.round((c.count / stats.totalBottles) * 100); });

  const items: EquilibreItem[] = [];

  const rougePct = byC['rouge'] ?? 0;
  const blancPct = byC['blanc'] ?? 0;
  const rosePct  = byC['rosé']  ?? 0;
  const effPct   = byC['effervescent'] ?? 0;
  const moeuxPct = byC['moelleux'] ?? 0;

  if (rougePct > 75) {
    items.push({ icon: 'alert-circle-outline', color: Colors.rougeAlerte, ok: false,
      text: `${rougePct}% de rouges — cave très orientée rouge, pensez à diversifier avec des blancs ou rosés` });
  } else if (rougePct >= 50) {
    items.push({ icon: 'checkmark-circle-outline', color: Colors.vertSauge, ok: true,
      text: `${rougePct}% de rouges — bonne proportion pour une cave polyvalente` });
  }

  if (blancPct === 0 && stats.totalBottles > 5) {
    items.push({ icon: 'alert-circle-outline', color: Colors.ambreChaud, ok: false,
      text: `Aucun blanc — ajoutez des vins blancs pour les poissons, crustacés et fromages frais` });
  } else if (blancPct >= 20) {
    items.push({ icon: 'checkmark-circle-outline', color: Colors.vertSauge, ok: true,
      text: `${blancPct}% de blancs — bonne représentation des vins blancs` });
  }

  if (rosePct === 0 && stats.totalBottles > 8) {
    items.push({ icon: 'information-circle-outline', color: Colors.brunClair, ok: false,
      text: `Aucun rosé — les rosés sont parfaits pour l'été et la cuisine méditerranéenne` });
  }

  if (effPct === 0 && stats.totalBottles > 6) {
    items.push({ icon: 'information-circle-outline', color: Colors.brunClair, ok: false,
      text: `Pas d'effervescent — gardez quelques Champagnes ou Crémants pour les occasions` });
  } else if (effPct >= 10) {
    items.push({ icon: 'checkmark-circle-outline', color: Colors.vertSauge, ok: true,
      text: `${effPct}% d'effervescents — parfait pour ne jamais manquer une occasion de célébrer` });
  }

  if (moeuxPct >= 10) {
    items.push({ icon: 'checkmark-circle-outline', color: Colors.vertSauge, ok: true,
      text: `${moeuxPct}% de moelleux/liquoreux — idéal pour les fromages et les desserts` });
  }

  return items.slice(0, 4);
}

// ── Profil textuel ────────────────────────────────────────────────────────────

function computeProfil(stats: CaveStats, bottles: Bottle[]): string[] {
  if (!stats.totalBottles || stats.totalBottles === 0) return [];
  const lines: string[] = [];

  // Style de cave (simple/collectionneur)
  if (stats.totalReferences >= stats.totalBottles * 0.8) {
    lines.push('Vous achetez souvent à la bouteille unique — profil explorateur et curieux.');
  } else if (stats.totalReferences <= stats.totalBottles * 0.3) {
    lines.push('Vous constituez des séries — profil collectionneur avec des coups de cœur approfondis.');
  } else {
    lines.push('Profil équilibré — vous alternez entre découvertes et valeurs sûres.');
  }

  // Orientation géographique
  if (stats.byRegion.length > 0) {
    const top = [...stats.byRegion].sort((a, b) => b.count - a.count)[0];
    const pct = Math.round((top.count / stats.totalBottles) * 100);
    if (pct >= 40) {
      lines.push(`Penchant affirmé pour ${top.region} (${pct}% de votre cave).`);
    } else if (stats.byRegion.length >= 6) {
      lines.push(`Amateur curieux — ${stats.byRegion.length} régions viticoles dans votre cave.`);
    }
  }

  // Couleur préférée
  const top = [...stats.byColor].sort((a, b) => b.count - a.count)[0];
  if (top) {
    const lbl = WINE_LABELS[top.couleur] ?? top.couleur;
    lines.push(`Votre couleur de prédilection est le ${lbl.toLowerCase()}.`);
  }

  // Millésimes
  const recentBottles = bottles.filter(b => b.annee && b.annee >= new Date().getFullYear() - 5);
  const oldBottles    = bottles.filter(b => b.annee && b.annee <= new Date().getFullYear() - 15);
  if (oldBottles.length >= 5 && oldBottles.length > recentBottles.length) {
    lines.push('Vous préférez les vins de garde — belle patience de vigneron.');
  } else if (recentBottles.length >= 5 && recentBottles.length > oldBottles.length * 2) {
    lines.push('Vous achetez surtout des millésimes récents — style accessible et prêt-à-boire.');
  }

  return lines.slice(0, 3);
}

// ── Recommandations ────────────────────────────────────────────────────────────

function computeRecommandations(stats: CaveStats, bottles: Bottle[]): string[] {
  if (!stats.totalBottles || stats.totalBottles === 0) return [];
  const recs: string[] = [];
  const byC: Record<string, number> = {};
  stats.byColor.forEach(c => { byC[c.couleur] = c.count; });
  const total = stats.totalBottles;

  if (!byC['blanc'] || byC['blanc'] < total * 0.1) {
    recs.push('Ajoutez quelques vins blancs — indispensables pour les poissons, crustacés et fromages de chèvre.');
  }
  if (!byC['effervescent']) {
    recs.push('Quelques bouteilles de Champagne ou Crémant s\'imposent — pour ne jamais être pris au dépourvu.');
  }
  if (!byC['moelleux']) {
    recs.push('Un Sauternes ou Banyuls sublimerait votre prochain foie gras ou dessert au chocolat.');
  }
  if (stats.urgent > 3) {
    recs.push(`Vous avez ${stats.urgent} bouteilles urgentes — organisez une dégustation pour les valoriser avant qu'il ne soit trop tard.`);
  }
  const unpriced = bottles.filter(b => !b.prixAchat || b.prixAchat === 0).length;
  if (unpriced > total * 0.4) {
    recs.push(`${unpriced} bouteilles n'ont pas de prix renseigné — complétez-les pour suivre la valeur réelle de votre cave.`);
  }
  const unrated = bottles.filter(b => !b.notePerso?.note).length;
  if (unrated > total * 0.5) {
    recs.push('Notez vos bouteilles au fur et à mesure — cela améliore les recommandations d\'accords.');
  }

  return recs.slice(0, 4);
}

// ── Goûts par couleur ─────────────────────────────────────────────────────────

interface TasteItem { couleur: string; avg: number; count: number }

function computeGoûts(bottles: Bottle[]): TasteItem[] {
  const byColor: Record<string, { sum: number; count: number }> = {};
  for (const b of bottles) {
    if (!b.notePerso?.note || !b.couleur) continue;
    const c = b.couleur.toLowerCase();
    if (!byColor[c]) byColor[c] = { sum: 0, count: 0 };
    byColor[c].sum   += b.notePerso.note;
    byColor[c].count += 1;
  }
  return Object.entries(byColor)
    .filter(([, v]) => v.count >= 2)
    .map(([couleur, v]) => ({ couleur, avg: Math.round((v.sum / v.count) * 10) / 10, count: v.count }))
    .sort((a, b) => b.avg - a.avg);
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const { stats, bottles, isStatsLoading, fetchStats } = useBottleStore();
  useEffect(() => { fetchStats(); }, []);

  const insights        = useMemo(() => stats && bottles.length > 0 ? computeInsights(stats, bottles)       : [], [stats, bottles]);
  const equilibre       = useMemo(() => stats ? computeEquilibre(stats)                                      : [], [stats]);
  const profil          = useMemo(() => stats ? computeProfil(stats, bottles)                                : [], [stats, bottles]);
  const recommandations = useMemo(() => stats ? computeRecommandations(stats, bottles)                       : [], [stats, bottles]);
  const goûts           = useMemo(() => computeGoûts(bottles), [bottles]);

  const urgentList = useMemo(() => bottles.filter(b => isUrgent(b) && b.quantite > 0), [bottles]);
  const lowStock   = useMemo(() => bottles.filter(b => b.quantite === 1 && !isUrgent(b)), [bottles]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={isStatsLoading} onRefresh={fetchStats} tintColor={Colors.lieDeVin} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Analyse</Text>
          <Text style={s.subtitle}>Tableau de bord personnel</Text>
        </View>

        {isStatsLoading && (
          <ActivityIndicator color={Colors.lieDeVin} style={{ marginTop: Spacing.xxxl }} />
        )}

        {!isStatsLoading && !stats && (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="stats-chart-outline" size={36} color={Colors.parchemin} />
            </View>
            <Text style={s.emptyTitle}>Aucune donnée</Text>
            <Text style={s.emptyText}>Ajoutez des bouteilles pour voir vos statistiques.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/(tabs)/add')}>
              <Text style={s.emptyBtnText}>Ajouter une bouteille</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isStatsLoading && stats && (
          <>
            {/* ── Hero KPIs ── */}
            <View style={s.heroCard}>
              <TouchableOpacity style={s.heroCell} onPress={() => router.push('/(tabs)/cave')} activeOpacity={0.7}>
                <Text style={s.heroValue}>{stats.totalBottles.toLocaleString('fr-FR')}</Text>
                <Text style={s.heroLabel}>bouteilles</Text>
                <Text style={s.heroSub}>{stats.totalReferences} référence{stats.totalReferences !== 1 ? 's' : ''}</Text>
              </TouchableOpacity>
              <View style={s.heroSep} />
              <TouchableOpacity style={s.heroCell} onPress={() => router.push('/cave-value' as any)} activeOpacity={0.7}>
                <Text style={[s.heroValue, { color: Colors.ambreChaud }]}>{formatPrice(stats.totalValue)}</Text>
                <Text style={s.heroLabel}>valeur estimée</Text>
                <Text style={s.heroSub}>détail ›</Text>
              </TouchableOpacity>
            </View>

            {/* ── Ligne rapide Favoris / À boire / Bues ── */}
            <View style={s.quickRow}>
              <TouchableOpacity
                style={[s.quickCell, { borderColor: Colors.rosePale + '70' }]}
                onPress={() => router.push({ pathname: '/cave-filtered', params: { filter: 'favoritesOnly', title: 'Favoris' } } as any)}
                activeOpacity={0.75}
              >
                <Ionicons name="heart" size={18} color={Colors.rosePale} />
                <Text style={[s.quickValue, { color: Colors.rosePale }]}>{stats.favorites}</Text>
                <Text style={s.quickLabel}>Favoris</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.quickCell, { borderColor: Colors.rougeAlerte + '60' }]}
                onPress={() => router.push({ pathname: '/cave-filtered', params: { filter: 'urgentOnly', title: 'À boire bientôt' } } as any)}
                activeOpacity={0.75}
              >
                <Ionicons name="time-outline" size={18} color={Colors.rougeAlerte} />
                <Text style={[s.quickValue, { color: Colors.rougeAlerte }]}>{stats.urgent}</Text>
                <Text style={s.quickLabel}>À boire</Text>
              </TouchableOpacity>
              <View style={[s.quickCell, { borderColor: Colors.vertSauge + '60' }]}>
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.vertSauge} />
                <Text style={[s.quickValue, { color: Colors.vertSauge }]}>{stats.consumed?.total ?? 0}</Text>
                <Text style={s.quickLabel}>Bues</Text>
              </View>
            </View>

            {/* ── Insights ── */}
            {insights.length > 0 && (
              <SectionCard icon="bulb-outline" label="Analyse de votre cave" color={Colors.ambreChaud}>
                {insights.map((insight, i) => (
                  <View key={i} style={[s.insightRow, insight.urgent && s.insightRowUrgent]}>
                    <View style={[s.insightDot, { backgroundColor: insight.color }]} />
                    <Text style={[s.insightText, insight.urgent && { color: Colors.rougeAlerte, fontWeight: '600' }]}>{insight.text}</Text>
                  </View>
                ))}
              </SectionCard>
            )}

            {/* ── Profil de cave ── */}
            {profil.length > 0 && (
              <SectionCard icon="person-outline" label="Mon profil" color={Colors.lieDeVin}>
                {profil.map((line, i) => (
                  <View key={i} style={s.profilRow}>
                    <Ionicons name="chevron-forward" size={12} color={Colors.lieDeVin} style={{ marginTop: 3 }} />
                    <Text style={s.profilText}>{line}</Text>
                  </View>
                ))}
              </SectionCard>
            )}

            {/* ── Composition par couleur ── */}
            {stats.byColor.length > 0 && (
              <SectionCard icon="color-palette-outline" label="Composition" color={Colors.rosePale}>
                {[...stats.byColor]
                  .sort((a, b) => b.count - a.count)
                  .map(c => {
                    const pct = Math.round((c.count / stats.totalBottles) * 100);
                    return (
                      <BarRow key={c.couleur} dot={getWineColorHex(c.couleur)}
                        label={WINE_LABELS[c.couleur] ?? c.couleur}
                        pct={pct} fill={getWineColorHex(c.couleur)} count={c.count} suffix={`${pct}%`}
                      />
                    );
                  })}
              </SectionCard>
            )}

            {/* ── Équilibre ── */}
            {equilibre.length > 0 && (
              <SectionCard icon="scale-outline" label="Équilibre de cave" color={Colors.vertSauge}>
                {equilibre.map((item, i) => (
                  <View key={i} style={[s.insightRow, !item.ok && s.insightRowWarn]}>
                    <Ionicons name={item.icon} size={14} color={item.color} style={{ marginTop: 1, flexShrink: 0 }} />
                    <Text style={[s.insightText, { color: item.ok ? Colors.brunMoyen : item.color }]}>{item.text}</Text>
                  </View>
                ))}
              </SectionCard>
            )}

            {/* ── Goûts (notes par couleur) ── */}
            {goûts.length >= 2 && (
              <SectionCard icon="star-outline" label="Mes goûts" color={Colors.ambreChaud}>
                <Text style={s.goûtsSub}>Vos notes moyennes par couleur</Text>
                {goûts.map(g => (
                  <View key={g.couleur} style={s.goûtRow}>
                    <View style={[s.goûtDot, { backgroundColor: getWineColorHex(g.couleur) }]} />
                    <Text style={s.goûtLabel}>{WINE_LABELS[g.couleur] ?? g.couleur}</Text>
                    <View style={s.goûtStars}>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <View key={n} style={[s.goûtBar, { backgroundColor: n <= Math.round(g.avg) ? Colors.ambreChaud : Colors.parchemin }]} />
                      ))}
                    </View>
                    <Text style={s.goûtNote}>{g.avg.toFixed(1)}</Text>
                    <Text style={s.goûtCount}>({g.count})</Text>
                  </View>
                ))}
              </SectionCard>
            )}

            {/* ── À surveiller ── */}
            {(urgentList.length > 0 || lowStock.length > 0) && (
              <SectionCard icon="eye-outline" label="À surveiller" color={Colors.rougeAlerte}>
                {urgentList.length > 0 && (
                  <TouchableOpacity
                    style={s.surveillerRow}
                    onPress={() => router.push({ pathname: '/cave-filtered', params: { filter: 'urgentOnly', title: 'À boire bientôt' } } as any)}
                    activeOpacity={0.75}
                  >
                    <View style={[s.surveillerDot, { backgroundColor: Colors.rougeAlerte }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.surveillerLabel, { color: Colors.rougeAlerte }]}>
                        {urgentList.length} bouteille{urgentList.length > 1 ? 's' : ''} à ouvrir rapidement
                      </Text>
                      <Text style={s.surveillerSub}>Dépassent ou approchent leur date optimale</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={Colors.rougeAlerte} />
                  </TouchableOpacity>
                )}
                {lowStock.length > 0 && (
                  <View style={[s.surveillerRow, { borderTopWidth: urgentList.length > 0 ? 1 : 0, borderTopColor: Colors.parchemin, paddingTop: urgentList.length > 0 ? Spacing.md : 0 }]}>
                    <View style={[s.surveillerDot, { backgroundColor: Colors.ambreChaud }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.surveillerLabel, { color: Colors.ambreChaud }]}>
                        {lowStock.length} référence{lowStock.length > 1 ? 's' : ''} en dernière bouteille
                      </Text>
                      <Text style={s.surveillerSub}>Réapprovisionnez avant d'être à sec</Text>
                    </View>
                  </View>
                )}
              </SectionCard>
            )}

            {/* ── Consommation ── */}
            <SectionCard icon="trending-down-outline" label="Consommation" color={Colors.vertSauge}>
              <View style={s.consumRow}>
                <ConsumeCell value={stats.consumed?.thisMonth ?? 0} label="Ce mois" />
                <View style={s.consumDivider} />
                <ConsumeCell value={stats.consumed?.thisYear ?? 0} label="Cette année" />
                <View style={s.consumDivider} />
                <ConsumeCell value={stats.consumed?.total ?? 0} label="Total" />
              </View>
            </SectionCard>

            {/* ── Par cave ── */}
            {(stats.byCave ?? []).length > 0 && (
              <SectionCard icon="home-outline" label="Par cave" color={Colors.ambreChaud}>
                {[...(stats.byCave ?? [])].sort((a, b) => b.count - a.count).map(c => {
                  const max = Math.max(...(stats.byCave ?? []).map(x => x.count), 1);
                  return <BarRow key={c.cave} dot={Colors.ambreChaud} label={c.cave} pct={Math.round((c.count / max) * 100)} fill={Colors.ambreChaud} count={c.count} />;
                })}
              </SectionCard>
            )}

            {/* ── Top régions ── */}
            {stats.byRegion.length > 0 && (
              <SectionCard icon="map-outline" label="Top régions" color={Colors.lieDeVin}>
                {[...stats.byRegion].sort((a, b) => b.count - a.count).slice(0, 8).map(r => {
                  const max = Math.max(...stats.byRegion.map(x => x.count), 1);
                  return <BarRow key={r.region} dot={Colors.lieDeVin} label={r.region} pct={Math.round((r.count / max) * 100)} fill={Colors.lieDeVin} count={r.count} />;
                })}
              </SectionCard>
            )}

            {/* ── Millésimes ── */}
            {stats.byYear.length > 0 && (
              <SectionCard icon="calendar-outline" label="Millésimes" color={Colors.blancDore}>
                {[...stats.byYear].sort((a, b) => b.annee - a.annee).slice(0, 12).map(y => {
                  const max = Math.max(...stats.byYear.map(x => x.count), 1);
                  return <BarRow key={y.annee} dot={Colors.blancDore} label={String(y.annee)} pct={Math.round((y.count / max) * 100)} fill={Colors.blancDore} count={y.count} />;
                })}
              </SectionCard>
            )}

            {/* ── Recommandations ── */}
            {recommandations.length > 0 && (
              <SectionCard icon="compass-outline" label="Recommandations" color={Colors.brunMoyen}>
                {recommandations.map((rec, i) => (
                  <View key={i} style={s.recRow}>
                    <View style={s.recBullet}>
                      <Text style={s.recBulletText}>{i + 1}</Text>
                    </View>
                    <Text style={s.recText}>{rec}</Text>
                  </View>
                ))}
              </SectionCard>
            )}
          </>
        )}

        <View style={{ height: Spacing.xxxl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionCard({ icon, label, color, children }: { icon: any; label: string; color: string; children: React.ReactNode }) {
  return (
    <View style={[sc.card, { borderLeftColor: color }]}>
      <View style={sc.head}>
        <View style={[sc.iconBox, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={14} color={color} />
        </View>
        <Text style={[sc.label, { color }]}>{label.toUpperCase()}</Text>
      </View>
      {children}
    </View>
  );
}
const sc = StyleSheet.create({
  card:    { backgroundColor: Colors.champagne, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.parchemin, borderLeftWidth: 3, ...Shadow.sm },
  head:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  iconBox: { width: 26, height: 26, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
});

function ConsumeCell({ value, label }: { value: number; label: string }) {
  return (
    <View style={cc.cell}>
      <Text style={cc.value}>{value.toLocaleString('fr-FR')}</Text>
      <Text style={cc.label}>{label}</Text>
    </View>
  );
}
const cc = StyleSheet.create({
  cell:  { flex: 1, alignItems: 'center', gap: 2 },
  value: { fontSize: 26, fontWeight: '800', color: Colors.lieDeVin, letterSpacing: -0.5 },
  label: { ...Typography.caption, color: Colors.brunMoyen },
});

function BarRow({ dot, label, pct, fill, count, suffix }: { dot: string; label: string; pct: number; fill: string; count: number; suffix?: string }) {
  return (
    <View style={br.row}>
      <View style={[br.dot, { backgroundColor: dot }]} />
      <Text style={br.label} numberOfLines={1}>{label}</Text>
      <View style={br.track}>
        <View style={[br.fill, { width: (Math.max(pct, 4) + '%') as any, backgroundColor: fill + 'CC' }]} />
      </View>
      <Text style={br.count}>{suffix ?? count}</Text>
    </View>
  );
}
const br = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: Spacing.sm },
  dot:   { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  label: { fontSize: 12, width: 100, color: Colors.brunMoyen, flexShrink: 0 },
  track: { flex: 1, height: 8, backgroundColor: Colors.parchemin, borderRadius: Radius.full, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: Radius.full },
  count: { fontSize: 12, width: 36, textAlign: 'right', color: Colors.brunMoka, fontWeight: '700' },
});

// ── Styles principaux ──────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.cremeIvoire },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  header:   { marginBottom: Spacing.lg },
  title:    { fontSize: 26, fontWeight: '800', color: Colors.brunMoka, letterSpacing: -0.5 },
  subtitle: { ...Typography.caption, color: Colors.brunMoyen, marginTop: 3 },

  empty:        { alignItems: 'center', paddingTop: Spacing.xxxl * 2, gap: Spacing.md },
  emptyIcon:    { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: Colors.brunMoyen },
  emptyText:    { ...Typography.body, color: Colors.brunClair, textAlign: 'center', paddingHorizontal: Spacing.xl },
  emptyBtn:     { backgroundColor: Colors.lieDeVin, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.full, marginTop: Spacing.sm },
  emptyBtnText: { ...Typography.bodySmall, fontWeight: '700', color: Colors.white },

  // Hero
  heroCard:  { flexDirection: 'row', backgroundColor: Colors.lieDeVin, borderRadius: Radius.xl, paddingVertical: Spacing.xl, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm },
  heroCell:  { flex: 1, alignItems: 'center', gap: 3 },
  heroSep:   { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  heroValue: { fontSize: 28, fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.3 },
  heroSub:   { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 1 },

  // Quick row
  quickRow:  { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  quickCell: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: Colors.champagne, borderRadius: Radius.xl, paddingVertical: Spacing.md, borderWidth: 1, ...Shadow.sm },
  quickValue:{ fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  quickLabel:{ fontSize: 10, color: Colors.brunClair },

  // Insights
  insightRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  insightRowUrgent: { backgroundColor: Colors.rougeAlerteLight, marginHorizontal: -Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.md },
  insightRowWarn:   { opacity: 0.95 },
  insightDot:       { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  insightText:      { flex: 1, fontSize: 13, color: Colors.brunMoyen, lineHeight: 19 },

  // Profil
  profilRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  profilText: { flex: 1, fontSize: 13, color: Colors.brunMoyen, lineHeight: 19, fontStyle: 'italic' },

  // Goûts
  goûtsSub:   { fontSize: 11, color: Colors.brunClair, marginBottom: Spacing.md },
  goûtRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  goûtDot:    { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  goûtLabel:  { fontSize: 12, color: Colors.brunMoyen, width: 84, flexShrink: 0 },
  goûtStars:  { flex: 1, flexDirection: 'row', gap: 2 },
  goûtBar:    { flex: 1, height: 6, borderRadius: 3 },
  goûtNote:   { fontSize: 12, fontWeight: '700', color: Colors.ambreChaud, width: 28, textAlign: 'right' },
  goûtCount:  { fontSize: 10, color: Colors.brunClair, width: 24 },

  // À surveiller
  surveillerRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  surveillerDot:   { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  surveillerLabel: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  surveillerSub:   { fontSize: 11, color: Colors.brunClair, marginTop: 1 },

  // Recommandations
  recRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  recBullet:    { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.lieDeVin + '20', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  recBulletText:{ fontSize: 10, fontWeight: '800', color: Colors.lieDeVin },
  recText:      { flex: 1, fontSize: 13, color: Colors.brunMoyen, lineHeight: 19 },

  // Consumption
  consumRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  consumDivider:{ width: 1, height: 40, backgroundColor: Colors.parchemin },
});
