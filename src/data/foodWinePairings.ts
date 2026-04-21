/**
 * Base de connaissance accords mets-vins
 * ────────────────────────────────────────────────────────────────────────────
 * Couvre ~45 catégories de plats avec règles d'accord précises, explications
 * honnêtes et recommandations d'achat si la cave ne contient pas le bon vin.
 *
 * Principes :
 * - Jamais de forçage : si aucun bon accord n'existe, on le dit.
 * - Précision régionale : Tajine → rouge Rhône/Languedoc (PAS blanc/rosé).
 * - Hiérarchie : ideal > bon > acceptable > éviter.
 * - Les mots-clés sont normalisés (sans accents, minuscules) dans detectFood().
 */

export type FoodGroup =
  | 'Viandes & volailles'
  | 'Poissons & fruits de mer'
  | 'Cuisine du monde'
  | 'Fromages'
  | 'Charcuterie & terrines'
  | 'Pâtes, riz & légumes'
  | 'Desserts'
  | 'Apéritif';

export interface FoodPairing {
  id: string;
  label: string;
  group: FoodGroup;
  /** Plus élevé = vérifié en premier. Les plats spécifiques ont priorité sur les génériques. */
  priority: number;
  keywords: string[];

  // ── Règles d'accord ────────────────────────────────────────────────────────
  ideal:      { couleurs: string[]; regionsPreferees?: string[] };
  bon:        { couleurs: string[] };
  acceptable: { couleurs: string[] };
  eviter:     { couleurs: string[]; raison?: string };

  // ── Textes affichés à l'utilisateur ────────────────────────────────────────
  texteIdeal:     string;
  texteBon:       string;
  texteCompromis: string;
  texteAchat:     string;  // "Si cave vide, achetez..."

  // ── Bonus de score par région/appellation ──────────────────────────────────
  regionsBonus?: Array<{ pattern: string; bonus: number }>;
}

// ── Détection du plat ─────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function detectFood(query: string): FoodPairing | null {
  if (!query.trim()) return null;
  const q = normalize(query);

  // Trier par priorité décroissante pour matcher d'abord les plus spécifiques
  const sorted = [...FOOD_PAIRINGS].sort((a, b) => b.priority - a.priority);

  for (const pairing of sorted) {
    for (const kw of pairing.keywords) {
      if (q.includes(normalize(kw))) {
        return pairing;
      }
    }
  }
  return null;
}

// ── La base complète ──────────────────────────────────────────────────────────

export const FOOD_PAIRINGS: FoodPairing[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // GIBIER
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'gibier_poil',
    label: 'Gibier à poil',
    group: 'Viandes & volailles',
    priority: 96,
    keywords: [
      'chevreuil', 'sanglier', 'cerf', 'biche', 'lièvre', 'lievre', 'venaison',
      'marcassin', 'daim', 'gibier a poil',
    ],
    ideal:      { couleurs: ['rouge'], regionsPreferees: ['Bordeaux', 'Cahors', 'Madiran', 'Bourgogne', 'Rhône'] },
    bon:        { couleurs: [] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['blanc', 'rosé', 'effervescent', 'moelleux'], raison: "Le gibier à poil exige des tanins puissants que seul un rouge corsé peut offrir." },
    texteIdeal:     "Le gibier à poil (chevreuil, sanglier, cerf) exige un rouge puissant et complexe. Un grand Bordeaux, un Cahors ou un Bourgogne de caractère subliment la viande sauvage aux arômes intenses.",
    texteBon:       "Accord difficile sans rouge corsé.",
    texteCompromis: "Ce vin n'a pas la structure nécessaire pour accompagner la puissance du gibier à poil.",
    texteAchat:     "un rouge corsé et tannique : Bordeaux Supérieur, Cahors, Madiran ou grand Bourgogne rouge",
    regionsBonus: [
      { pattern: 'bordeaux', bonus: 15 }, { pattern: 'cahors', bonus: 16 },
      { pattern: 'madiran', bonus: 14 }, { pattern: 'pomerol', bonus: 18 },
      { pattern: 'saint-emilion', bonus: 16 }, { pattern: 'bourgogne', bonus: 14 },
      { pattern: 'rhone', bonus: 12 },
    ],
  },

  {
    id: 'gibier_plume',
    label: 'Gibier à plume',
    group: 'Viandes & volailles',
    priority: 92,
    keywords: [
      'faisan', 'perdrix', 'perdreau', 'becasse', 'bécasse', 'caille',
      'pigeon ramier', 'pintade sauvage', 'canard sauvage', 'gibier a plume',
    ],
    ideal:      { couleurs: ['rouge'], regionsPreferees: ['Bourgogne', 'Bordeaux', 'Rhône'] },
    bon:        { couleurs: [] },
    acceptable: { couleurs: ['blanc'] },
    eviter:     { couleurs: ['rosé', 'effervescent', 'moelleux'] },
    texteIdeal:     "Le gibier à plume appelle un rouge élégant et fin — un Bourgogne rouge (Gevrey-Chambertin, Nuits-Saint-Georges) ou un Bordeaux structuré s'imposent.",
    texteBon:       "Accord difficile sans rouge de caractère.",
    texteCompromis: "Un blanc très structuré peut à la rigueur fonctionner avec les préparations légères.",
    texteAchat:     "un rouge de Bourgogne (Pinot noir) ou un Bordeaux classique",
    regionsBonus: [
      { pattern: 'bourgogne', bonus: 20 }, { pattern: 'bordeaux', bonus: 14 },
      { pattern: 'rhone', bonus: 10 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VIANDES ROUGES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'viande_rouge_grillee',
    label: 'Viande rouge grillée',
    group: 'Viandes & volailles',
    priority: 77,
    keywords: [
      'entrecote', 'entrecôte', 'steak', 'bavette', 'onglet', 'hampe',
      'rumsteck', 'faux-filet', 'faux filet', 'cote de boeuf', 'côte de bœuf',
      't-bone', 'ribeye', 'tartare', 'carpaccio boeuf', 'boeuf grille',
      'bœuf grillé', 'grillade', 'grillades', 'barbecue viande', 'plancha boeuf',
      'bifteck',
    ],
    ideal:      { couleurs: ['rouge'], regionsPreferees: ['Bordeaux', 'Rhône', 'Languedoc'] },
    bon:        { couleurs: ['rosé'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['blanc', 'effervescent', 'moelleux'], raison: "Les tanins équilibrent le gras et l'umami de la viande rouge. Le blanc est trop léger." },
    texteIdeal:     "La viande rouge grillée réclame un rouge structuré avec des tanins fermes pour contrebalancer le gras : Bordeaux, Côtes du Rhône corsé, Languedoc ou Malbec argentin.",
    texteBon:       "Un rosé sec et charnu peut se défendre, mais restez sur un rouge si possible.",
    texteCompromis: "Ce vin n'est pas adapté à la viande rouge — manque de structure.",
    texteAchat:     "un rouge structuré : Bordeaux Supérieur, Côtes du Rhône Villages ou Saint-Chinian",
    regionsBonus: [
      { pattern: 'bordeaux', bonus: 16 }, { pattern: 'rhone', bonus: 14 },
      { pattern: 'languedoc', bonus: 12 }, { pattern: 'cahors', bonus: 12 },
      { pattern: 'roussillon', bonus: 10 },
    ],
  },

  {
    id: 'viande_rouge_mijotee',
    label: 'Viande rouge mijotée / braisée',
    group: 'Viandes & volailles',
    priority: 82,
    keywords: [
      'bourguignon', 'boeuf bourguignon', 'bœuf bourguignon', 'daube',
      'ragout', 'ragoût', 'braise', 'braisé', 'joue de boeuf', 'joue de bœuf',
      'pot-au-feu', 'pot au feu', 'carbonade', 'boeuf mijote', 'bœuf mijoté',
      'osso buco', 'jarret de boeuf', 'paleron', 'queue de boeuf',
      'boeuf carotte', 'bœuf carottes', 'mijoté', 'mijoté de',
    ],
    ideal:      { couleurs: ['rouge'], regionsPreferees: ['Bourgogne', 'Bordeaux', 'Rhône', 'Languedoc'] },
    bon:        { couleurs: [] },
    acceptable: { couleurs: ['rosé'] },
    eviter:     { couleurs: ['blanc', 'effervescent', 'moelleux'] },
    texteIdeal:     "Un plat mijoté demande un rouge avec du corps et de la profondeur pour s'accorder avec la sauce réduite — Bourgogne, Bordeaux ou Côtes du Rhône sont parfaits.",
    texteBon:       "Seul un rouge de caractère peut vraiment sublimer ce plat.",
    texteCompromis: "Un rosé corsé peut dépanner pour certaines daubes provençales.",
    texteAchat:     "un rouge avec du corps : Bourgogne rouge, Côtes du Rhône, Bordeaux ou Languedoc",
    regionsBonus: [
      { pattern: 'bourgogne', bonus: 20 }, { pattern: 'bordeaux', bonus: 16 },
      { pattern: 'rhone', bonus: 14 }, { pattern: 'languedoc', bonus: 10 },
    ],
  },

  {
    id: 'agneau',
    label: 'Agneau',
    group: 'Viandes & volailles',
    priority: 84,
    keywords: [
      'agneau', 'gigot', 'carre d agneau', 'carré d\'agneau', 'epaule d agneau',
      'cotelette d agneau', 'agneau roti', 'agneau grille', 'navarin',
    ],
    ideal:      { couleurs: ['rouge'], regionsPreferees: ['Bordeaux', 'Rhône', 'Languedoc', 'Provence'] },
    bon:        { couleurs: ['rosé'] },
    acceptable: { couleurs: ['blanc'] },
    eviter:     { couleurs: ['effervescent', 'moelleux'] },
    texteIdeal:     "L'agneau est l'accord classique avec les grands rouges de Bordeaux. Un Médoc, un Saint-Émilion, un Côtes du Rhône structuré ou un rouge du Languedoc magnifient ce plat.",
    texteBon:       "Un rosé de Provence charnu fonctionne bien avec l'agneau grillé.",
    texteCompromis: "Un blanc peut fonctionner à la rigueur avec un rôti très délicat.",
    texteAchat:     "un rouge de Bordeaux (Médoc, Pauillac) ou un Côtes du Rhône Villages",
    regionsBonus: [
      { pattern: 'bordeaux', bonus: 20 }, { pattern: 'medoc', bonus: 22 },
      { pattern: 'pauillac', bonus: 22 }, { pattern: 'rhone', bonus: 14 },
      { pattern: 'provence', bonus: 10 },
    ],
  },

  {
    id: 'viande_blanche',
    label: 'Viande blanche (veau, porc, lapin)',
    group: 'Viandes & volailles',
    priority: 71,
    keywords: [
      'veau', 'escalope de veau', 'roti de veau', 'rôti de veau',
      'blanquette de veau', 'porc', 'filet mignon de porc', 'cotes de porc',
      'roti de porc', 'rôti de porc', 'travers de porc', 'ribs', 'lapin',
      'roti de lapin', 'rôti de lapin',
    ],
    ideal:      { couleurs: ['blanc', 'rosé'], regionsPreferees: ['Bourgogne', 'Alsace', 'Loire'] },
    bon:        { couleurs: ['rouge'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['effervescent', 'moelleux'] },
    texteIdeal:     "La viande blanche est délicate — elle s'accorde idéalement avec un blanc sec et structuré (Bourgogne, Chablis) ou un rosé charnu.",
    texteBon:       "Un rouge léger et fruité (Beaujolais, Pinot noir) fonctionne très bien.",
    texteCompromis: "Un vin trop puissant ou sucré écrase la délicatesse de ce plat.",
    texteAchat:     "un blanc structuré (Bourgogne blanc, Chablis) ou un rouge léger (Beaujolais, Pinot noir)",
    regionsBonus: [
      { pattern: 'bourgogne', bonus: 16 }, { pattern: 'chablis', bonus: 14 },
      { pattern: 'beaujolais', bonus: 12 }, { pattern: 'alsace', bonus: 10 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VOLAILLES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'poulet_roti',
    label: 'Poulet rôti',
    group: 'Viandes & volailles',
    priority: 73,
    keywords: [
      'poulet roti', 'poulet rôti', 'poulet fermier', 'poulet au four',
      'demi-poulet', 'cuisse de poulet rotie', 'poulet entier',
    ],
    ideal:      { couleurs: ['blanc', 'rouge'], regionsPreferees: ['Bourgogne', 'Beaujolais'] },
    bon:        { couleurs: ['rosé'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['effervescent', 'moelleux'] },
    texteIdeal:     "Le poulet rôti est l'un des plats les plus polyvalents — un Bourgogne blanc gras ou un rouge léger de Bourgogne (Pinot noir) sont tous deux excellents.",
    texteBon:       "Un rosé sec est un bon choix d'été.",
    texteCompromis: "Ce vin peut fonctionner, mais il y a mieux pour ce plat classique.",
    texteAchat:     "un Bourgogne blanc ou un rouge léger (Pinot noir, Beaujolais-Villages)",
    regionsBonus: [
      { pattern: 'bourgogne', bonus: 18 }, { pattern: 'beaujolais', bonus: 12 },
      { pattern: 'alsace', bonus: 8 },
    ],
  },

  {
    id: 'canard',
    label: 'Canard (magret, confit)',
    group: 'Viandes & volailles',
    priority: 80,
    keywords: [
      'canard', 'magret', 'magret de canard', 'confit de canard', 'canard confit',
      'canard a l orange', 'canard à l\'orange', 'canard roti', 'canard rôti',
      'aiguillettes de canard', 'parmentier canard',
    ],
    ideal:      { couleurs: ['rouge'], regionsPreferees: ['Bordeaux', 'Cahors', 'Bergerac', 'Bourgogne'] },
    bon:        { couleurs: ['blanc'] },
    acceptable: { couleurs: ['rosé'] },
    eviter:     { couleurs: ['effervescent', 'moelleux'] },
    texteIdeal:     "Le magret de canard s'accorde parfaitement avec un rouge de Bordeaux ou un Cahors. Pour le canard à l'orange, un rouge légèrement fruité convient mieux.",
    texteBon:       "Un blanc gras et boisé peut surprendre positivement avec du canard rôti simplement.",
    texteCompromis: "Un rosé peut fonctionner pour les plats de canard légers.",
    texteAchat:     "un rouge de Bordeaux (Saint-Émilion, Pécharmant) ou un Cahors",
    regionsBonus: [
      { pattern: 'bordeaux', bonus: 18 }, { pattern: 'cahors', bonus: 16 },
      { pattern: 'bergerac', bonus: 14 }, { pattern: 'pecharmant', bonus: 16 },
    ],
  },

  {
    id: 'volaille_sauce_creme',
    label: 'Volaille en sauce crémeuse',
    group: 'Viandes & volailles',
    priority: 74,
    keywords: [
      'poulet a la creme', 'poulet crème', 'volaille a la creme', 'fricassee',
      'fricassée', 'blanquette de poulet', 'dinde a la creme', 'poulet aux champignons',
      'vol-au-vent', 'supreme de volaille', 'poulet sauce',
    ],
    ideal:      { couleurs: ['blanc'], regionsPreferees: ['Bourgogne', 'Alsace', 'Jura'] },
    bon:        { couleurs: ['rouge'] },
    acceptable: { couleurs: ['rosé'] },
    eviter:     { couleurs: ['effervescent', 'moelleux'] },
    texteIdeal:     "Les sauces crémeuses à base de volaille demandent un blanc gras et boisé — Bourgogne blanc, Meursault ou Alsace Pinot Gris sont parfaits.",
    texteBon:       "Un rouge léger (Pinot noir) peut convenir.",
    texteCompromis: "La sauce crémeuse mérite mieux.",
    texteAchat:     "un blanc structuré et boisé : Meursault, Bourgogne blanc, Alsace Pinot Gris",
    regionsBonus: [
      { pattern: 'bourgogne', bonus: 18 }, { pattern: 'meursault', bonus: 22 },
      { pattern: 'alsace', bonus: 14 }, { pattern: 'jura', bonus: 12 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHARCUTERIE & TERRINES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'foie_gras',
    label: 'Foie gras',
    group: 'Charcuterie & terrines',
    priority: 95,
    keywords: [
      'foie gras', 'foie-gras', 'mi-cuit', 'mi cuit', 'torchon foie',
      'foie gras poele', 'foie gras d\'oie', 'foie gras de canard',
      'escalope de foie gras',
    ],
    ideal:      { couleurs: ['moelleux'], regionsPreferees: ['Sauternes', 'Jurançon', 'Monbazillac'] },
    bon:        { couleurs: ['effervescent'] },
    acceptable: { couleurs: ['blanc'] },
    eviter:     { couleurs: ['rouge', 'rosé'], raison: "Les tanins du rouge entrent en conflit avec le gras fondant du foie gras." },
    texteIdeal:     "L'accord Foie gras–Sauternes est un classique absolu. Le sucre et l'acidité du Sauternes s'opposent magnifiquement au gras fondant. Un Alsace Vendanges Tardives ou un Jurançon moelleux sont aussi excellents.",
    texteBon:       "Un Champagne Blanc de Blancs peut surprendre positivement.",
    texteCompromis: "Un blanc sec peut fonctionner mais l'accord manque de magie.",
    texteAchat:     "un Sauternes, un Jurançon moelleux, un Monbazillac ou un Alsace Sélection de Grains Nobles",
    regionsBonus: [
      { pattern: 'sauternes', bonus: 26 }, { pattern: 'jurancon', bonus: 22 },
      { pattern: 'monbazillac', bonus: 20 }, { pattern: 'alsace', bonus: 16 },
      { pattern: 'coteaux du layon', bonus: 18 },
    ],
  },

  {
    id: 'charcuterie',
    label: 'Charcuterie & saucissons',
    group: 'Charcuterie & terrines',
    priority: 66,
    keywords: [
      'charcuterie', 'jambon cru', 'jambon sec', 'saucisson', 'rosette', 'coppa',
      'pancetta', 'salami', 'prosciutto', 'serrano', 'rillettes', 'rillette',
      'lard', 'lardon', 'bacon', 'jambon blanc',
    ],
    ideal:      { couleurs: ['rouge', 'rosé'], regionsPreferees: ['Beaujolais', 'Loire', 'Languedoc'] },
    bon:        { couleurs: ['blanc'] },
    acceptable: { couleurs: ['effervescent'] },
    eviter:     { couleurs: ['moelleux'] },
    texteIdeal:     "La charcuterie appelle un rouge fruité et peu tannique (Beaujolais, Pinot noir) ou un rosé sec pour trancher le gras salé.",
    texteBon:       "Un blanc vif (Muscadet) fonctionne bien avec les charcuteries légères.",
    texteCompromis: "Ce vin peut fonctionner, mais un rouge fruité serait plus juste.",
    texteAchat:     "un Beaujolais-Villages, un Pinot noir d'Alsace ou un rosé de Provence sec",
    regionsBonus: [
      { pattern: 'beaujolais', bonus: 18 }, { pattern: 'alsace', bonus: 12 },
      { pattern: 'loire', bonus: 10 }, { pattern: 'provence', bonus: 10 },
    ],
  },

  {
    id: 'terrine_pate',
    label: 'Terrine & pâté de campagne',
    group: 'Charcuterie & terrines',
    priority: 68,
    keywords: [
      'terrine', 'pate de campagne', 'pâté de campagne', 'pate en croute',
      'pâté en croûte', 'rillons', 'boudin', 'andouille', 'andouillette',
    ],
    ideal:      { couleurs: ['rouge', 'blanc'], regionsPreferees: ['Loire', 'Beaujolais', 'Alsace'] },
    bon:        { couleurs: ['rosé'] },
    acceptable: { couleurs: ['effervescent'] },
    eviter:     { couleurs: ['moelleux'] },
    texteIdeal:     "Les terrines et pâtés s'accordent avec un blanc sec (Muscadet) ou un rouge léger fruité (Saumur-Champigny, Bourgueil).",
    texteBon:       "Un rosé sec fonctionne à l'apéritif.",
    texteCompromis: "Ce vin peut dépanner.",
    texteAchat:     "un Muscadet-Sèvre-et-Maine sur lie ou un Saumur-Champigny",
    regionsBonus: [
      { pattern: 'muscadet', bonus: 16 }, { pattern: 'saumur', bonus: 15 },
      { pattern: 'beaujolais', bonus: 14 }, { pattern: 'alsace', bonus: 10 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // POISSONS & FRUITS DE MER
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'poisson_blanc_grille',
    label: 'Poisson blanc grillé ou au four',
    group: 'Poissons & fruits de mer',
    priority: 76,
    keywords: [
      'sole', 'bar', 'loup de mer', 'dorade', 'daurade', 'lieu', 'lieu jaune',
      'cabillaud', 'morue', 'turbot', 'merlan', 'fletan', 'flétan',
      'saint-pierre', 'sandre', 'perche', 'brochet', 'truite',
      'poisson blanc', 'filet de poisson', 'poisson grille', 'poisson vapeur',
      'poisson au four', 'poisson cuit',
    ],
    ideal:      { couleurs: ['blanc'], regionsPreferees: ['Bourgogne', 'Loire', 'Alsace', 'Provence'] },
    bon:        { couleurs: ['effervescent', 'rosé'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['rouge', 'moelleux'], raison: "Les tanins du rouge créent une amertume désagréable avec la chair délicate du poisson blanc." },
    texteIdeal:     "Le poisson blanc grillé s'accorde avec la minéralité d'un Chablis, la fraîcheur d'un Muscadet ou la précision d'un Sancerre blanc.",
    texteBon:       "Un effervescent brut (Champagne, Crémant) ou un rosé très sec fonctionnent bien.",
    texteCompromis: "Ce vin ne convient pas au poisson délicat.",
    texteAchat:     "un Chablis, un Muscadet-Sèvre-et-Maine sur lie ou un Sancerre blanc",
    regionsBonus: [
      { pattern: 'chablis', bonus: 22 }, { pattern: 'muscadet', bonus: 20 },
      { pattern: 'sancerre', bonus: 18 }, { pattern: 'bourgogne', bonus: 14 },
      { pattern: 'alsace', bonus: 12 }, { pattern: 'pouilly', bonus: 16 },
    ],
  },

  {
    id: 'poisson_gras',
    label: 'Poisson gras (saumon, thon)',
    group: 'Poissons & fruits de mer',
    priority: 78,
    keywords: [
      'saumon', 'saumon fume', 'saumon grille', 'pave de saumon',
      'thon', 'thon rouge', 'thon grille', 'tataki de thon',
      'maquereau', 'sardine', 'hareng', 'anguille', 'espadon',
      'truite fumee', 'poisson gras', 'poisson fume',
    ],
    ideal:      { couleurs: ['blanc'], regionsPreferees: ['Bourgogne', 'Alsace', 'Jura'] },
    bon:        { couleurs: ['rosé'] },
    acceptable: { couleurs: ['effervescent'] },
    eviter:     { couleurs: ['rouge', 'moelleux'] },
    texteIdeal:     "Le poisson gras demande un blanc structuré pour contrebalancer sa richesse iodée — un Meursault, un Alsace Pinot Gris ou un Côtes du Rhône blanc s'imposent.",
    texteBon:       "Un rosé sec et minéral peut fonctionner avec le saumon.",
    texteCompromis: "Ce vin manque de structure pour contrebalancer le gras du poisson.",
    texteAchat:     "un Meursault, un Bourgogne blanc gras ou un Alsace Pinot Gris",
    regionsBonus: [
      { pattern: 'bourgogne', bonus: 18 }, { pattern: 'meursault', bonus: 24 },
      { pattern: 'alsace', bonus: 16 }, { pattern: 'jura', bonus: 14 },
    ],
  },

  {
    id: 'poisson_sauce',
    label: 'Poisson en sauce crémeuse',
    group: 'Poissons & fruits de mer',
    priority: 79,
    keywords: [
      'sole meuniere', 'sole meuniére', 'poisson a la creme', 'poisson creme',
      'brandade', 'gratin de poisson', 'blanquette de poisson',
      'beurre blanc', 'poisson beurre blanc',
    ],
    ideal:      { couleurs: ['blanc'], regionsPreferees: ['Bourgogne', 'Loire', 'Alsace'] },
    bon:        { couleurs: ['rosé', 'effervescent'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['rouge', 'moelleux'] },
    texteIdeal:     "La sauce crémeuse appelle l'acidité d'un blanc ample pour la trancher — un Bourgogne blanc, un Chablis Premier Cru ou un Pouilly-Fumé.",
    texteBon:       "Un effervescent brut bien dosé peut équilibrer la sauce.",
    texteCompromis: "Ce vin n'est pas adapté — la sauce crémeuse mérite un blanc de caractère.",
    texteAchat:     "un Pouilly-Fumé, un Chablis Premier Cru ou un Meursault",
    regionsBonus: [
      { pattern: 'chablis', bonus: 20 }, { pattern: 'pouilly', bonus: 18 },
      { pattern: 'meursault', bonus: 22 }, { pattern: 'bourgogne', bonus: 16 },
    ],
  },

  {
    id: 'bouillabaisse',
    label: 'Bouillabaisse & soupe de poisson',
    group: 'Poissons & fruits de mer',
    priority: 85,
    keywords: [
      'bouillabaisse', 'soupe de poisson', 'soupe poisson', 'bisque',
      'bisque de homard', 'bourride',
    ],
    ideal:      { couleurs: ['blanc', 'rosé'], regionsPreferees: ['Provence', 'Languedoc', 'Rhône'] },
    bon:        { couleurs: [] },
    acceptable: { couleurs: ['effervescent'] },
    eviter:     { couleurs: ['rouge', 'moelleux'] },
    texteIdeal:     "La bouillabaisse est provençale — le rosé de Bandol sec ou un blanc de Cassis (l'appellation) sont les accords naturels.",
    texteBon:       "Un blanc du Languedoc peut convenir.",
    texteCompromis: "Ce vin n'est pas adapté à ce plat iodé.",
    texteAchat:     "un rosé de Bandol, un blanc de Cassis ou un Côtes de Provence blanc",
    regionsBonus: [
      { pattern: 'bandol', bonus: 24 }, { pattern: 'cassis', bonus: 22 },
      { pattern: 'provence', bonus: 16 },
    ],
  },

  {
    id: 'huitres_mer_crus',
    label: 'Huîtres & fruits de mer crus',
    group: 'Poissons & fruits de mer',
    priority: 88,
    keywords: [
      'huitre', 'huître', 'huitres', 'huîtres',
      'fruits de mer', 'fruits de mer crus', 'plateau de fruits de mer',
      'coquillage', 'coquillages', 'crabe', 'araignee de mer', 'araignée de mer',
      'crevette crue', 'palourde crue', 'bulot', 'bigorneaux',
    ],
    ideal:      { couleurs: ['blanc', 'effervescent'], regionsPreferees: ['Loire', 'Bourgogne', 'Champagne'] },
    bon:        { couleurs: ['rosé'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['rouge', 'moelleux'] },
    texteIdeal:     "Les huîtres demandent la minéralité absolue d'un Muscadet sur lie, d'un Chablis ou d'un Champagne Blanc de Blancs.",
    texteBon:       "Un rosé très sec et minéral peut fonctionner.",
    texteCompromis: "Les tanins du rouge créent une amertume métallique avec les huîtres — à éviter absolument.",
    texteAchat:     "un Muscadet-Sèvre-et-Maine sur lie, un Chablis ou un Champagne Blanc de Blancs",
    regionsBonus: [
      { pattern: 'muscadet', bonus: 24 }, { pattern: 'chablis', bonus: 22 },
      { pattern: 'champagne', bonus: 20 }, { pattern: 'entre-deux-mers', bonus: 14 },
    ],
  },

  {
    id: 'crustaces_cuits',
    label: 'Homard, saint-jacques & crustacés cuisinés',
    group: 'Poissons & fruits de mer',
    priority: 86,
    keywords: [
      'homard', 'langouste', 'langoustine',
      'crevettes', 'crevette', 'crevettes cuites', 'gambas',
      'crustaces', 'crustace', 'crustacés', 'crustacé',
      'coquille saint-jacques', 'saint-jacques', 'noix de saint-jacques',
      'risotto saint-jacques', 'moules', 'moule mariniere', 'palourdes sautees',
    ],
    ideal:      { couleurs: ['blanc', 'effervescent'], regionsPreferees: ['Bourgogne', 'Champagne', 'Alsace'] },
    bon:        { couleurs: ['rosé'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['rouge', 'moelleux'] },
    texteIdeal:     "Homard, saint-jacques et crustacés cuits s'épanouissent avec un blanc de grande classe — Meursault, Puligny-Montrachet ou Champagne Blanc de Blancs.",
    texteBon:       "Un rosé sec de Provence ou un effervescent rosé brut.",
    texteCompromis: "Ce vin n'est pas adapté à la richesse des crustacés.",
    texteAchat:     "un Meursault, un Chassagne-Montrachet ou un Champagne Blanc de Blancs",
    regionsBonus: [
      { pattern: 'meursault', bonus: 24 }, { pattern: 'montrachet', bonus: 26 },
      { pattern: 'champagne', bonus: 20 }, { pattern: 'bourgogne', bonus: 16 },
      { pattern: 'pessac', bonus: 16 },
    ],
  },

  {
    id: 'sushi_sashimi',
    label: 'Sushi, sashimi & cuisine japonaise',
    group: 'Poissons & fruits de mer',
    priority: 90,
    keywords: [
      'sushi', 'sashimi', 'maki', 'california roll', 'temaki', 'nigiri',
      'japonais', 'cuisine japonaise', 'omakase',
    ],
    ideal:      { couleurs: ['blanc', 'effervescent'], regionsPreferees: ['Loire', 'Champagne', 'Alsace'] },
    bon:        { couleurs: ['rosé'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['rouge', 'moelleux'], raison: "Les tanins du rouge créent une amertume avec le poisson cru et le riz vinaigré." },
    texteIdeal:     "Les sushis demandent un blanc très sec et précis — un Chablis, un Sancerre ou un Champagne Brut Nature s'imposent.",
    texteBon:       "Un rosé très sec et délicat peut fonctionner.",
    texteCompromis: "Le rouge est à éviter avec les sushis — amertume garantie.",
    texteAchat:     "un Chablis Premier Cru, un Sancerre blanc ou un Champagne Extra Brut",
    regionsBonus: [
      { pattern: 'chablis', bonus: 22 }, { pattern: 'sancerre', bonus: 20 },
      { pattern: 'muscadet', bonus: 18 }, { pattern: 'champagne', bonus: 18 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CUISINE DU MONDE — MAGHREB & AFRIQUE DU NORD
  // (Correction critique : tajine → rouge Rhône/Languedoc, PAS blanc/rosé)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'tajine_agneau',
    label: 'Tajine d\'agneau',
    group: 'Cuisine du monde',
    priority: 90,
    keywords: [
      'tajine agneau', 'tagine agneau', 'tajine d\'agneau', 'tagine d agneau',
      'tajine agneau pruneaux', 'tajine agneau citron',
    ],
    ideal:      {
      couleurs: ['rouge'],
      regionsPreferees: ['Rhône', 'Languedoc', 'Roussillon', 'Provence'],
    },
    bon:        { couleurs: ['rosé'] },
    acceptable: { couleurs: ['blanc'] },
    eviter:     {
      couleurs: ['effervescent', 'moelleux'],
      raison: "Les épices douces et la viande confite du tajine s'accordent avec la chaleur et le fruit d'un rouge souple — pas avec les bulles ni le sucre.",
    },
    texteIdeal:     "Le tajine d'agneau (épices douces, fruits secs, viande confite) appelle un rouge souple et fruité du sud de la France : Côtes du Rhône, Gigondas, Languedoc, Corbières. Un vin marocain ou algérien de qualité serait l'accord parfait.",
    texteBon:       "Un rosé sec et charnu (Bandol, Côtes du Rhône rosé) peut fonctionner, surtout pour les tajines citronnés légers.",
    texteCompromis: "Un blanc manque de chaleur et de corps pour s'accorder avec les épices et la viande confite.",
    texteAchat:     "un rouge du Rhône sud (Gigondas, Vacqueyras, Châteauneuf-du-Pape) ou un Languedoc (Corbières, Minervois, Saint-Chinian)",
    regionsBonus: [
      { pattern: 'rhone', bonus: 18 }, { pattern: 'gigondas', bonus: 22 },
      { pattern: 'vacqueyras', bonus: 22 }, { pattern: 'chateauneuf', bonus: 24 },
      { pattern: 'languedoc', bonus: 18 }, { pattern: 'corbieres', bonus: 20 },
      { pattern: 'minervois', bonus: 18 }, { pattern: 'saint-chinian', bonus: 18 },
      { pattern: 'roussillon', bonus: 14 }, { pattern: 'bandol', bonus: 14 },
      { pattern: 'provence', bonus: 12 },
    ],
  },

  {
    id: 'tajine_poulet_legumes',
    label: 'Tajine de poulet ou de légumes',
    group: 'Cuisine du monde',
    priority: 88,
    keywords: [
      'tajine poulet', 'tagine poulet', 'tajine legumes', 'tajine légumes',
      'tajine citron', 'tajine kefta', 'tajine', 'tagine',
    ],
    ideal:      { couleurs: ['rouge', 'rosé'], regionsPreferees: ['Rhône', 'Languedoc', 'Provence'] },
    bon:        { couleurs: ['blanc'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['effervescent', 'moelleux'] },
    texteIdeal:     "Le tajine de poulet (plus léger que l'agneau) accepte aussi bien un rouge souple du Rhône qu'un rosé sec et fruité de Provence.",
    texteBon:       "Un blanc aromatique (Viognier, Gewurztraminer) peut fonctionner avec les tajines citronnés.",
    texteCompromis: "Ce vin manque de la chaleur nécessaire pour ce plat parfumé.",
    texteAchat:     "un Côtes du Rhône rouge ou rosé, ou un Coteaux d'Aix-en-Provence",
    regionsBonus: [
      { pattern: 'rhone', bonus: 16 }, { pattern: 'provence', bonus: 14 },
      { pattern: 'languedoc', bonus: 14 }, { pattern: 'alsace', bonus: 10 },
    ],
  },

  {
    id: 'couscous',
    label: 'Couscous',
    group: 'Cuisine du monde',
    priority: 87,
    keywords: [
      'couscous', 'couscous royal', 'couscous mouton', 'couscous merguez',
      'couscous legumes', 'couscous poulet',
    ],
    ideal:      { couleurs: ['rouge', 'rosé'], regionsPreferees: ['Languedoc', 'Rhône', 'Roussillon'] },
    bon:        { couleurs: ['blanc'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['effervescent', 'moelleux'] },
    texteIdeal:     "Le couscous royal (mouton, merguez, légumes) appelle un rouge fruité du Languedoc (Corbières, Minervois) ou un rosé sec et charnu. Un Faugères ou un Coteaux du Languedoc se marient très bien.",
    texteBon:       "Un blanc aromatique peut fonctionner pour le couscous de légumes.",
    texteCompromis: "Ce vin n'est pas le plus adapté au couscous.",
    texteAchat:     "un Faugères, un Corbières ou un Minervois rouge, ou un grand rosé de Provence",
    regionsBonus: [
      { pattern: 'languedoc', bonus: 20 }, { pattern: 'faugeres', bonus: 22 },
      { pattern: 'corbieres', bonus: 20 }, { pattern: 'minervois', bonus: 20 },
      { pattern: 'rhone', bonus: 16 }, { pattern: 'provence', bonus: 14 },
    ],
  },

  {
    id: 'merguez_grillade_epicee',
    label: 'Grillades épicées & merguez',
    group: 'Cuisine du monde',
    priority: 80,
    keywords: [
      'merguez', 'merguez grillee', 'chipolata epicee', 'saucisse epicee',
      'brochette epicee', 'grillade epicee', 'chorizo grille', 'mechoui',
      'méchoui',
    ],
    ideal:      { couleurs: ['rouge', 'rosé'], regionsPreferees: ['Languedoc', 'Rhône', 'Roussillon'] },
    bon:        { couleurs: [] },
    acceptable: { couleurs: ['blanc'] },
    eviter:     { couleurs: ['effervescent', 'moelleux'] },
    texteIdeal:     "Les grillades épicées et merguez appellent un rouge fruité et charnu, ou un rosé sec et gras. Languedoc ou Rhône sont parfaits.",
    texteBon:       "Un blanc aromatique résiste bien aux épices légères.",
    texteCompromis: "Ce vin n'est pas idéal pour les épices.",
    texteAchat:     "un Corbières rouge, un Côtes du Rhône charnu ou un rosé de Bandol",
    regionsBonus: [
      { pattern: 'languedoc', bonus: 16 }, { pattern: 'rhone', bonus: 15 },
      { pattern: 'bandol', bonus: 15 }, { pattern: 'roussillon', bonus: 14 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CUISINE DU MONDE — INDE
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'curry_doux',
    label: 'Curry doux & tikka masala',
    group: 'Cuisine du monde',
    priority: 87,
    keywords: [
      'tikka masala', 'curry doux', 'korma', 'butter chicken', 'chicken tikka',
      'masala', 'curry creme', 'curry lait de coco', 'colombo', 'saag',
    ],
    ideal:      { couleurs: ['blanc'], regionsPreferees: ['Alsace', 'Loire'] },
    bon:        { couleurs: ['rosé'] },
    acceptable: { couleurs: ['rouge'] },
    eviter:     { couleurs: ['effervescent', 'moelleux'] },
    texteIdeal:     "Les currys doux et crémeux (tikka masala, korma) s'accordent magnifiquement avec un Gewurztraminer ou un Riesling demi-sec d'Alsace — l'aromaticité répond aux épices sans les éteindre.",
    texteBon:       "Un rosé sec peut équilibrer la chaleur douce du curry.",
    texteCompromis: "Un rouge léger peut fonctionner si le curry est très doux.",
    texteAchat:     "un Gewurztraminer d'Alsace ou un Riesling demi-sec",
    regionsBonus: [
      { pattern: 'alsace', bonus: 24 }, { pattern: 'vouvray', bonus: 16 },
      { pattern: 'rhone', bonus: 10 },
    ],
  },

  {
    id: 'curry_fort_biryani',
    label: 'Curry fort, biryani & cuisine indienne épicée',
    group: 'Cuisine du monde',
    priority: 88,
    keywords: [
      'vindaloo', 'curry fort', 'curry epice', 'madras', 'curry rouge thai',
      'curry vert', 'piment fort', 'tres epicee', 'biryani', 'biryani epice',
      'indien', 'indienne',
    ],
    ideal:      { couleurs: ['rosé', 'blanc'], regionsPreferees: ['Alsace', 'Provence'] },
    bon:        { couleurs: [] },
    acceptable: { couleurs: ['rouge'] },
    eviter:     { couleurs: ['effervescent', 'moelleux'], raison: "Les bulles et le sucre amplifient la brûlure des épices fortes." },
    texteIdeal:     "Pour les currys très épicés, un rosé sec et frais ou un Riesling sec d'Alsace tempèrent les épices. Évitez les vins trop tanniques ou sucrés.",
    texteBon:       "Sincèrement, pour les plats très épicés, la bière reste souvent le meilleur choix.",
    texteCompromis: "Un rouge léger peut dépanner, mais les tanins risquent d'amplifier la brûlure.",
    texteAchat:     "un Riesling sec d'Alsace ou un rosé de Provence très frais",
    regionsBonus: [
      { pattern: 'alsace', bonus: 20 }, { pattern: 'provence', bonus: 16 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CUISINE DU MONDE — ASIE
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'wok_asiatique',
    label: 'Wok, noodles & cuisine asiatique légère',
    group: 'Cuisine du monde',
    priority: 77,
    keywords: [
      'wok', 'chow mein', 'pad thai', 'pad thaï', 'noodles', 'pho',
      'ramen', 'udon', 'bo bun', 'nems', 'dim sum', 'dumplings', 'gyoza',
      'rouleaux de printemps', 'poke bowl', 'bowl asiatique', 'nouilles asiatiques',
      'vietnamien', 'vietnamienne', 'chinois', 'chinoise',
    ],
    ideal:      { couleurs: ['blanc', 'effervescent', 'rosé'], regionsPreferees: ['Alsace', 'Loire', 'Champagne'] },
    bon:        { couleurs: [] },
    acceptable: { couleurs: ['rouge'] },
    eviter:     { couleurs: ['moelleux'] },
    texteIdeal:     "La cuisine asiatique légère (wok, noodles, bo bun) s'accorde avec un blanc aromatique et vif (Riesling, Pinot Gris d'Alsace) ou un effervescent rafraîchissant.",
    texteBon:       "Un rosé sec et fruité pour les plats légèrement épicés.",
    texteCompromis: "Un rouge léger peut dépanner pour les plats de viande au wok.",
    texteAchat:     "un Riesling ou Pinot Gris d'Alsace, ou un Crémant d'Alsace",
    regionsBonus: [
      { pattern: 'alsace', bonus: 20 }, { pattern: 'champagne', bonus: 16 },
      { pattern: 'loire', bonus: 14 },
    ],
  },

  {
    id: 'thai_epicee',
    label: 'Cuisine thaïlandaise épicée',
    group: 'Cuisine du monde',
    priority: 82,
    keywords: [
      'thai', 'thaï', 'thaïlandais', 'thaie', 'soupe thaï', 'salade thaie',
      'larb', 'som tam', 'pad see ew',
    ],
    ideal:      { couleurs: ['blanc', 'rosé'], regionsPreferees: ['Alsace', 'Provence'] },
    bon:        { couleurs: [] },
    acceptable: { couleurs: ['effervescent'] },
    eviter:     { couleurs: ['rouge', 'moelleux'] },
    texteIdeal:     "La cuisine thaïlandaise (sucré-salé-épicé) s'accorde idéalement avec un blanc aromatique légèrement sucré (Riesling demi-sec, Gewurztraminer) ou un rosé frais.",
    texteBon:       "Un effervescent léger peut fonctionner.",
    texteCompromis: "Le rouge est déconseillé avec les épices et la citronnelle.",
    texteAchat:     "un Riesling demi-sec ou Gewurztraminer d'Alsace",
    regionsBonus: [
      { pattern: 'alsace', bonus: 22 }, { pattern: 'provence', bonus: 14 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CUISINE DU MONDE — MÉDITERRANÉEN & AUTRES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'pizza',
    label: 'Pizza',
    group: 'Cuisine du monde',
    priority: 72,
    keywords: [
      'pizza', 'pizza margherita', 'pizza napolitaine', 'pizza 4 fromages',
      'pizza reine', 'pizza calzone', 'flatbread',
    ],
    ideal:      { couleurs: ['rouge', 'rosé'], regionsPreferees: ['Languedoc', 'Rhône', 'Provence'] },
    bon:        { couleurs: ['blanc'] },
    acceptable: { couleurs: ['effervescent'] },
    eviter:     { couleurs: ['moelleux'] },
    texteIdeal:     "La pizza (sauce tomate, fromage fondant) se marie idéalement avec un rouge fruité peu tannique (Côtes du Rhône, Languedoc) ou un rosé de Provence.",
    texteBon:       "Un blanc sec du Midi (Picpoul de Pinet) peut fonctionner.",
    texteCompromis: "Ce vin peut fonctionner dans certains cas.",
    texteAchat:     "un Côtes du Rhône rouge léger, un Languedoc fruité ou un rosé de Provence",
    regionsBonus: [
      { pattern: 'rhone', bonus: 15 }, { pattern: 'languedoc', bonus: 14 },
      { pattern: 'provence', bonus: 14 },
    ],
  },

  {
    id: 'paella_espagnol',
    label: 'Paella & cuisine espagnole',
    group: 'Cuisine du monde',
    priority: 79,
    keywords: [
      'paella', 'paella valencienne', 'paella fruits de mer', 'paella mixte',
      'tapas', 'patatas bravas', 'tortilla espagnole', 'cuisine espagnole',
      'espagnol', 'espagnole',
    ],
    ideal:      { couleurs: ['rosé', 'blanc', 'rouge'], regionsPreferees: ['Provence', 'Languedoc', 'Rhône'] },
    bon:        { couleurs: ['effervescent'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['moelleux'] },
    texteIdeal:     "La paella (safran, fruits de mer, viande) appelle la légèreté d'un rosé sec ou d'un blanc vif.",
    texteBon:       "Un Crémant sec ou Cava peut fonctionner.",
    texteCompromis: "Ce vin peut fonctionner dans certaines configurations.",
    texteAchat:     "un rosé de Provence, un blanc sec du Languedoc (Picpoul) ou un rouge léger",
    regionsBonus: [
      { pattern: 'provence', bonus: 14 }, { pattern: 'languedoc', bonus: 14 },
      { pattern: 'rhone', bonus: 12 },
    ],
  },

  {
    id: 'cuisine_libanaise',
    label: 'Cuisine libanaise & mezze',
    group: 'Cuisine du monde',
    priority: 80,
    keywords: [
      'mezze', 'houmous', 'hummus', 'taboulé', 'tabboulé', 'fattoush',
      'shawarma', 'kefta', 'kafta', 'falafel', 'libanais', 'libanaise',
      'labneh', 'baba ganoush', 'kibbeh',
    ],
    ideal:      { couleurs: ['rouge', 'rosé'], regionsPreferees: ['Languedoc', 'Rhône', 'Provence'] },
    bon:        { couleurs: ['blanc'] },
    acceptable: { couleurs: ['effervescent'] },
    eviter:     { couleurs: ['moelleux'] },
    texteIdeal:     "La cuisine libanaise (herbes fraîches, épices douces, légumineuses) s'accorde avec un rosé sec de Méditerranée ou un rouge fruité du Languedoc.",
    texteBon:       "Un blanc vif (Sauvignon, Vermentino) peut fonctionner avec les mezze.",
    texteCompromis: "Ce vin peut fonctionner pour certains plats.",
    texteAchat:     "un Côtes du Rhône rosé, un Languedoc rouge fruité ou un Vermentino",
    regionsBonus: [
      { pattern: 'languedoc', bonus: 15 }, { pattern: 'rhone', bonus: 14 },
      { pattern: 'provence', bonus: 14 },
    ],
  },

  {
    id: 'tex_mex',
    label: 'Tex-Mex & cuisine mexicaine',
    group: 'Cuisine du monde',
    priority: 73,
    keywords: [
      'tacos', 'taco', 'burrito', 'fajita', 'enchilada', 'nachos',
      'guacamole', 'quesadilla', 'tex-mex', 'mexicain', 'chili con carne',
      'chili', 'burritos',
    ],
    ideal:      { couleurs: ['rouge', 'rosé'], regionsPreferees: ['Languedoc', 'Rhône', 'Roussillon'] },
    bon:        { couleurs: ['blanc'] },
    acceptable: { couleurs: ['effervescent'] },
    eviter:     { couleurs: ['moelleux'] },
    texteIdeal:     "Le tex-mex (épices, grillades, fromage fondu) se marie bien avec un rouge fruité (Merlot, Côtes du Rhône) ou un rosé sec.",
    texteBon:       "Un blanc aromatique peut fonctionner avec les préparations moins épicées.",
    texteCompromis: "Ce vin peut dépanner.",
    texteAchat:     "un rouge du Languedoc fruité ou un rosé sec de Provence",
    regionsBonus: [
      { pattern: 'languedoc', bonus: 14 }, { pattern: 'rhone', bonus: 12 },
      { pattern: 'provence', bonus: 10 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FROMAGES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'fromage_chevre',
    label: 'Fromage de chèvre',
    group: 'Fromages',
    priority: 88,
    keywords: [
      'chevre', 'chèvre', 'chevre chaud', 'crottin', 'crottin de chavignol',
      'sainte-maure', 'valencay', 'valençay', 'pelardon', 'picodon',
      'banon', 'buchette chevre', 'fromage de chevre',
    ],
    ideal:      { couleurs: ['blanc'], regionsPreferees: ['Loire', 'Sancerre', 'Pouilly'] },
    bon:        { couleurs: ['rosé'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['rouge', 'moelleux'], raison: "Les tanins du rouge créent une amertume avec les fromages de chèvre acidulés." },
    texteIdeal:     "L'accord chèvre–Sancerre est l'un des plus classiques — l'acidité du Sauvignon Blanc répond parfaitement à l'acidité du chèvre. Un Pouilly-Fumé ou un Quincy fonctionnent aussi très bien.",
    texteBon:       "Un rosé sec du Val de Loire peut fonctionner avec le chèvre chaud.",
    texteCompromis: "Le rouge n'est généralement pas recommandé avec le fromage de chèvre.",
    texteAchat:     "un Sancerre blanc, un Pouilly-Fumé ou un Menetou-Salon blanc",
    regionsBonus: [
      { pattern: 'sancerre', bonus: 26 }, { pattern: 'pouilly', bonus: 24 },
      { pattern: 'menetou', bonus: 20 }, { pattern: 'quincy', bonus: 20 },
      { pattern: 'touraine', bonus: 16 }, { pattern: 'loire', bonus: 14 },
    ],
  },

  {
    id: 'fromage_bleu',
    label: 'Fromage bleu (roquefort, gorgonzola)',
    group: 'Fromages',
    priority: 89,
    keywords: [
      'roquefort', 'bleu d\'auvergne', 'bleu de gex', 'fourme d\'ambert',
      'gorgonzola', 'stilton', 'danish blue', 'bleu', 'fromage bleu',
    ],
    ideal:      { couleurs: ['moelleux'], regionsPreferees: ['Sauternes', 'Jurançon', 'Banyuls'] },
    bon:        { couleurs: ['rouge'] },
    acceptable: { couleurs: ['blanc'] },
    eviter:     { couleurs: ['effervescent', 'rosé'] },
    texteIdeal:     "L'accord Roquefort–Sauternes est légendaire — le sucre s'oppose au sel du fromage avec une précision stupéfiante. Un Jurançon moelleux ou un Porto blanc fonctionnent aussi.",
    texteBon:       "Un rouge puissant (Cahors, Madiran) peut contrebalancer la puissance du bleu.",
    texteCompromis: "Un blanc sec très structuré peut fonctionner à la rigueur.",
    texteAchat:     "un Sauternes, un Jurançon moelleux, un Banyuls ou un Porto vintage",
    regionsBonus: [
      { pattern: 'sauternes', bonus: 26 }, { pattern: 'jurancon', bonus: 22 },
      { pattern: 'banyuls', bonus: 20 }, { pattern: 'cahors', bonus: 16 },
    ],
  },

  {
    id: 'fromage_pate_dure',
    label: 'Fromage à pâte dure (comté, beaufort)',
    group: 'Fromages',
    priority: 83,
    keywords: [
      'comte', 'comté', 'beaufort', 'abondance', 'cantal', 'salers',
      'gruyere', 'gruyère', 'emmental', 'tomme', 'tomme de savoie',
      'ossau-iraty', 'manchego', 'parmesan',
    ],
    ideal:      { couleurs: ['blanc', 'rouge'], regionsPreferees: ['Jura', 'Savoie', 'Bourgogne'] },
    bon:        { couleurs: ['effervescent'] },
    acceptable: { couleurs: ['rosé'] },
    eviter:     { couleurs: ['moelleux'] },
    texteIdeal:     "Les fromages à pâte dure (comté, beaufort) s'accordent idéalement avec un blanc du Jura (Vin jaune, Chardonnay) ou un rouge léger de Bourgogne. L'accord Comté–Vin Jaune est mythique.",
    texteBon:       "Un Champagne peut surprendre positivement avec un comté jeune.",
    texteCompromis: "Un rosé peut dépanner.",
    texteAchat:     "un Vin Jaune du Jura, un Chardonnay du Jura ou un Bourgogne rouge léger",
    regionsBonus: [
      { pattern: 'jura', bonus: 24 }, { pattern: 'bourgogne', bonus: 18 },
      { pattern: 'savoie', bonus: 20 }, { pattern: 'rhone', bonus: 12 },
    ],
  },

  {
    id: 'fromage_pate_molle',
    label: 'Fromage à pâte molle (brie, camembert)',
    group: 'Fromages',
    priority: 82,
    keywords: [
      'brie', 'camembert', 'coulommiers', 'chaource', 'neufchatel',
      'saint-marcellin', 'reblochon', 'vacherin', 'fromage pate molle',
    ],
    ideal:      { couleurs: ['rouge', 'blanc'], regionsPreferees: ['Bourgogne', 'Loire', 'Champagne'] },
    bon:        { couleurs: ['effervescent'] },
    acceptable: { couleurs: ['rosé'] },
    eviter:     { couleurs: ['moelleux'] },
    texteIdeal:     "Brie et camembert s'accordent avec un rouge fruité léger (Beaujolais) ou un blanc sec. Le Champagne brut avec le brie de Meaux est un accord classique.",
    texteBon:       "Un Champagne brut ou un Crémant peut magnifier le brie.",
    texteCompromis: "Un rosé peut dépanner.",
    texteAchat:     "un Beaujolais-Villages, un Champagne brut ou un Bourgogne rouge léger",
    regionsBonus: [
      { pattern: 'beaujolais', bonus: 16 }, { pattern: 'champagne', bonus: 18 },
      { pattern: 'bourgogne', bonus: 15 },
    ],
  },

  {
    id: 'fromage_fort',
    label: 'Fromage fort & puissant (munster, époisses)',
    group: 'Fromages',
    priority: 84,
    keywords: [
      'munster', 'maroilles', 'livarot', 'epoisses', 'époisse', 'langres',
      'pont-l\'eveque', 'fromage fort', 'fromage tres affine',
    ],
    ideal:      { couleurs: ['moelleux', 'rouge'], regionsPreferees: ['Alsace', 'Bourgogne', 'Jura'] },
    bon:        { couleurs: ['blanc'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['effervescent', 'rosé'] },
    texteIdeal:     "Les fromages forts (munster, maroilles, époisses) appellent un blanc aromatique puissant (Gewurztraminer d'Alsace) ou un rouge corsé. L'accord Munster–Gewurztraminer est classique en Alsace.",
    texteBon:       "Un Bourgogne rouge avec l'Époisse est l'accord bourguignon traditionnel.",
    texteCompromis: "Ce vin sera déséquilibré par la puissance du fromage.",
    texteAchat:     "un Gewurztraminer d'Alsace ou un Bourgogne rouge de caractère",
    regionsBonus: [
      { pattern: 'alsace', bonus: 22 }, { pattern: 'bourgogne', bonus: 18 },
      { pattern: 'jura', bonus: 16 },
    ],
  },

  {
    id: 'plateau_fromages',
    label: 'Plateau de fromages',
    group: 'Fromages',
    priority: 73,
    keywords: [
      'plateau de fromages', 'assortiment fromages', 'selection fromages',
      'fromages', 'fromage',
    ],
    ideal:      { couleurs: ['rouge', 'blanc'], regionsPreferees: ['Bourgogne', 'Loire', 'Bordeaux'] },
    bon:        { couleurs: ['moelleux'] },
    acceptable: { couleurs: ['effervescent', 'rosé'] },
    eviter:     { couleurs: [] },
    texteIdeal:     "Un plateau varié demande idéalement deux vins : un rouge léger (Beaujolais) pour les fromages doux et un blanc sec pour les fromages affinés et chèvres.",
    texteBon:       "Un moelleux peut sublimer certains fromages (bleu, fort).",
    texteCompromis: "Un rosé sec peut faire office de compromis pour l'ensemble.",
    texteAchat:     "deux vins : un Beaujolais/Bourgogne rouge léger + un Sancerre ou Chablis",
    regionsBonus: [
      { pattern: 'beaujolais', bonus: 14 }, { pattern: 'bourgogne', bonus: 16 },
      { pattern: 'sancerre', bonus: 16 }, { pattern: 'loire', bonus: 12 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PÂTES, RIZ & LÉGUMES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'pates_tomate',
    label: 'Pâtes sauce tomate (bolognaise, arrabiata)',
    group: 'Pâtes, riz & légumes',
    priority: 69,
    keywords: [
      'bolognaise', 'pates bolognaise', 'pâtes bolognaise', 'lasagne', 'lasagnes',
      'pates sauce tomate', 'pasta tomate', 'arrabiata', 'rigatoni',
      'spaghetti', 'spaghetti bolognaise',
    ],
    ideal:      { couleurs: ['rouge'], regionsPreferees: ['Languedoc', 'Rhône'] },
    bon:        { couleurs: ['rosé'] },
    acceptable: { couleurs: ['blanc'] },
    eviter:     { couleurs: ['effervescent', 'moelleux'] },
    texteIdeal:     "La sauce tomate appelle l'acidité d'un rouge fruité — Côtes du Rhône rouge ou un rouge de Languedoc s'accordent parfaitement.",
    texteBon:       "Un rosé sec du Midi peut fonctionner pour les pâtes légères.",
    texteCompromis: "Un blanc peut fonctionner à la rigueur.",
    texteAchat:     "un Côtes du Rhône rouge fruité ou un rouge du Languedoc accessible",
    regionsBonus: [
      { pattern: 'rhone', bonus: 15 }, { pattern: 'languedoc', bonus: 14 },
    ],
  },

  {
    id: 'pates_creameuses',
    label: 'Pâtes crèmeuses (carbonara, alfredo)',
    group: 'Pâtes, riz & légumes',
    priority: 71,
    keywords: [
      'carbonara', 'pates carbonara', 'pâtes carbonara', 'pates a la creme',
      'penne creme', 'tagliatelle creme', 'cacio e pepe', 'pates creameuses',
    ],
    ideal:      { couleurs: ['blanc'], regionsPreferees: ['Bourgogne', 'Alsace'] },
    bon:        { couleurs: ['rouge'] },
    acceptable: { couleurs: ['rosé'] },
    eviter:     { couleurs: ['effervescent', 'moelleux'] },
    texteIdeal:     "La richesse crémeuse des carbonara appelle un blanc structuré (Bourgogne blanc, Alsace Pinot Gris) qui tranche la sauce.",
    texteBon:       "Un rouge léger (Pinot noir, Beaujolais) peut fonctionner.",
    texteCompromis: "Un rosé sec peut dépanner.",
    texteAchat:     "un Bourgogne blanc structuré ou un Alsace Pinot Gris",
    regionsBonus: [
      { pattern: 'bourgogne', bonus: 18 }, { pattern: 'alsace', bonus: 16 },
    ],
  },

  {
    id: 'risotto',
    label: 'Risotto',
    group: 'Pâtes, riz & légumes',
    priority: 73,
    keywords: [
      'risotto', 'risotto champignons', 'risotto parmesan', 'risotto truffe',
      'risotto poulet', 'risotto aux asperges',
    ],
    ideal:      { couleurs: ['blanc'], regionsPreferees: ['Bourgogne', 'Alsace', 'Jura'] },
    bon:        { couleurs: ['rouge', 'rosé'] },
    acceptable: { couleurs: ['effervescent'] },
    eviter:     { couleurs: ['moelleux'] },
    texteIdeal:     "Le risotto (crémeux et riche) s'accorde idéalement avec un blanc gras et structuré (Bourgogne, Jura). Le risotto aux champignons peut aussi se marier à un rouge léger de Bourgogne.",
    texteBon:       "Un rouge léger de Bourgogne pour le risotto aux champignons.",
    texteCompromis: "Un rosé sec peut fonctionner pour les risottos légers.",
    texteAchat:     "un Bourgogne blanc ou un Jura Chardonnay",
    regionsBonus: [
      { pattern: 'bourgogne', bonus: 20 }, { pattern: 'jura', bonus: 16 },
      { pattern: 'alsace', bonus: 14 },
    ],
  },

  {
    id: 'vegetarien_leger',
    label: 'Salade & légumes légers',
    group: 'Pâtes, riz & légumes',
    priority: 62,
    keywords: [
      'salade verte', 'salade composee', 'legumes grilles', 'legumes vapeur',
      'ratatouille', 'caponata', 'primeurs', 'crudites', 'bruschetta tomate',
      'poivrons grilles', 'courgettes grillees', 'buddha bowl', 'salade nicoise',
    ],
    ideal:      { couleurs: ['blanc', 'rosé'], regionsPreferees: ['Loire', 'Provence', 'Languedoc'] },
    bon:        { couleurs: ['effervescent'] },
    acceptable: { couleurs: ['rouge'] },
    eviter:     { couleurs: ['moelleux'] },
    texteIdeal:     "Les plats végétariens légers sont sublimés par un blanc vif (Sancerre, Muscadet) ou un rosé sec de Provence.",
    texteBon:       "Un effervescent léger et sec peut fonctionner.",
    texteCompromis: "Un rouge léger peut dépanner.",
    texteAchat:     "un Sancerre blanc, un Muscadet ou un rosé de Provence",
    regionsBonus: [
      { pattern: 'sancerre', bonus: 16 }, { pattern: 'muscadet', bonus: 14 },
      { pattern: 'provence', bonus: 14 },
    ],
  },

  {
    id: 'gratin_fondue_raclette',
    label: 'Gratin, fondue & raclette',
    group: 'Pâtes, riz & légumes',
    priority: 77,
    keywords: [
      'gratin dauphinois', 'gratin', 'fondue savoyarde', 'fondue', 'raclette',
      'tartiflette', 'croziflette', 'aligot', 'rösti', 'rosti',
    ],
    ideal:      { couleurs: ['blanc'], regionsPreferees: ['Savoie', 'Jura', 'Alsace'] },
    bon:        { couleurs: ['rouge'] },
    acceptable: { couleurs: ['rosé'] },
    eviter:     { couleurs: ['moelleux', 'effervescent'] },
    texteIdeal:     "La raclette et la fondue savoyarde appellent les vins de Savoie (Apremont, Roussette) pour leur acidité qui coupe le gras du fromage fondu.",
    texteBon:       "Un rouge léger de Savoie (Mondeuse) peut fonctionner.",
    texteCompromis: "Un rosé sec peut dépanner.",
    texteAchat:     "un vin de Savoie blanc (Apremont, Jacquère) ou un Jura Chardonnay",
    regionsBonus: [
      { pattern: 'savoie', bonus: 24 }, { pattern: 'jura', bonus: 18 },
      { pattern: 'alsace', bonus: 14 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DESSERTS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'dessert_chocolat_noir',
    label: 'Dessert au chocolat noir',
    group: 'Desserts',
    priority: 86,
    keywords: [
      'fondant chocolat', 'fondant au chocolat', 'mousse au chocolat',
      'brownies', 'brownie', 'ganache chocolat', 'tarte chocolat',
      'gateau chocolat noir', 'chocolat amer', 'coulant chocolat',
      'soufle chocolat', 'truffes chocolat',
    ],
    ideal:      { couleurs: ['moelleux'], regionsPreferees: ['Banyuls', 'Maury', 'Rivesaltes'] },
    bon:        { couleurs: ['rouge'] },
    acceptable: { couleurs: ['effervescent'] },
    eviter:     { couleurs: ['blanc', 'rosé'] },
    texteIdeal:     "L'accord Chocolat noir–Banyuls est canonique. Ce vin doux naturel du Roussillon partage avec le chocolat amer des notes de fruits noirs et de café. Le Maury rouge fonctionne aussi parfaitement.",
    texteBon:       "Un rouge puissant et fruité (Cahors) peut convenir avec un fondant.",
    texteCompromis: "Un rouge léger peut dépanner à la rigueur.",
    texteAchat:     "un Banyuls Grand Cru, un Maury rouge ou un Porto Vintage",
    regionsBonus: [
      { pattern: 'banyuls', bonus: 26 }, { pattern: 'maury', bonus: 24 },
      { pattern: 'rivesaltes', bonus: 20 }, { pattern: 'roussillon', bonus: 18 },
    ],
  },

  {
    id: 'dessert_chocolat_lait',
    label: 'Tiramisu & desserts chocolat lait',
    group: 'Desserts',
    priority: 83,
    keywords: [
      'chocolat au lait', 'tiramisu', 'profiteroles', 'eclair chocolat',
      'paris-brest', 'mousse chocolat lait',
    ],
    ideal:      { couleurs: ['moelleux', 'effervescent'], regionsPreferees: ['Sauternes', 'Loire', 'Champagne'] },
    bon:        { couleurs: ['rouge'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['blanc', 'rosé'] },
    texteIdeal:     "Le tiramisu et le chocolat au lait s'accordent avec un moelleux léger ou un Champagne demi-sec.",
    texteBon:       "Un rouge fruité léger peut fonctionner.",
    texteCompromis: "Un rouge trop tannique sera asséchant.",
    texteAchat:     "un Champagne demi-sec, un Sauternes ou un Moscato d'Asti",
    regionsBonus: [
      { pattern: 'champagne', bonus: 18 }, { pattern: 'sauternes', bonus: 20 },
      { pattern: 'loire', bonus: 16 },
    ],
  },

  {
    id: 'dessert_fruits_rouges',
    label: 'Desserts aux fruits rouges',
    group: 'Desserts',
    priority: 81,
    keywords: [
      'fraises', 'framboises', 'tarte aux fraises', 'tarte framboises',
      'charlotte aux fruits rouges', 'coulis framboises', 'sorbet fruits rouges',
      'pavlova fruits rouges', 'fruits rouges',
    ],
    ideal:      { couleurs: ['effervescent', 'moelleux'], regionsPreferees: ['Champagne', 'Loire'] },
    bon:        { couleurs: ['rosé'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['rouge', 'blanc'] },
    texteIdeal:     "Les fruits rouges frais s'épanouissent avec un effervescent rosé demi-sec (Champagne rosé, Crémant de Loire rosé) ou un Coteaux du Layon léger.",
    texteBon:       "Un rosé demi-sec peut très bien fonctionner.",
    texteCompromis: "Un blanc sec serait trop sévère face aux fruits acidulés.",
    texteAchat:     "un Champagne rosé demi-sec ou un Crémant de Loire rosé",
    regionsBonus: [
      { pattern: 'champagne', bonus: 20 }, { pattern: 'loire', bonus: 18 },
    ],
  },

  {
    id: 'tarte_fruits',
    label: 'Tarte aux fruits & crumble',
    group: 'Desserts',
    priority: 79,
    keywords: [
      'tarte aux pommes', 'tarte tatin', 'crumble', 'clafoutis', 'far breton',
      'gateau aux poires', 'tarte poire', 'tarte abricot', 'tarte aux prunes',
      'compote', 'chausson aux pommes', 'tarte mirabelle',
    ],
    ideal:      { couleurs: ['moelleux', 'effervescent'], regionsPreferees: ['Loire', 'Alsace', 'Bordeaux'] },
    bon:        { couleurs: ['rosé'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['rouge', 'blanc'] },
    texteIdeal:     "Les tartes aux fruits s'accordent avec la douceur d'un Vouvray moelleux, d'un Coteaux du Layon ou d'un Alsace vendanges tardives.",
    texteBon:       "Un Champagne demi-sec ou un Crémant doux peut fonctionner.",
    texteCompromis: "Un blanc sec serait trop asséchant.",
    texteAchat:     "un Vouvray moelleux, un Coteaux du Layon ou un Alsace Vendanges Tardives",
    regionsBonus: [
      { pattern: 'vouvray', bonus: 22 }, { pattern: 'coteaux du layon', bonus: 22 },
      { pattern: 'alsace', bonus: 18 }, { pattern: 'sauternes', bonus: 16 },
    ],
  },

  {
    id: 'dessert_creme',
    label: 'Crème brûlée & desserts lactés',
    group: 'Desserts',
    priority: 79,
    keywords: [
      'creme brulee', 'crème brûlée', 'panna cotta', 'ile flottante',
      'flan', 'creme caramel', 'millefeuille', 'saint-honore', 'glace vanille',
      'glace', 'baba au rhum',
    ],
    ideal:      { couleurs: ['moelleux', 'effervescent'], regionsPreferees: ['Sauternes', 'Loire', 'Champagne'] },
    bon:        { couleurs: ['rosé'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['rouge', 'blanc'] },
    texteIdeal:     "Les desserts crémeux à la vanille s'accordent avec un Sauternes, un Champagne demi-sec ou un Vouvray moelleux.",
    texteBon:       "Un effervescent doux ou demi-sec peut fonctionner.",
    texteCompromis: "Le rouge n'est pas adapté aux desserts crémeux.",
    texteAchat:     "un Sauternes, un Barsac ou un Champagne demi-sec",
    regionsBonus: [
      { pattern: 'sauternes', bonus: 24 }, { pattern: 'champagne', bonus: 18 },
      { pattern: 'loire', bonus: 16 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // APÉRITIF
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'aperitif',
    label: 'Apéritif & amuse-gueules',
    group: 'Apéritif',
    priority: 65,
    keywords: [
      'aperitif', 'apéritif', 'apero', 'apéro', 'chips', 'cacahuetes',
      'olives', 'gougeres', 'canapes', 'blinis', 'verrines', 'amuse-gueules',
      'toast', 'crackers', 'petits fours sales',
    ],
    ideal:      { couleurs: ['effervescent', 'rosé', 'blanc'], regionsPreferees: ['Champagne', 'Provence', 'Loire'] },
    bon:        { couleurs: ['rouge'] },
    acceptable: { couleurs: [] },
    eviter:     { couleurs: ['moelleux'] },
    texteIdeal:     "L'apéritif appelle légèreté et fraîcheur : Champagne, Crémant, rosé de Provence sec ou un blanc vif. Les bulles sont un symbole de convivialité.",
    texteBon:       "Un rouge léger (Beaujolais, Pinot noir) peut dépanner à l'apéro.",
    texteCompromis: "Un rouge trop puissant peut être écrasant à l'apéritif.",
    texteAchat:     "un Champagne Brut, un Crémant d'Alsace ou un rosé de Provence sec",
    regionsBonus: [
      { pattern: 'champagne', bonus: 22 }, { pattern: 'provence', bonus: 16 },
      { pattern: 'alsace', bonus: 16 }, { pattern: 'loire', bonus: 14 },
      { pattern: 'beaujolais', bonus: 12 },
    ],
  },
];
