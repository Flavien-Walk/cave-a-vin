export const Colors = {
  // ── Fonds (light premium) ──
  cremeIvoire:  '#FAFAF8',   // fond principal
  champagne:    '#FFFFFF',   // cartes / surfaces
  parchemin:    '#EDE8E0',   // bordures

  // ── Textes ──
  brunMoka:     '#1A1008',   // texte principal (quasi-noir chaud)
  brunMoyen:    '#6B5B4E',   // texte secondaire
  brunClair:    '#A89888',   // texte atténué

  // ── Accents ──
  lieDeVin:     '#7B1F3A',   // bordeaux principal
  ambreChaud:      '#B8922A',   // or chaud
  ambreChaudLight: '#FDF5E0',  // teinte dorée claire
  cramoisDoux:  '#A83050',   // bordeaux moyen

  // ── Badges vin ──
  rougeVin:          '#7B1F3A',
  rougeVinLight:     '#FAF0F3',
  blancDore:         '#B8922A',
  blancDoreLight:    '#FBF5E6',
  rosePale:          '#D4607A',
  rosePaleLight:     '#FDF0F2',
  effervescent:      '#2E7D5A',
  effervescentLight: '#EBF5EF',
  moelleux:          '#9B6B2A',
  moelleuxLight:     '#FBF3E6',
  orDoux:            '#B8922A',
  orDouxLight:       '#FBF5E6',
  bordeaux:          '#7B1F3A',

  // ── États ──
  vertSauge:         '#2E7D5A',
  vertSaugeLight:    '#EBF5EF',
  rougeAlerte:       '#C0392B',
  rougeAlerteLight:  '#FEF0EE',

  // ── Utilitaires ──
  white:        '#FFFFFF',
  black:        '#000000',
  transparent:  'transparent',
  overlay:      'rgba(26, 16, 8, 0.55)',
  shadow:       'rgba(26, 16, 8, 0.08)',
} as const;

export type ColorKey = keyof typeof Colors;
