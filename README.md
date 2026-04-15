# Cave à Vin — Application Mobile v2

Application mobile de gestion de cave à vin personnelle.  
Branch `main` — Expo / React Native.

## Stack

- **Framework** : Expo SDK 52 + React Native 0.76
- **Navigation** : Expo Router (file-based)
- **State** : Zustand 5
- **HTTP** : Axios
- **Types** : TypeScript strict

## Fonctionnalités

- Dashboard personnalisé avec stats, favoris, alertes
- Cave avec 4 caves personnalisées et emplacements précis
- Ajout en 3 étapes (essentiel > détails > rangement)
- Fiche bouteille complète (dégustation, consommation, historique)
- Filtres, recherche, tri avancés
- Wishlist avec priorités
- Accords mets-vins
- Recommandations de bouteilles à boire
- Statistiques complètes (couleur, région, millésime, cave)
- 146 anecdotes viticoles

## Structure personnalisée des caves

```
Cave 1, 2, 3 :
  Haut Derrière · Haut Devant · 1ère Clayette · 2ème Clayette · 3ème Clayette
  Milieu Derrière · Milieu Devant · Bas Derrière · Bas Devant · Très Bas

Cave 4 :
  Haut Derrière · Haut Devant
  Milieu Haut Derrière · Milieu Haut Devant
  Milieu Bas Derrière · Milieu Bas Devant
  Bas Derrière · Bas Devant · Très Bas
```

## Installation

```bash
npm install
```

## Configuration

Copier `.env` et adapter l'URL backend :

```
EXPO_PUBLIC_API_URL=https://votre-backend.onrender.com
```

## Lancement

```bash
npx expo start
```

Ouvrir avec Expo Go sur iOS/Android.
