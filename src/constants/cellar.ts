// ─── Structure personnalisée des caves ─────────────────────────────────────
// NE PAS MODIFIER sans raison métier — logique personnelle de rangement.

export interface CaveDefinition {
  id: number;
  name: string;
  emplacements: string[];
}

export const CAVES: CaveDefinition[] = [
  {
    id: 1,
    name: 'Cave 1',
    emplacements: [
      'Haut Derrière',
      'Haut Devant',
      '1ère Clayette',
      '2ème Clayette',
      '3ème Clayette',
      'Milieu Derrière',
      'Milieu Devant',
      'Bas Derrière',
      'Bas Devant',
      'Très Bas',
    ],
  },
  {
    id: 2,
    name: 'Cave 2',
    emplacements: [
      'Haut Derrière',
      'Haut Devant',
      '1ère Clayette',
      '2ème Clayette',
      '3ème Clayette',
      'Milieu Derrière',
      'Milieu Devant',
      'Bas Derrière',
      'Bas Devant',
      'Très Bas',
    ],
  },
  {
    id: 3,
    name: 'Cave 3',
    emplacements: [
      'Haut Derrière',
      'Haut Devant',
      '1ère Clayette',
      '2ème Clayette',
      '3ème Clayette',
      'Milieu Derrière',
      'Milieu Devant',
      'Bas Derrière',
      'Bas Devant',
      'Très Bas',
    ],
  },
  {
    id: 4,
    name: 'Cave 4',
    emplacements: [
      'Haut Derrière',
      'Haut Devant',
      'Milieu Haut Derrière',
      'Milieu Haut Devant',
      'Milieu Bas Derrière',
      'Milieu Bas Devant',
      'Bas Derrière',
      'Bas Devant',
      'Très Bas',
    ],
  },
];

export const CAVE_NAMES = CAVES.map(c => c.name);

export const getEmplacements = (caveName: string): string[] => {
  const cave = CAVES.find(c => c.name === caveName);
  return cave ? cave.emplacements : [];
};
