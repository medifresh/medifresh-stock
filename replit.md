# Medifresh Stock v1

Application complète de gestion de stock médical en React + Node.js, avec synchronisation temps réel, PWA et interface Tailwind.

## Overview

Medifresh Stock est une application web progressive (PWA) destinée à la gestion de stock médical en temps réel. Elle permet au personnel médical de :
- Consulter et modifier le stock en temps réel
- Recevoir des alertes visuelles sur les stocks critiques et bas
- Enregistrer des arrivages de produits
- Exporter les données en CSV
- Imprimer des rapports de stock
- Travailler hors ligne avec synchronisation automatique
- Gérer les fournisseurs avec coordonnées complètes
- Trier les colonnes du tableau (asc/desc)
- Générer automatiquement les listes de commande

## Architecture

### Frontend (React + TypeScript + Tailwind)
- **Login** : Authentification par code d'accès (2025)
- **StockManager** : Interface principale de gestion du stock
- **Composants** : Header, StockTable, StockFilters, StockArrivalModal, OfflineBanner

### Backend (Node.js + Express)
- **API REST** : Endpoints pour CRUD du stock
- **WebSocket** : Synchronisation temps réel entre clients
- **Stockage** : In-memory avec données initiales

### Endpoints API
- `GET /api/stock` - Liste tous les articles
- `GET /api/stock/:id` - Récupère un article
- `POST /api/stock` - Crée un article
- `PUT /api/stock/:id` - Met à jour un article
- `DELETE /api/stock/:id` - Supprime un article
- `POST /api/stock/arrivals` - Applique un arrivage
- `POST /api/sync` - Synchronise les données hors ligne
- `GET /api/backup` - Télécharge une sauvegarde JSON
- `POST /api/auth` - Vérifie le code d'accès
- `GET /api/suppliers` - Liste tous les fournisseurs
- `GET /api/suppliers/:id` - Récupère un fournisseur
- `POST /api/suppliers` - Crée un fournisseur
- `PUT /api/suppliers/:id` - Met à jour un fournisseur
- `DELETE /api/suppliers/:id` - Supprime un fournisseur

### WebSocket
- Chemin : `/ws`
- Types de messages : `stock_update`, `stock_create`, `stock_delete`, `full_sync`, `arrival`

## User Preferences

- **Langue** : Français
- **Thème** : Support mode clair/sombre
- **Code d'accès** : 2025

## Recent Changes

- 2025-12-03 : Ajout des fonctionnalités avancées
  - Gestion des fournisseurs avec CRUD complet
  - Popup détails article avec association fournisseur
  - Tri des colonnes du tableau (asc/desc/reset)
  - Liste de commande automatique avec export CSV
  - Formule : Manquant = Seuil - (Stock + Arrivage)
  
- 2025-12-03 : Création initiale de l'application
  - Implémentation complète du frontend React avec Tailwind
  - Backend Express avec WebSocket pour temps réel
  - PWA avec manifest.json
  - Support hors ligne avec file d'attente

## Development

### Running the Application
```bash
npm run dev
```
L'application démarre sur le port 5000.

### Structure des fichiers
```
├── client/
│   ├── public/
│   │   ├── manifest.json
│   │   └── favicon.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── article-detail-modal.tsx  # Popup détails article + fournisseurs
│   │   │   ├── header.tsx
│   │   │   ├── offline-banner.tsx
│   │   │   ├── order-list-modal.tsx      # Liste de commande automatique
│   │   │   ├── stock-arrival-modal.tsx
│   │   │   ├── stock-filters.tsx
│   │   │   └── stock-table.tsx           # Tableau avec tri des colonnes
│   │   ├── lib/
│   │   │   ├── auth-context.tsx
│   │   │   ├── theme-context.tsx
│   │   │   └── websocket-context.tsx
│   │   ├── pages/
│   │   │   ├── login.tsx
│   │   │   └── stock-manager.tsx
│   │   └── App.tsx
├── server/
│   ├── routes.ts
│   └── storage.ts
└── shared/
    └── schema.ts                         # Modèles: stockItems, suppliers
```

## Deployment

L'application est conçue pour être déployée sur Replit. Utilisez le bouton "Publish" pour la publier.

## Testing

- Code d'accès pour connexion : **2025**
- Les stocks sont pré-remplis avec 15 articles médicaux
- Le mode sombre/clair peut être basculé via le bouton soleil/lune
