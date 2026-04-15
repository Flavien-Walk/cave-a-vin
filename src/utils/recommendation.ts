import type { Bottle } from '../types';

export type FoodType =
  | 'viande_rouge'
  | 'viande_blanche'
  | 'poisson_leger'
  | 'poisson_gras'
  | 'fruits_mer'
  | 'vegetarien'
  | 'fromage'
  | 'charcuterie'
  | 'dessert';

export interface FoodProfile {
  type: FoodType;
  label: string;
  intensite: number;
  gras: number;
  acidite: number;
}

export interface WineRecommendation {
  bottle: Bottle;
  score: number;
  match: 'parfait' | 'bon' | 'acceptable';
  explanation: string;
  factors: string[];
}

const KEYWORDS: Record<FoodType, string[]> = {
  viande_rouge:  ['boeuf','steak','entrecote','agneau','gibier','canard','magret','cote de boeuf','tartare','bavette','chevreuil'],
  viande_blanche:['poulet','veau','porc','dinde','lapin','pintade','volaille'],
  poisson_leger: ['sole','bar','dorade','lieu','cabillaud','turbot','merlan','fletan'],
  poisson_gras:  ['saumon','thon','sardine','maquereau','anchois'],
  fruits_mer:    ['huitre','crevette','homard','langouste','moule','saint-jacques','coquille','palourde'],
  vegetarien:    ['legume','salade','tofu','champignon','risotto','pasta','pates','gratin','quiche','tarte legume'],
  fromage:       ['fromage','camembert','brie','comte','roquefort','chevre','parmesan','munster','reblochon'],
  charcuterie:   ['jambon','saucisson','charcuterie','pate','terrine','rillette','saucisse'],
  dessert:       ['dessert','chocolat','gateau','tarte','mousse','fondant','glace','sorbet','creme brulee'],
};

const PROFILES: Record<FoodType, Omit<FoodProfile, 'label'>> = {
  viande_rouge:  { type: 'viande_rouge',   intensite: 4, gras: 3, acidite: 2 },
  viande_blanche:{ type: 'viande_blanche', intensite: 3, gras: 3, acidite: 2 },
  poisson_leger: { type: 'poisson_leger',  intensite: 2, gras: 1, acidite: 4 },
  poisson_gras:  { type: 'poisson_gras',   intensite: 3, gras: 4, acidite: 2 },
  fruits_mer:    { type: 'fruits_mer',     intensite: 2, gras: 1, acidite: 4 },
  vegetarien:    { type: 'vegetarien',     intensite: 2, gras: 2, acidite: 3 },
  fromage:       { type: 'fromage',        intensite: 4, gras: 5, acidite: 2 },
  charcuterie:   { type: 'charcuterie',    intensite: 3, gras: 4, acidite: 2 },
  dessert:       { type: 'dessert',        intensite: 3, gras: 3, acidite: 1 },
};

// Intensité vins par couleur
const WINE_INTENSITE: Record<string, number> = {
  rouge: 4, blanc: 2, 'rosé': 2, effervescent: 2, moelleux: 3, autre: 3,
};

// Table d'accords
const ACCORDS: Record<FoodType, { parfait: string[]; bon: string[] }> = {
  viande_rouge:  { parfait: ['rouge'],                    bon: ['rosé'] },
  viande_blanche:{ parfait: ['blanc', 'rosé'],            bon: ['rouge'] },
  poisson_leger: { parfait: ['blanc', 'effervescent'],    bon: ['rosé'] },
  poisson_gras:  { parfait: ['blanc'],                    bon: ['rosé', 'rouge'] },
  fruits_mer:    { parfait: ['blanc', 'effervescent'],    bon: ['rosé'] },
  vegetarien:    { parfait: ['blanc', 'rosé'],            bon: ['rouge'] },
  fromage:       { parfait: ['rouge', 'blanc'],           bon: ['moelleux'] },
  charcuterie:   { parfait: ['rouge', 'rosé'],            bon: ['blanc'] },
  dessert:       { parfait: ['moelleux', 'effervescent'], bon: ['rosé'] },
};

const EXPLANATIONS: Partial<Record<FoodType, Partial<Record<string, string>>>> = {
  viande_rouge:  { rouge: 'Les tanins structurés équilibrent parfaitement la richesse de la viande rouge.' },
  viande_blanche:{ blanc: 'La fraîcheur du blanc complète la délicatesse de cette viande.', 'rosé': 'Le rosé apporte légèreté et fruité à ce plat.' },
  poisson_leger: { blanc: "L'acidité vive du blanc sublime les saveurs délicates du poisson.", effervescent: 'Les bulles nettoient le palais entre chaque bouchée.' },
  poisson_gras:  { blanc: "Un blanc gras équilibre parfaitement le côté iodé et riche du poisson." },
  fruits_mer:    { blanc: "La minéralité du blanc s'accorde idéalement avec les fruits de mer.", effervescent: 'Le Champagne et les fruits de mer, un classique indémodable.' },
  fromage:       { rouge: "Les tanins du rouge tiennent tête à l'intensité du fromage." },
  charcuterie:   { rouge: 'Un rouge fruité et léger pour sublimer la charcuterie.' },
  dessert:       { moelleux: 'Le moelleux répond parfaitement à la douceur du dessert.', effervescent: 'Des bulles festives pour couronner le repas.' },
};

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function analyzeFood(platText: string): FoodProfile {
  const n = normalize(platText);
  for (const [type, kws] of Object.entries(KEYWORDS)) {
    for (const kw of kws) {
      if (n.includes(normalize(kw))) {
        return { ...PROFILES[type as FoodType], label: platText };
      }
    }
  }
  return { ...PROFILES.vegetarien, label: platText };
}

export function scoreBottle(
  bottle: Bottle,
  profile: FoodProfile,
): { score: number; explanation: string; factors: string[]; match: 'parfait' | 'bon' | 'acceptable' } {
  let score = 0;
  const factors: string[] = [];
  const currentYear = new Date().getFullYear();
  const couleur = (bottle.couleur ?? '').toLowerCase();
  const accord = ACCORDS[profile.type];

  // 1. Accord couleur (35 pts)
  if (accord.parfait.includes(couleur)) {
    score += 35;
    factors.push('Accord classique avec ce plat');
  } else if (accord.bon.includes(couleur)) {
    score += 18;
    factors.push('Bon accord');
  }

  // 2. Adéquation intensité (20 pts)
  const wi = WINE_INTENSITE[couleur] ?? 3;
  const diff = Math.abs(wi - profile.intensite);
  if (diff === 0)      { score += 20; factors.push('Intensités parfaitement équilibrées'); }
  else if (diff === 1) { score += 13; }
  else if (diff === 2) { score += 6; }

  // 3. Maturité (20 pts)
  if (bottle.annee && bottle.consommerAvant) {
    const yearsLeft = bottle.consommerAvant - currentYear;
    if (yearsLeft >= 0 && yearsLeft <= 3)  { score += 20; factors.push('À maturité optimale'); }
    else if (yearsLeft > 3 && yearsLeft <= 8) { score += 13; }
    else if (yearsLeft > 8)               { score += 7; }
    else                                  { score += 2; }
  } else {
    score += 10;
  }

  // 4. Notes utilisateur (15 pts)
  if (bottle.notes && bottle.notes.length > 0) {
    const avg = bottle.notes.reduce((s, n) => s + n.note, 0) / bottle.notes.length;
    score += Math.round((avg / 5) * 15);
    if (avg >= 4.5) factors.push(`Coup de coeur (${avg.toFixed(1)}/5)`);
    else if (avg >= 4) factors.push(`Très bien noté (${avg.toFixed(1)}/5)`);
  } else {
    score += 8;
  }

  // 5. Disponibilité (10 pts)
  if (bottle.quantite >= 3)     score += 10;
  else if (bottle.quantite >= 2) score += 7;
  else                           score += 3;

  // Explication
  const expl = EXPLANATIONS[profile.type]?.[couleur];
  const explanation = expl ?? (
    score >= 70 ? 'Un accord réussi pour ce repas.' :
    score >= 45 ? 'Accord correct, à essayer.' :
    'Accord original pour les amateurs de découverte.'
  );

  const match: 'parfait' | 'bon' | 'acceptable' =
    score >= 68 ? 'parfait' : score >= 45 ? 'bon' : 'acceptable';

  return { score: Math.min(score, 100), explanation, factors, match };
}

export function getRecommendations(bottles: Bottle[], platText: string): WineRecommendation[] {
  if (!platText.trim() || !bottles.length) return [];
  const profile = analyzeFood(platText);
  return bottles
    .filter(b => b.quantite > 0)
    .map(b => ({ bottle: b, ...scoreBottle(b, profile) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
