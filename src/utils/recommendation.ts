import type { Bottle } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type FoodType =
  | 'viande_rouge'      | 'viande_rouge_sauce' | 'gibier'
  | 'viande_blanche'    | 'volaille_rotie'
  | 'poisson_leger'     | 'poisson_gras'        | 'poisson_sauce'
  | 'fruits_mer_crus'   | 'fruits_mer_cuits'
  | 'pates_risotto'     | 'vegetarien_leger'    | 'vegetarien_riche'
  | 'fromage_fort'      | 'fromage_frais'       | 'plateau_fromages'
  | 'charcuterie'       | 'foie_gras'
  | 'cuisine_asiatique' | 'cuisine_epicee'      | 'cuisine_mediterraneenne'
  | 'dessert_chocolat'  | 'dessert_fruite'      | 'dessert_creme'
  | 'apero';

export interface FoodProfile {
  type: FoodType;
  label: string;
}

export interface WineRecommendation {
  bottle: Bottle;
  score: number;
  match: 'ideal' | 'bon' | 'compromis';
  explanation: string;
  factors: string[];
  caveat?: string; // message d'honnêteté si compromis
}

export interface RecommendationResult {
  wines: WineRecommendation[];
  message: string;
  hasIdeal: boolean;
  bestLevel: 'ideal' | 'bon' | 'compromis' | 'aucun';
  idealSuggestion?: string; // "Idéalement, achetez un blanc sec"
  foodLabel: string;
}

// ── Détection du plat ─────────────────────────────────────────────────────────

const KEYWORDS: Record<FoodType, string[]> = {
  viande_rouge: [
    'boeuf','steak','entrecote','entrecôte','bavette','tartare',
    'cote de boeuf','côte de boeuf','faux-filet','rumsteck','hampe','onglet',
    'agneau','gigot','carre d agneau','carré d\'agneau',
  ],
  viande_rouge_sauce: [
    'boeuf bourguignon','bourguignon','daube','ragout','ragoût',
    'blanquette rouge','osso bucco','joue de boeuf','carbonade',
    'boeuf braise','braisé','pot au feu','pot-au-feu',
  ],
  gibier: [
    'gibier','chevreuil','sanglier','cerf','faisan','perdrix',
    'canard sauvage','pintade','lièvre','laperreau','venaison',
  ],
  viande_blanche: [
    'veau','porc','cochon','filet mignon porc','escalope',
    'lapin','rôti de porc','cotes de porc','travers',
  ],
  volaille_rotie: [
    'poulet','dinde','pintade','poulet roti','poulet rôti',
    'dinde rotie','dinde rôtie','volaille','canard','magret',
    'confit de canard','canard à l\'orange','canard confit',
  ],
  poisson_leger: [
    'sole','bar','dorade','lieu','cabillaud','turbot','merlan',
    'fletan','flétan','saint pierre','saint-pierre','sandre',
    'truite','poisson blanc','filet de poisson',
  ],
  poisson_gras: [
    'saumon','thon','maquereau','sardine','anchois','hareng',
    'anguille','espadon','poisson gras',
  ],
  poisson_sauce: [
    'poisson sauce','sole meunière','sole meuniére','poisson creme',
    'poisson à la crème','blanquette poisson','brandade',
    'gratin de poisson','bouillabaisse','choucroute poisson',
  ],
  fruits_mer_crus: [
    'huitre','huître','huitres','huîtres','crevette','tartare poisson',
    'carpaccio poisson','sushi','sashimi','fruits de mer crus',
  ],
  fruits_mer_cuits: [
    'homard','langouste','langoustine','coquille saint-jacques','saint-jacques',
    'moule','palourde','crevette cuite','fruits de mer',
    'plateau de fruits de mer','risotto fruits de mer',
  ],
  pates_risotto: [
    'pates','pâtes','pasta','spaghetti','tagliatelle','linguine','rigatoni',
    'risotto','gnocchi','lasagne','lasagnes','carbonara','bolognaise',
    'penne','fettuccine',
  ],
  vegetarien_leger: [
    'salade','légumes vapeur','légumes grillés','courgette','tomate','poivron',
    'ratatouille','caponata','bruschetta','taboulé','tabboulé',
    'buddha bowl','bowl','crudités','primeurs',
  ],
  vegetarien_riche: [
    'gratin','quiche','tarte salée','champignon','risotto champignon',
    'ravioli','gnocchi sauce','soufflé','gateau salé','feuilleté','croque',
    'fondue','raclette','tartiflette',
  ],
  fromage_fort: [
    'roquefort','bleu','munster','epoisses','époisse','maroilles','livarot',
    'comté vieux','vieux comté','camembert','brie','coulommiers',
    'fromage fort','fromage affiné',
  ],
  fromage_frais: [
    'chevre frais','chèvre frais','fromage blanc','ricotta','mozzarella',
    'burrata','feta','cottage','saint-marcellin frais','fromage frais',
  ],
  plateau_fromages: [
    'plateau fromage','plateau de fromage','assortiment fromage',
    'selection fromage','sélection fromage','fromage'
  ],
  charcuterie: [
    'jambon','saucisson','charcuterie','pate','paté','terrine',
    'rillette','rillettes','saucisse','andouille','boudin',
    'rosette','lard','bacon','prosciutto','serrano','coppa',
  ],
  foie_gras: [
    'foie gras','foie-gras','mi-cuit','torchon foie',
  ],
  cuisine_asiatique: [
    'sushi','sashimi','nems','rouleaux printemps','wok','pad thai',
    'poulet curry thai','cuisine chinoise','cuisine japonaise',
    'cuisine thaï','dim sum','ramen','pho','vietnamien',
    'coréen','japonais','chinois','thaï','thai',
  ],
  cuisine_epicee: [
    'curry','tajine','couscous','épicé','epicé','piment','chorizo','merguez',
    'nduja','harissa','africain','indien','tex-mex','mexicain',
    'enchilada','burrito','fajita','taco',
  ],
  cuisine_mediterraneenne: [
    'pizza','bruschetta','antipasti','tapas','mezze','olives',
    'houmous','paella','moussaka','kebab','grec','espagnol',
    'italien','libanais','marocain',
  ],
  dessert_chocolat: [
    'chocolat','fondant chocolat','mousse chocolat','brownie',
    'ganache','gateau chocolat','gâteau chocolat','tiramisu',
    'profiterole','éclair chocolat',
  ],
  dessert_fruite: [
    'tarte aux pommes','tarte aux fruits','clafoutis','compote',
    'salade de fruits','sorbet','fraise','framboise',
    'tarte tatin','verrine','crumble',
  ],
  dessert_creme: [
    'creme brulee','crème brûlée','creme caramel','île flottante',
    'panna cotta','flan','millefeuille','paris-brest','saint-honoré',
    'eclair','choux','glace vanille','glace',
  ],
  apero: [
    'aperitif','apéritif','aperitivo','apero','apéro',
    'tapas','gougere','amuse','chips','cacahuete','olive',
    'verrines','toast','blinis','canapé',
  ],
};

// ── Table d'accords ───────────────────────────────────────────────────────────
// idealCouleurs: accord parfait · acceptableCouleurs: peut marcher · neCombinePas: éviter

interface AccordRule {
  ideal: string[];
  acceptable: string[];
  eviter: string[];
  buyInstead: string;
  idealDesc: string;
}

const ACCORDS: Record<FoodType, AccordRule> = {
  viande_rouge: {
    ideal: ['rouge'], acceptable: ['rosé'], eviter: ['blanc', 'effervescent', 'moelleux'],
    buyInstead: 'un rouge structuré (Bordeaux, Rhône, Languedoc)',
    idealDesc: "Les tanins du rouge équilibrent le gras et l'intensité de la viande.",
  },
  viande_rouge_sauce: {
    ideal: ['rouge'], acceptable: ['rosé'], eviter: ['blanc', 'effervescent', 'moelleux'],
    buyInstead: 'un rouge corsé avec du corps (Bourgogne, Côtes du Rhône)',
    idealDesc: "La sauce braisée appelle un rouge avec de la structure et de la profondeur.",
  },
  gibier: {
    ideal: ['rouge'], acceptable: [], eviter: ['blanc', 'rosé', 'effervescent', 'moelleux'],
    buyInstead: 'un rouge puissant et complexe (Bordeaux, Pomerol, grand Bourgogne)',
    idealDesc: "Le gibier sauvage exige un rouge puissant avec des tanins affirmés.",
  },
  viande_blanche: {
    ideal: ['blanc', 'rosé'], acceptable: ['rouge'], eviter: ['effervescent', 'moelleux'],
    buyInstead: 'un blanc sec (Bourgogne, Côtes du Rhône blanc)',
    idealDesc: "La délicatesse de la viande blanche est sublimée par la fraîcheur d'un blanc.",
  },
  volaille_rotie: {
    ideal: ['blanc', 'rouge'], acceptable: ['rosé'], eviter: ['effervescent', 'moelleux'],
    buyInstead: 'un blanc gras ou un rouge léger (Bourgogne blanc, Pinot noir)',
    idealDesc: "La volaille rôtie s'accommode aussi bien d'un blanc gras que d'un rouge léger.",
  },
  poisson_leger: {
    ideal: ['blanc'], acceptable: ['effervescent', 'rosé'], eviter: ['rouge', 'moelleux'],
    buyInstead: 'un blanc sec et minéral (Chablis, Muscadet, Sancerre)',
    idealDesc: "L'acidité vive et la minéralité du blanc subliment les saveurs délicates du poisson.",
  },
  poisson_gras: {
    ideal: ['blanc'], acceptable: ['rosé'], eviter: ['rouge', 'effervescent', 'moelleux'],
    buyInstead: 'un blanc gras et structuré (Meursault, Bourgogne blanc, Alsace Pinot Gris)',
    idealDesc: "Un blanc gras contrebalance parfaitement la richesse iodée du poisson gras.",
  },
  poisson_sauce: {
    ideal: ['blanc'], acceptable: ['rosé', 'effervescent'], eviter: ['rouge', 'moelleux'],
    buyInstead: 'un blanc sec aromatique (Alsace, Pouilly-Fumé)',
    idealDesc: "La sauce crémeuse appelle un blanc ample avec de l'acidité pour trancher.",
  },
  fruits_mer_crus: {
    ideal: ['blanc', 'effervescent'], acceptable: ['rosé'], eviter: ['rouge', 'moelleux'],
    buyInstead: 'un blanc sec très minéral ou un Champagne brut (Chablis, Muscadet, Champagne)',
    idealDesc: "La minéralité du blanc sec ou les bulles du Champagne épousent parfaitement les fruits de mer crus.",
  },
  fruits_mer_cuits: {
    ideal: ['blanc', 'effervescent'], acceptable: ['rosé'], eviter: ['rouge', 'moelleux'],
    buyInstead: 'un blanc sec élégant ou un Champagne (Bourgogne blanc, Crémant)',
    idealDesc: "La richesse des fruits de mer cuits appelle un blanc ample ou des bulles festives.",
  },
  pates_risotto: {
    ideal: ['blanc', 'rosé'], acceptable: ['rouge'], eviter: ['effervescent', 'moelleux'],
    buyInstead: 'un blanc sec ou un rosé (Côtes de Provence, Pinot Gris)',
    idealDesc: "La fraîcheur d'un blanc ou d'un rosé complète la richesse des pâtes et risottos.",
  },
  vegetarien_leger: {
    ideal: ['blanc', 'rosé'], acceptable: ['effervescent'], eviter: ['rouge', 'moelleux'],
    buyInstead: 'un blanc vif ou un rosé sec (Sancerre, rosé de Provence)',
    idealDesc: "Les plats végétariens légers sont mis en valeur par la légèreté d'un blanc ou d'un rosé.",
  },
  vegetarien_riche: {
    ideal: ['blanc', 'rouge'], acceptable: ['rosé'], eviter: ['effervescent', 'moelleux'],
    buyInstead: 'un blanc gras ou un rouge léger (Viognier, Pinot noir)',
    idealDesc: "Les gratins et plats végétariens riches acceptent un blanc structuré ou un rouge souple.",
  },
  fromage_fort: {
    ideal: ['rouge', 'moelleux'], acceptable: ['blanc'], eviter: ['effervescent', 'rosé'],
    buyInstead: 'un rouge corsé ou un blanc moelleux (Sauternes, Banyuls)',
    idealDesc: "Les fromages puissants demandent un rouge tannique ou un blanc moelleux pour s'équilibrer.",
  },
  fromage_frais: {
    ideal: ['blanc', 'rosé'], acceptable: ['effervescent'], eviter: ['rouge', 'moelleux'],
    buyInstead: 'un blanc sec et vif (Sancerre, Pouilly-Fumé, Muscadet)',
    idealDesc: "La fraîcheur des fromages frais s'accorde idéalement avec l'acidité d'un blanc sec.",
  },
  plateau_fromages: {
    ideal: ['rouge', 'blanc'], acceptable: ['moelleux'], eviter: ['effervescent'],
    buyInstead: 'deux vins : un rouge structuré et un blanc sec pour couvrir tous les fromages',
    idealDesc: "Un plateau de fromages demande idéalement plusieurs vins, rouge et blanc pour s'adapter à la diversité.",
  },
  charcuterie: {
    ideal: ['rouge', 'rosé'], acceptable: ['blanc'], eviter: ['effervescent', 'moelleux'],
    buyInstead: 'un rouge fruité ou un rosé sec (Beaujolais, rosé Provence)',
    idealDesc: "La charcuterie appelle un rouge fruité et léger ou un rosé pour trancher le gras.",
  },
  foie_gras: {
    ideal: ['moelleux'], acceptable: ['effervescent', 'blanc'], eviter: ['rouge', 'rosé'],
    buyInstead: 'un blanc moelleux ou liquoreux (Sauternes, Jurançon, Monbazillac)',
    idealDesc: "L'accord classique foie gras-Sauternes reste indépassable : le sucre s'oppose au gras.",
  },
  cuisine_asiatique: {
    ideal: ['blanc', 'effervescent', 'rosé'], acceptable: ['rouge'], eviter: ['moelleux'],
    buyInstead: 'un blanc aromatique ou effervescent (Riesling, Champagne, Crémant)',
    idealDesc: "Les saveurs umami et légères de la cuisine asiatique sont rehaussées par un blanc aromatique ou des bulles.",
  },
  cuisine_epicee: {
    ideal: ['rosé', 'blanc'], acceptable: ['rouge', 'moelleux'], eviter: ['effervescent'],
    buyInstead: 'un rosé sec ou un blanc demi-sec (rosé de Provence, Vouvray demi-sec)',
    idealDesc: "Le rosé ou le blanc tempère les épices sans les masquer ; évitez les rouges très tanniques.",
  },
  cuisine_mediterraneenne: {
    ideal: ['rosé', 'rouge'], acceptable: ['blanc', 'effervescent'], eviter: ['moelleux'],
    buyInstead: 'un rosé de Provence ou un rouge méditerranéen (Bandol, Corbières)',
    idealDesc: "Olives, tomates, herbes : le rosé de Provence ou un rouge du Midi s'imposent naturellement.",
  },
  dessert_chocolat: {
    ideal: ['moelleux'], acceptable: ['effervescent', 'rouge'], eviter: ['blanc', 'rosé'],
    buyInstead: 'un moelleux puissant (Banyuls, Maury, Porto) ou un rouge fruité',
    idealDesc: "Le chocolat appelle un vin doux naturel puissant — le Banyuls est l'accord canonique.",
  },
  dessert_fruite: {
    ideal: ['effervescent', 'moelleux'], acceptable: ['rosé'], eviter: ['rouge', 'blanc'],
    buyInstead: 'un effervescent demi-sec ou un moelleux léger (Crémant rosé, Vouvray)',
    idealDesc: "Les fruits frais et acidulés sont sublimés par les bulles légères ou un moelleux délicat.",
  },
  dessert_creme: {
    ideal: ['moelleux', 'effervescent'], acceptable: ['rosé'], eviter: ['rouge', 'blanc'],
    buyInstead: 'un moelleux (Sauternes, Coteaux du Layon) ou un effervescent doux',
    idealDesc: "La douceur crémeuse des desserts lactés demande un vin moelleux ou des bulles festives.",
  },
  apero: {
    ideal: ['effervescent', 'rosé', 'blanc'], acceptable: ['rouge'], eviter: ['moelleux'],
    buyInstead: 'un effervescent (Champagne, Crémant, Prosecco) ou un blanc sec léger',
    idealDesc: "L'apéritif appelle légèreté et fraîcheur — les bulles et le rosé sont idéaux.",
  },
};

// ── Explication par combinaison ───────────────────────────────────────────────

function getExplanation(foodType: FoodType, couleur: string, match: 'ideal' | 'bon' | 'compromis'): string {
  const rule = ACCORDS[foodType];
  if (match === 'ideal') return rule.idealDesc;
  if (match === 'bon') {
    return `Accord correct — pas l'accord classique mais tout à fait acceptable pour ce plat.`;
  }
  return `Ce ${couleur} n'est pas l'accord recommandé pour ce plat, mais peut dépanner si c'est votre seule option.`;
}

// ── Détection food → FoodProfile ─────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function analyzeFood(platText: string): FoodProfile | null {
  if (!platText.trim()) return null;
  const n = normalize(platText);

  // Ordre intentionnel : du plus spécifique au plus générique
  const ORDER: FoodType[] = [
    'foie_gras', 'viande_rouge_sauce', 'gibier', 'cuisine_epicee',
    'cuisine_asiatique', 'cuisine_mediterraneenne',
    'fruits_mer_crus', 'fruits_mer_cuits',
    'poisson_sauce', 'poisson_gras', 'poisson_leger',
    'volaille_rotie', 'viande_rouge', 'viande_blanche',
    'fromage_fort', 'fromage_frais', 'plateau_fromages',
    'charcuterie', 'dessert_chocolat', 'dessert_fruite', 'dessert_creme',
    'pates_risotto', 'vegetarien_riche', 'vegetarien_leger', 'apero',
  ];

  for (const type of ORDER) {
    for (const kw of KEYWORDS[type]) {
      if (n.includes(normalize(kw))) {
        return { type, label: platText };
      }
    }
  }
  return null; // inconnu — pas de forçage
}

// ── Score d'une bouteille ─────────────────────────────────────────────────────

function scoreBottle(
  bottle: Bottle,
  profile: FoodProfile,
): { score: number; match: 'ideal' | 'bon' | 'compromis'; explanation: string; factors: string[]; caveat?: string } {
  const couleur = (bottle.couleur ?? '').toLowerCase();
  const rule = ACCORDS[profile.type];
  let baseScore = 0;
  let match: 'ideal' | 'bon' | 'compromis';
  const factors: string[] = [];
  let caveat: string | undefined;

  // ── Accord couleur — c'est la base ──
  if (rule.ideal.includes(couleur)) {
    baseScore = 55;
    match = 'ideal';
    factors.push('Accord classique avec ce plat');
  } else if (rule.acceptable.includes(couleur)) {
    baseScore = 28;
    match = 'bon';
  } else if (rule.eviter.includes(couleur)) {
    baseScore = 8; // pas zéro — peut être compromis
    match = 'compromis';
    caveat = `Ce ${couleur} n'est pas recommandé ici. ${rule.buyInstead ? `Idéalement : ${rule.buyInstead}.` : ''}`;
  } else {
    baseScore = 15;
    match = 'compromis';
    caveat = `Type de vin inhabituel pour ce plat. ${rule.buyInstead ? `Idéalement : ${rule.buyInstead}.` : ''}`;
  }

  // ── Bonus note utilisateur (+0-20) ──
  const userNote = getUserNote(bottle);
  if (userNote !== null) {
    const noteBonus = Math.round((userNote / 5) * 20);
    baseScore += noteBonus;
    if (userNote >= 4.5) factors.push(`Coup de cœur (${userNote.toFixed(1)}/5)`);
    else if (userNote >= 4) factors.push(`Très bien noté (${userNote.toFixed(1)}/5)`);
    else if (userNote >= 3) factors.push(`Bien noté (${userNote.toFixed(1)}/5)`);
  }

  // ── Bonus maturité (+0-15) ──
  const currentYear = new Date().getFullYear();
  if (bottle.consommerAvant) {
    const yearsLeft = bottle.consommerAvant - currentYear;
    if (yearsLeft >= 0 && yearsLeft <= 2) { baseScore += 15; factors.push('À maturité optimale'); }
    else if (yearsLeft > 2 && yearsLeft <= 5) { baseScore += 8; }
    else if (yearsLeft < 0) { baseScore += 2; factors.push('Dépassé la garde recommandée'); }
  }

  // ── Bonus stock (+0-5) ──
  if (bottle.quantite >= 2) baseScore += 5;

  // ── Bonus favori (+5) ──
  if (bottle.isFavorite) { baseScore += 5; factors.push('Favori'); }

  const finalScore = Math.min(Math.round(baseScore), 100);
  const explanation = getExplanation(profile.type, couleur, match);

  return { score: finalScore, match, explanation, factors, caveat };
}

// ── Note globale d'une bouteille (notePerso + notes dégustation) ──────────────

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

// ── API principale ────────────────────────────────────────────────────────────

export function getRecommendations(bottles: Bottle[], platText: string): RecommendationResult {
  const available = bottles.filter(b => b.quantite > 0);

  if (!platText.trim() || !available.length) {
    return {
      wines: [], message: '', hasIdeal: false, bestLevel: 'aucun',
      foodLabel: platText,
    };
  }

  const profile = analyzeFood(platText);

  // Plat non reconnu → pas de forçage
  if (!profile) {
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
        : `Plat non reconnu — ajoutez des notes à vos bouteilles pour obtenir des suggestions.`,
      hasIdeal: false,
      bestLevel: topRated.length ? 'bon' : 'aucun',
      foodLabel: platText,
    };
  }

  const rule = ACCORDS[profile.type];

  // Scorer toutes les bouteilles disponibles
  const scored = available
    .map(b => ({ bottle: b, ...scoreBottle(b, profile) }))
    .filter(x => x.score >= 10) // seuil minimal absolu
    .sort((a, b) => b.score - a.score);

  // Analyser la qualité du résultat
  const ideals    = scored.filter(x => x.match === 'ideal');
  const bons      = scored.filter(x => x.match === 'bon');
  const compromis = scored.filter(x => x.match === 'compromis');

  let bestLevel: RecommendationResult['bestLevel'] = 'aucun';
  let wines: WineRecommendation[] = [];
  let message = '';
  let idealSuggestion: string | undefined;

  if (ideals.length > 0) {
    bestLevel = 'ideal';
    wines = ideals.slice(0, 5);
    message = ideals.length === 1
      ? `1 accord idéal trouvé dans votre cave.`
      : `${ideals.length} accords idéaux dans votre cave.`;
    if (bons.length > 0) {
      // Ajouter aussi les "bons" après les idéaux
      wines = [...ideals, ...bons].slice(0, 5);
    }
  } else if (bons.length > 0) {
    bestLevel = 'bon';
    wines = bons.slice(0, 5);
    message = `Pas d'accord parfait mais ${bons.length} bon${bons.length > 1 ? 's accord' : ' accord'} disponible${bons.length > 1 ? 's' : ''} dans votre cave.`;
    idealSuggestion = rule.buyInstead;
  } else if (compromis.length > 0) {
    bestLevel = 'compromis';
    wines = compromis.slice(0, 3);
    message = `Aucun accord idéal dans votre cave pour ce plat. Ces vins peuvent dépanner.`;
    idealSuggestion = rule.buyInstead;
  } else {
    bestLevel = 'aucun';
    wines = [];
    message = `Aucun vin disponible ne correspond à ce plat.`;
    idealSuggestion = rule.buyInstead;
  }

  return {
    wines,
    message,
    hasIdeal: ideals.length > 0,
    bestLevel,
    idealSuggestion: idealSuggestion ? `Idéalement : achetez ${idealSuggestion}` : undefined,
    foodLabel: platText,
  };
}

// Export rétrocompat pour les imports existants
export type { RecommendationResult as RecoResult };
