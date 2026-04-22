import type { Bottle } from '../types';
import { detectFood, type FoodPairing } from '../data/foodWinePairings';

// ── Types exportés ────────────────────────────────────────────────────────────

export type FoodType = string;

export interface FoodProfile {
  type: string;
  label: string;
  pairing: FoodPairing;
}

export interface WineRecommendation {
  bottle: Bottle;          // représentant du groupe (meilleures métadonnées)
  allOccurrences: Bottle[]; // toutes les occurrences physiques du même vin logique
  totalQty: number;         // stock total agrégé (toutes caves)
  score: number;
  match: 'ideal' | 'bon' | 'compromis';
  explanation: string;
  factors: string[];
  caveat?: string;
}

export interface RecommendationResult {
  wines: WineRecommendation[];
  message: string;
  hasIdeal: boolean;
  bestLevel: 'ideal' | 'bon' | 'compromis' | 'aucun';
  idealSuggestion?: string;
  foodLabel: string;
}

export type { RecommendationResult as RecoResult };

// ── Note utilisateur ──────────────────────────────────────────────────────────

function getUserNote(bottle: Bottle): number | null {
  const notes: number[] = [];
  if (bottle.notePerso?.note) notes.push(bottle.notePerso.note);
  if (bottle.notes?.length) {
    const avg = bottle.notes.reduce((s, n) => s + n.note, 0) / bottle.notes.length;
    notes.push(avg);
  }
  if (!notes.length) return null;
  return Math.round((notes.reduce((s, n) => s + n, 0) / notes.length) * 10) / 10;
}

// ── Normalisation ─────────────────────────────────────────────────────────────
// "Château Margaux" → "chateau margaux"  (accents + casse + espaces)
// Exportée pour être réutilisée dans add.tsx (même logique, même base métier).

export function normalizeWineStr(s: string | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// ── Identité produit ──────────────────────────────────────────────────────────
//
// Deux occurrences représentent le même vin logique si :
//   • nom normalisé identique
//   • millésime identique (ou tous deux absents)
//   • producteur compatible (même valeur normalisée, ou l'un des deux est vide)
//
// Cave et emplacement ne font PAS partie de l'identité produit.
// Un vin réparti dans plusieurs caves reste un seul vin logique.
// Deux millésimes différents = deux produits distincts → jamais regroupés.

function metaScore(b: Bottle): number {
  return (b.region ? 1 : 0) + (b.appellation ? 1 : 0) + (b.cepage ? 1 : 0) + (b.couleur ? 1 : 0);
}

function selectBetter(a: Bottle, b: Bottle): Bottle {
  if (a.quantite !== b.quantite) return a.quantite > b.quantite ? a : b;
  const aN = getUserNote(a) ?? 0, bN = getUserNote(b) ?? 0;
  if (aN !== bN) return aN > bN ? a : b;
  if (a.isFavorite !== b.isFavorite) return a.isFavorite ? a : b;
  return metaScore(a) >= metaScore(b) ? a : b;
}

interface BottleGroup {
  representative: Bottle;
  allOccurrences: Bottle[];
  totalQty: number;
}

function groupBottles(bottles: Bottle[]): BottleGroup[] {
  // Niveau 1 : grouper par nom normalisé + millésime
  const level1 = new Map<string, Bottle[]>();
  for (const b of bottles) {
    const key = normalizeWineStr(b.nom) + '\0' + String(b.annee ?? '');
    const arr = level1.get(key) ?? [];
    arr.push(b);
    level1.set(key, arr);
  }

  const result: BottleGroup[] = [];

  for (const group of level1.values()) {
    if (group.length === 1) {
      result.push({ representative: group[0], allOccurrences: [group[0]], totalQty: group[0].quantite });
      continue;
    }

    // Niveau 2 : séparer avec / sans producteur
    // • Producteur vide = entrée incomplète → absorbée dans le meilleur groupe identifié
    // • Producteurs différents NON vides → vins genuinement différents (même appellation,
    //   domaines distincts) → groupes séparés conservés
    const withProd = new Map<string, Bottle[]>();
    const withoutProd: Bottle[] = [];

    for (const b of group) {
      const prod = normalizeWineStr(b.producteur);
      if (prod) {
        const arr = withProd.get(prod) ?? [];
        arr.push(b);
        withProd.set(prod, arr);
      } else {
        withoutProd.push(b);
      }
    }

    if (withProd.size > 0) {
      const prodGroups = [...withProd.entries()].map(([, bottles]) => ({
        representative: bottles.reduce((a, b) => selectBetter(a, b)),
        allOccurrences: [...bottles],
      }));

      // Absorber les entrées sans producteur dans le meilleur groupe
      if (withoutProd.length > 0) {
        let bestIdx = 0;
        for (let i = 1; i < prodGroups.length; i++) {
          if (selectBetter(prodGroups[i].representative, prodGroups[bestIdx].representative) === prodGroups[i].representative) {
            bestIdx = i;
          }
        }
        const best = prodGroups[bestIdx];
        best.allOccurrences.push(...withoutProd);
        for (const b of withoutProd) {
          if (selectBetter(b, best.representative) === b) best.representative = b;
        }
      }

      for (const g of prodGroups) {
        result.push({
          representative: g.representative,
          allOccurrences: g.allOccurrences,
          totalQty: g.allOccurrences.reduce((s, b) => s + b.quantite, 0),
        });
      }
    } else {
      result.push({
        representative: withoutProd.reduce((a, b) => selectBetter(a, b)),
        allOccurrences: withoutProd,
        totalQty: withoutProd.reduce((s, b) => s + b.quantite, 0),
      });
    }
  }

  return result;
}

// ── Score d'un groupe contre un accord mets-vins ──────────────────────────────

function scoreGroup(
  g: BottleGroup,
  pairing: FoodPairing,
): { score: number; match: 'ideal' | 'bon' | 'compromis'; explanation: string; factors: string[]; caveat?: string } {
  const bottle = g.representative;
  const couleur = (bottle.couleur ?? '').toLowerCase().trim();
  const region  = (bottle.region  ?? '').toLowerCase().trim();
  const factors: string[] = [];
  let caveat: string | undefined;
  let baseScore = 0;
  let match: 'ideal' | 'bon' | 'compromis';

  // 1. Accord couleur
  if (pairing.ideal.couleurs.includes(couleur)) {
    baseScore = 55;
    match     = 'ideal';
    factors.push('Accord classique avec ce plat');
    if (pairing.ideal.regionsPreferees?.length) {
      const pref = pairing.ideal.regionsPreferees.some(r =>
        region.includes(r.toLowerCase()) || r.toLowerCase().includes(region)
      );
      if (pref && region) { baseScore += 12; factors.push(`Région recommandée (${bottle.region})`); }
    }
    if (pairing.regionsBonus?.length) {
      for (const rb of pairing.regionsBonus) {
        const pat = rb.pattern.toLowerCase();
        if (region.includes(pat) || (bottle.appellation ?? '').toLowerCase().includes(pat)) {
          baseScore += rb.bonus;
          factors.push(`Appellation idéale (${rb.pattern})`);
          break;
        }
      }
    }
  } else if (pairing.bon.couleurs.includes(couleur)) {
    baseScore = 28; match = 'bon';
  } else if (pairing.acceptable.couleurs.includes(couleur)) {
    baseScore = 16; match = 'compromis';
    caveat = `${pairing.texteCompromis} ${pairing.texteAchat}`;
  } else {
    baseScore = 6; match = 'compromis';
    caveat = pairing.eviter.raison
      ? `${pairing.eviter.raison} ${pairing.texteAchat}`
      : `Ce ${couleur} n'est pas recommandé ici. ${pairing.texteAchat}`;
  }

  // 2. Bonus note utilisateur (+0-20)
  const userNote = getUserNote(bottle);
  if (userNote !== null) {
    const noteBonus = Math.round((userNote / 5) * 20);
    baseScore += noteBonus;
    if (userNote >= 4.5)      factors.push(`Coup de cœur (${userNote.toFixed(1)}/5)`);
    else if (userNote >= 4)   factors.push(`Très bien noté (${userNote.toFixed(1)}/5)`);
    else if (userNote >= 3)   factors.push(`Bien noté (${userNote.toFixed(1)}/5)`);
  }

  // 3. Bonus maturité (+0-15)
  const currentYear = new Date().getFullYear();
  if (bottle.consommerAvant) {
    const yearsLeft = bottle.consommerAvant - currentYear;
    if (yearsLeft >= 0 && yearsLeft <= 2)      { baseScore += 15; factors.push('À maturité optimale'); }
    else if (yearsLeft > 2 && yearsLeft <= 5)  { baseScore += 8; }
    else if (yearsLeft < 0)                    { baseScore += 2; factors.push('Dépasse la garde recommandée'); }
  }

  // 4. Bonus stock agrégé toutes caves (+5)
  if (g.totalQty >= 2) baseScore += 5;

  // 5. Bonus favori (+5)
  if (bottle.isFavorite) { baseScore += 5; factors.push('Favori'); }

  const finalScore  = Math.min(Math.round(baseScore), 100);
  const explanation = match === 'ideal' ? pairing.texteIdeal
                    : match === 'bon'   ? pairing.texteBon
                    : pairing.texteCompromis;

  return { score: finalScore, match, explanation, factors, caveat };
}

// ── analyzeFood ───────────────────────────────────────────────────────────────

export function analyzeFood(platText: string): FoodProfile | null {
  if (!platText.trim()) return null;
  const pairing = detectFood(platText);
  if (!pairing) return null;
  return { type: pairing.id, label: platText, pairing };
}

// ── getRecommendations ────────────────────────────────────────────────────────
// `bottles` doit déjà être filtré par lieu actif si applicable.

export function getRecommendations(bottles: Bottle[], platText: string): RecommendationResult {
  const groups = groupBottles(bottles.filter(b => b.quantite > 0));

  if (!platText.trim() || !groups.length) {
    return { wines: [], message: '', hasIdeal: false, bestLevel: 'aucun', foodLabel: platText };
  }

  const pairing = detectFood(platText);

  // Plat non reconnu → top des mieux notés
  if (!pairing) {
    const topRated = groups
      .filter(g => getUserNote(g.representative) !== null)
      .sort((a, b) => (getUserNote(b.representative) ?? 0) - (getUserNote(a.representative) ?? 0))
      .slice(0, 3)
      .map(g => ({
        bottle: g.representative,
        allOccurrences: g.allOccurrences,
        totalQty: g.totalQty,
        score: Math.round(((getUserNote(g.representative) ?? 3) / 5) * 60 + 20),
        match: 'bon' as const,
        explanation: 'Sélection basée sur vos notes personnelles.',
        factors: ['Bien noté'],
      }));
    return {
      wines: topRated,
      message: topRated.length
        ? `Plat non reconnu — voici vos bouteilles les mieux notées.`
        : `Plat non reconnu — ajoutez des notes pour des suggestions personnalisées.`,
      hasIdeal: false,
      bestLevel: topRated.length ? 'bon' : 'aucun',
      foodLabel: platText,
    };
  }

  const toRec = (g: BottleGroup, s: ReturnType<typeof scoreGroup>): WineRecommendation => ({
    bottle: g.representative,
    allOccurrences: g.allOccurrences,
    totalQty: g.totalQty,
    score: s.score,
    match: s.match,
    explanation: s.explanation,
    factors: s.factors,
    caveat: s.caveat,
  });

  const scored = groups
    .map(g => ({ g, s: scoreGroup(g, pairing) }))
    .filter(x => x.s.score >= 8)
    .sort((a, b) => b.s.score - a.s.score);

  const ideals    = scored.filter(x => x.s.match === 'ideal');
  const bons      = scored.filter(x => x.s.match === 'bon');
  const compromis = scored.filter(x => x.s.match === 'compromis');

  let bestLevel: RecommendationResult['bestLevel'] = 'aucun';
  let wines: WineRecommendation[] = [];
  let message = '';
  let idealSuggestion: string | undefined;

  if (ideals.length > 0) {
    bestLevel = 'ideal';
    wines     = [...ideals, ...bons].slice(0, 5).map(x => toRec(x.g, x.s));
    message   = ideals.length === 1 ? `1 accord idéal trouvé dans votre cave.` : `${ideals.length} accords idéaux dans votre cave.`;
  } else if (bons.length > 0) {
    bestLevel = 'bon';
    wines     = bons.slice(0, 5).map(x => toRec(x.g, x.s));
    message   = bons.length === 1 ? `Pas d'accord parfait mais 1 bon accord disponible.` : `Pas d'accord parfait mais ${bons.length} bons accords disponibles.`;
    idealSuggestion = pairing.texteAchat;
  } else if (compromis.length > 0) {
    bestLevel = 'compromis';
    wines     = compromis.slice(0, 3).map(x => toRec(x.g, x.s));
    message   = `Aucun accord idéal dans votre cave pour ce plat. Ces vins peuvent dépanner.`;
    idealSuggestion = pairing.texteAchat;
  } else {
    bestLevel = 'aucun';
    message   = `Aucun vin disponible ne correspond à "${platText}".`;
    idealSuggestion = pairing.texteAchat;
  }

  return {
    wines,
    message,
    hasIdeal: ideals.length > 0,
    bestLevel,
    idealSuggestion: idealSuggestion ? `Si votre cave ne contient pas le bon vin — ${idealSuggestion}` : undefined,
    foodLabel: platText,
  };
}
