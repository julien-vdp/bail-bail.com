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

---

## 📂 Gestion Dynamique et Conformité des Pièces Justificatives

Le parcours candidat et la checklist documentaire de Bail-Bail sont désormais entièrement dynamiques et s'adaptent selon les réglages définis par le propriétaire sur l'annonce.

### ⚙️ Fonctionnement des paramètres de dossier
Le propriétaire peut paramétrer les éléments suivants depuis sa fiche logement :
* **Garantie Loyers Impayés (GLI) :** Active un message informatif et compare les revenus du candidat au seuil exigé par l'assureur.
* **Critères d'acceptation :** Possibilité de bloquer ou d'accepter les profils étudiants, et de permettre/refuser l'ajout de garants.
* **Sélectivité des pièces :** Possibilité de rendre facultatifs ou d'exclure les justificatifs de domicile actuel, de situation professionnelle, de revenus ou l'avis d'imposition.
* **Consignes personnalisées :** Texte d'aide rédigé par le propriétaire s'affichant sur l'écran d'upload.

### 📐 Logique métier (`generateDocumentRequirements`)
La fonction centrale `/src/lib/documentRequirements.ts` génère les pièces requises en fonction du couple **Annonce (Listing) x Candidat**. Elle s'assure de ne jamais demander plus de pièces que nécessaire :
* Un étudiant ne se verra pas demander de justificatif d'emploi traditionnel, mais son certificat de scolarité.
* Un retraité ne recevra pas de demande de situation professionnelle.
* Un garant ne verra sa section de documents s'afficher que si les garants sont acceptés sur l'annonce et déclarés par le candidat.

### ⚖️ Contraintes Légales (Loi Alur / Décret n° 2015-1437)
> [!IMPORTANT]
> La liste des documents exigés par Bail-Bail est strictement alignée avec le décret officiel listant les pièces justificatives autorisées en France. 
> 
> **Ne jamais ajouter de pièces interdites par la loi sans validation juridique préalable.**
> Les pièces suivantes sont **formellement interdites** et ne doivent jamais être intégrées dans l'application :
> - Carte vitale
> - Relevé de compte bancaire
> - Extrait de casier judiciaire
> - Dossier médical
> - Contrat de mariage ou jugement de divorce
> - Photographie d'identité autre que celle de la pièce d'identité officielle
> - Chèque de réservation
> - RIB obligatoire avant acceptation formelle du dossier

