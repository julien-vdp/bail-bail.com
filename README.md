# Bail-Bail POC

Ce projet est un Proof of Concept (POC) local pour la plateforme Bail-Bail, permettant la gestion simplifiée des dossiers locatifs.

## Fonctionnalités principales
- **Candidats :** Saisie du code logement, sélection de créneaux de visite, upload local des documents justificatifs et suivi de la complétude du dossier.
- **Propriétaires (Admin) :** Tableau de bord récapitulatif, vue détaillée des logements, consultation des dossiers et documents des candidats, gestion des statuts d'acceptation.

## Technologies utilisées
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4 & shadcn/ui
- Prisma ORM & SQLite (Base de données locale)
- Zod (Validation)
- Server Actions (Mutations et File Upload local)

## Installation

1. Cloner ou ouvrir le projet dans votre éditeur.
2. Installer les dépendances :
   ```bash
   npm install
   ```

## Configuration de la base de données

Le projet utilise Prisma avec SQLite. La base locale sera créée à la racine du projet (`dev.db`).

1. Appliquer les migrations de schéma :
   ```bash
   npx prisma migrate dev --name init
   ```
2. Peupler la base de données avec des données fictives :
   ```bash
   npx prisma db seed
   ```

## Lancement

Démarrer le serveur de développement local :
```bash
npm run dev
```
L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

## Parcours de test

1. **Candidat :** 
   - Ouvrez la page d'accueil (`/`) et entrez le code `BB-CHOISY-001`.
   - Vous serez redirigé vers la page du logement.
   - Cliquez sur "Choisir un créneau", remplissez le formulaire avec vos informations.
   - Sur la page du dossier, uploadez quelques documents (PDF, JPG ou PNG).

2. **Propriétaire :**
   - Accédez au back-office propriétaire : [`/admin`](http://localhost:3000/admin).
   - Depuis le tableau de bord, cliquez sur le logement "Appartement T2 lumineux à Choisy-le-Roi".
   - Cliquez sur "Examiner le dossier" du candidat que vous venez de créer.
   - Téléchargez les documents déposés et passez le statut en "En cours d'analyse" ou "Accepté".
   - Consultez l'historique pour voir les traces (Audit Logs).

## Limites du POC
- **Stockage des fichiers :** Les fichiers uploadés sont stockés localement dans `public/uploads`. En production, un service comme AWS S3 ou Vercel Blob devra être utilisé.
- **Authentification :** L'accès à `/admin` n'est pas protégé par un système d'authentification complet (comme NextAuth/Auth.js).
- **Envoi d'e-mails :** L'envoi de confirmations par e-mail n'est pas implémenté.
- **Purge des documents :** Un champ `expiresAt` existe, mais aucun CRON job n'est configuré pour supprimer les fichiers du disque physiquement.

## Prochaines étapes
- [ ] Implémenter NextAuth.js pour sécuriser l'espace propriétaire.
- [ ] Remplacer l'upload local par un stockage Cloud (S3).
- [ ] Implémenter Resend pour l'envoi d'e-mails (confirmations, changements de statut).
- [ ] Mettre en place un CRON pour le nettoyage des dossiers expirés.
