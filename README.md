# Bail-Bail POC 🚀

Bail-Bail est un Proof of Concept (POC) moderne visant à simplifier et professionnaliser la gestion locative immobilière. 

## 🌟 Fonctionnalités principales

### Côté Candidats (Locataires)
- **Expérience Premium :** Design moderne, immersif avec vidéos d'arrière-plan compressées.
- **Dossier Facilité :** Accès sécurisé au logement via un code unique (`BB-CHOISY-001`).
- **Suivi en temps réel :** Tableau de bord pour suivre l'état de validation de ses documents (Validé, Rejeté avec motif, En attente).
- **Prise de rendez-vous :** Sélection intuitive de créneaux de visite.

### Côté Propriétaires (Admin)
- **Tableau de Bord :** Vue consolidée des logements et des candidatures.
- **Gestion des Dossiers :** Validation ou rejet ciblé des pièces justificatives.
- **Paramètres Avancés :** Configuration des logements (éligibilité GLI, politiques pour les étudiants).
- **Simulateur de Connexion :** Interface d'impersonation pour tester les parcours utilisateurs instantanément.
- **Audit Logs :** Traçabilité complète des actions effectuées sur les dossiers.

## 🛠 Stack Technique

- **Framework :** Next.js 15 (App Router, Server Actions)
- **Styling :** Tailwind CSS v4 & shadcn/ui
- **Base de données :** PostgreSQL (hébergé via Coolify)
- **ORM :** Prisma
- **Validation :** Zod

## 🚀 Installation & Déploiement

### Déploiement (Coolify)
Le projet est packagé via Docker (avec un `.dockerignore` optimisé pour éviter les erreurs OOM) et est conçu pour être déployé sur des plateformes comme Coolify.

### Lancement Local
1. Cloner le projet et installer les dépendances :
   ```bash
   npm install
   ```
2. Configurer la variable `DATABASE_URL` (PostgreSQL) dans le fichier `.env`.
3. Appliquer les migrations de schéma et populer les données :
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
4. Démarrer le serveur de développement :
   ```bash
   npm run dev
   ```

## 📋 Prochaines Étapes (Roadmap)
- [ ] **Stockage Cloud :** Remplacer le stockage local des documents (`private_uploads`) par un bucket S3.
- [ ] **Authentification :** Migrer vers NextAuth.js (Auth.js) pour plus de robustesse.
- [ ] **Notifications :** Câbler l'envoi d'e-mails (via Resend ou Nodemailer) pour alerter les candidats sur le statut de leur dossier.
- [ ] **RGPD :** Script CRON de purge automatique des documents expirés.
