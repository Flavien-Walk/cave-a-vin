export type SiteName = 'Lyon' | 'Marseillan';

export interface SiteCaveDef {
  name: string;
  location: SiteName;
  emplacements: string[];
}

export interface SiteDef {
  name: SiteName;
  label: string;
  emoji: string;
  caves: SiteCaveDef[];
}

// ── Structure fixe des sites ──────────────────────────────────────────────────

export const SITE_DEFINITIONS: SiteDef[] = [
  {
    name: 'Lyon',
    label: 'Lyon',
    emoji: '🏠',
    caves: [
      {
        name: 'Cave 1',
        location: 'Lyon',
        emplacements: [
          'Haut Derrière', 'Haut Devant',
          '1ère Clayette', '2ème Clayette', '3ème Clayette',
          'Milieu Derrière', 'Milieu Devant',
          'Bas Derrière', 'Bas Devant',
          'Très Bas',
        ],
      },
      {
        name: 'Cave 2',
        location: 'Lyon',
        emplacements: [
          'Haut Derrière', 'Haut Devant',
          '1ère Clayette', '2ème Clayette', '3ème Clayette',
          'Milieu Derrière', 'Milieu Devant',
          'Bas Derrière', 'Bas Devant',
          'Très Bas',
        ],
      },
      {
        name: 'Cave 3',
        location: 'Lyon',
        emplacements: [
          'Haut Derrière', 'Haut Devant',
          '1ère Clayette', '2ème Clayette', '3ème Clayette',
          'Milieu Derrière', 'Milieu Devant',
          'Bas Derrière', 'Bas Devant',
          'Très Bas',
        ],
      },
      {
        name: 'Cave 4',
        location: 'Lyon',
        emplacements: [
          'Haut Derrière', 'Haut Devant',
          'Milieu Haut Derrière', 'Milieu Haut Devant',
          'Milieu Bas Derrière', 'Milieu Bas Devant',
          'Bas Derrière', 'Bas Devant',
          'Très Bas',
        ],
      },
    ],
  },
  {
    name: 'Marseillan',
    label: 'Marseillan',
    emoji: '🌊',
    caves: [
      {
        name: 'Cave Marseillan',
        location: 'Marseillan',
        emplacements: [], // Pas de découpage en emplacements précis
      },
    ],
  },
];

export const SITE_NAMES: SiteName[] = SITE_DEFINITIONS.map(s => s.name);

export function getSiteDef(name: SiteName): SiteDef {
  return SITE_DEFINITIONS.find(s => s.name === name) ?? SITE_DEFINITIONS[0];
}

export function getSiteCaveNames(site: SiteName): string[] {
  return getSiteDef(site).caves.map(c => c.name);
}
