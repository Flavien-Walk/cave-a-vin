# Cave à Vin — Backend API v2

API REST Node.js/Express pour l'application mobile Cave à Vin.  
Branch `backend` — déploiement Render.

## Stack

- **Runtime** : Node.js 18+
- **Framework** : Express 4
- **Base de données** : MongoDB Atlas via Mongoose
- **Déploiement** : Render (Web Service)

## Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/health` | Santé du serveur |
| GET | `/api/bottles` | Toutes les bouteilles |
| POST | `/api/bottles` | Créer une bouteille |
| GET | `/api/bottles/:id` | Détail bouteille |
| PUT | `/api/bottles/:id` | Modifier bouteille |
| DELETE | `/api/bottles/:id` | Supprimer bouteille |
| PUT | `/api/bottles/:id/favorite` | Toggle favori |
| POST | `/api/bottles/:id/drink` | Enregistrer consommation |
| GET | `/api/bottles/:id/history` | Historique consommation |
| POST | `/api/bottles/:id/notes` | Ajouter note de dégustation |
| DELETE | `/api/bottles/:id/notes/:noteId` | Supprimer note |
| GET | `/api/bottles/recommend` | Bouteilles à boire bientôt |
| POST | `/api/bottles/suggest-wine` | Accord mets-vins |
| GET | `/api/stats/summary` | Statistiques cave |
| GET | `/api/wishlist` | Liste de souhaits |
| POST | `/api/wishlist` | Ajouter à la wishlist |
| PUT | `/api/wishlist/:id` | Modifier item wishlist |
| DELETE | `/api/wishlist/:id` | Supprimer item wishlist |
| PUT | `/api/wishlist/:id/purchase` | Marquer comme acheté |

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NODE_ENV` | Environnement | `production` |
| `PORT` | Port d'écoute | `3000` |
| `MONGODB_URI` | URI MongoDB Atlas | `mongodb+srv://...` |
| `MONGODB_DB` | Nom de la base | `cave-a-vin` |

## Déploiement Render

1. Créer un **Web Service** sur [render.com](https://render.com)
2. Connecter ce repo, branche `backend`
3. **Build command** : `npm install`
4. **Start command** : `node server.js`
5. Ajouter les variables d'environnement dans `Environment`

## Développement local

```bash
npm install
cp .env.example .env  # remplir les variables
npm run dev           # nodemon
```
