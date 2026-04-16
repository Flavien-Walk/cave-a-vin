import type { Bottle } from '../types';
import { detectFood, type FoodPairing } from '../data/foodWinePairings';

// ── Types exportés (inchangés pour rétrocompat discover.tsx) ──────────────────

export type FoodType = string; // gardé pour compatibilité — plus utilisé en interne

export interface FoodProfile {
  type: string;
  label: string;
  pairing: FoodPairing;
}

export interface WineRecommendation {
  bottle: Bottle;
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

// Export rétrocompat
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

// ── Score d'une bouteille contre un accord ────────────────────────────────────

function scoreBottle(
  bottle: Bottle,
  pairing: FoodPairing,
): { score: number; match: 'ideal' | 'bon' | 'compromis'; explanation: string; factors: string[]; caveat?: string } {
  const couleur = (bottle.couleur ?? '').toLowerCase().trim();
  const region  = (bottle.region  ?? '').toLowerCase().trim();
  const factors: string[] = [];
  let caveat: string | undefined;
  let baseScore = 0;
  let match: 'ideal' | 'bon' | 'compromis';

  // ── 1. Accord couleur ────────────────────────────────────────────────────────
  if (pairing.ideal.couleurs.includes(couleur)) {
    baseScore = 55;
    match     = 'ideal';
    factors.push('Accord classique avec ce plat');

    // Bonus région préférée (+12)
    if (pairing.ideal.regionsPreferees?.length) {
      const pref = pairing.ideal.regionsPreferees.some(r =>
        region.includes(r.toLowerCase()) || r.toLowerCase().includes(region)
      );
      if (pref && region) {
        baseScore += 12;
        factors.push(`Région recommandée (${bottle.region})`);
      }
    }

    // Bonus regionsBonus : score par appellation spécifique
    if (pairing.regionsBonus?.length) {
      for (const rb of pairing.regionsBonus) {
        const pat = rb.pattern.toLowerCase();
        if (region.includes(pat) || (bottle.appellation ?? '').toLowerCase().includes(pat)) {
          baseScore += rb.bonus;
          factors.push(`Appellation idéale (${rb.pattern})`);
          break; // un seul bonus région
        }
      }
    }

  } else if (pairing.bon.couleurs.includes(couleur)) {
    baseScore = 28;
    match     = 'bon';
  } else if (pairing.acceptable.couleurs.includes(couleur)) {
    baseScore = 16;
    match     = 'compromis';
    caveat    = `${pairing.texteCompromis} ${pairing.texteAchat}`;
  } else {
    // couleur dans eviter ou non listée
    baseScore = 6;
    match     = 'compromis';
    caveat    = pairing.eviter.raison
      ? `${pairing.eviter.raison} ${pairing.texteAchat}`
      : `Ce ${couleur} n'est pas recommandé ici. ${pairing.texteAchat}`;
  }

  // ── 2. Bonus note utilisateur (+0-20) ────────────────────────────────────────
  const userNote = getUserNote(bottle);
  if (userNote !== null) {
    const noteBonus = Math.round((userNote / 5) * 20);
    baseScore += noteBonus;
    if (userNote >= 4.5) factors.push(`Coup de cœur (${userNote.toFixed(1)}/5)`);
    else if (userNote >= 4) factors.push(`Très bien noté (${userNote.toFixed(1)}/5)`);
    else if (userNote >= 3) factors.push(`Bien noté (${userNote.toFixed(1)}/5)`);
  }

  // ── 3. Bonus maturité (+0-15) ────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  if (bottle.consommerAvant) {
    const yearsLeft = bottle.consommerAvant - currentYear;
    if (yearsLeft >= 0 && yearsLeft <= 2) { baseScore += 15; factors.push('À maturité optimale'); }
    else if (yearsLeft > 2 && yearsLeft <= 5) { baseScore += 8; }
    else if (yearsLeft < 0) { baseScore += 2; factors.push('Dépasse la garde recommandée'); }
  }

  // ── 4. Bonus stock (+5) ─────────────────────────────────────────────────────
  if (bottle.quantite >= 2) baseScore += 5;

  // ── 5. Bonus favori (+5) ────────────────────────────────────────────────────
  if (bottle.isFavorite) { baseScore += 5; factors.push('Favori'); }

  const finalScore  = Math.min(Math.round(baseScore), 100);
  const explanation = match === 'ideal' ? pairing.texteIdeal
                    : match === 'bon'   ? pairing.texteBon
                    : pairing.texteCompromis;

  return { score: finalScore, match, explanation, factors, caveat };
}

// ── analyzeFood — rétrocompat (appelle detectFood) ────────────────────────────

export function analyzeFood(platText: string): FoodProfile | null {
  if (!platText.trim()) return null;
  const pairing = detectFood(platText);
  if (!pairing) return null;
  return { type: pairing.id, label: platText, pairing };
}

// ── getRecommendations ────────────────────────────────────────────────────────

export function getRecommendations(bottles: Bottle[], platText: string): RecommendationResult {
  const available = bottles.filter(b => b.quantite > 0);

  if (!platText.trim() || !available.length) {
    return { wines: [], message: '', hasIdeal: false, bestLevel: 'aucun', foodLabel: platText };
  }

  const pairing = detectFood(platText);

  // ── Plat non reconnu ─────────────────────────────────────────────────────────
  if (!pairing) {
    const topRated = available
      .filter(b => getUserNote(b) !== null)
      .sort((a, b) => (getUserNote(b) ?? 0) - (getUserNote(a) ?? 0))
      .slice(0, 3)
      .map(b => ({
        bottle: b,
        score: Math.round(((getUserNote(b) ?? 3) / 5) * 60 + 20),
        match: 'bon' as const,
        explanation: 'Sélection basée sur vos notes personnelles.',
        factors: ['Bien noté'],
      }));

    return {
      wines: topRated,
      message: topRated.length
        ? `Plat non reconnu — voici vos bouteilles les mieux notées.`
        : `Plat non reconnu — ajoutez des notes à vos bouteilles pour des suggestions personnalisées.`,
      hasIdeal: false,
      bestLevel: topRated.length ? 'bon' : 'aucun',
      foodLabel: platText,
    };
  }

  // ── Scorer toutes les bouteilles disponibles ─────────────────────────────────
  const scored = available
    .map(b => ({ bottle: b, ...scoreBottle(b, pairing) }))
    .filter(x => x.score >= 8)
    .sort((a, b) => b.score - a.score);

  const ideals    = scored.filter(x => x.match === 'ideal');
  const bons      = scored.filter(x => x.match === 'bon');
  const compromis = scored.filter(x => x.match === 'compromis');

  let bestLevel: RecommendationResult['bestLevel'] = 'aucun';
  let wines: WineRecommendation[] = [];
  let message = '';
  let idealSuggestion: string | undefined;

  if (ideals.length > 0) {
    bestLevel = 'ideal';
    wines     = [...ideals, ...bons].slice(0, 5);
    message   = ideals.length === 1
      ? `1 accord idéal trouvé dans votre cave.`
      : `${ideals.length} accords idéaux dans votre cave.`;

  } else if (bons.length > 0) {
    bestLevel = 'bon';
    wines     = bons.slice(0, 5);
    message   = bons.length === 1
      ? `Pas d'accord parfait mais 1 bon accord disponible.`
      : `Pas d'accord parfait mais ${bons.length} bons accords disponibles.`;
    idealSuggestion = pairing.texteAchat;

  } else if (compromis.length > 0) {
    bestLevel = 'compromis';
    wines     = compromis.slice(0, 3);
    message   = `Aucun accord idéal dans votre cave pour ce plat. Ces vins peuvent dépanner.`;
    idealSuggestion = pairing.texteAchat;

  } else {
    bestLevel = 'aucun';
    wines     = [];
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
