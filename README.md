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

## 📂 Gestion Dynamique et Moteur Conditionnel GLI

Le parcours candidat, le paramétrage propriétaire et la checklist documentaire de Bail-Bail sont désormais pilotés par un **Moteur Conditionnel Propriétaire/Locataire** basé sur les règles de solvabilité de la Garantie Loyers Impayés (GLI).

### ⚙️ 1. Paramétrage Back-Office Propriétaire
Le propriétaire peut configurer les règles de son annonce dans la section **"Conditions du dossier locatif"** :
* **Garantie Loyers Impayés (GLI) :** Activation du mode GLI (`NONE`, `INDICATIVE` ou `STRICT`).
* **Loyer charges comprises :** Champ obligatoire permettant de calculer précisément le taux d'effort.
* **Profils de solvabilité GLI :** Affichage informatif des taux d'effort standard :
  * CDI hors période d'essai / Fonctionnaire / Retraité : **37 %** maximum.
  * Travailleur indépendant (min. 2 ans) : **33 %** maximum.
  * CDI en mobilité : **30 %** maximum.
  * CDD (durée restante d'au moins 12 mois) : **25 %** maximum.
* **Profils acceptés :** Cases à cocher pour filtrer ou autoriser certains profils (ex. étudiants avec caution, indépendants, etc.).
* **Gestion des étudiants et garants :** Règles spécifiques autorisant ou rendant obligatoire la caution solidaire.
* **Locataire déjà en place :** Option pour les locataires déjà installés (depuis moins ou plus de 6 mois), déclenchant des demandes de pièces d'historique de paiement.

### 👤 2. Parcours Locataire Dynamique
Le locataire remplit son profil avec des questions conditionnelles animées en temps réel :
* S'il est en **CDI**, la question sur la période d'essai s'affiche.
* S'il est en **CDD**, la durée restante du contrat est demandée.
* S'il est **indépendant**, la durée d'activité est demandée.
* S'il est **étudiant**, la caution solidaire est proposée.
* S'il choisit la **colocation**, il saisit le nombre de colocataires et renseigne une fiche simplifiée pour chacun.
* **Calculateur en temps réel :** Calcule le taux d'effort global et indique si le dossier semble compatible, à vérifier ou nécessite une analyse complémentaire.

### 📋 3. Checklist Documentaire Dynamique
La fonction `generateDocumentRequirements(property, candidate)` calcule en base de données et de manière persistante la liste exacte des pièces exigées (en évitant la perte de documents lors d'une mise à jour de profil). 
Les pièces de fiches de paie demandées sont générées pour les 3 derniers mois glissants avec l'affichage explicite des mois (ex. *Fiche de paie - mai 2026*).

---

## 🧪 Scénarios de Test GLI

Une suite de tests unitaires valide la conformité du moteur par rapport aux 10 scénarios clés :
1. **GLI Oui, CDI hors période d'essai, revenu OK** : Génère les pièces de base (CNI, Domicile, Contrat de travail, 3 fiches de paie, avis d'imposition).
2. **GLI Oui, CDI en période d'essai** : Génère une alerte douce sur l'éligibilité du candidat tout en demandant les pièces.
3. **GLI Oui, CDD moins de 12 mois** : Valide l'affichage des alertes de solvabilité pour les contrats courts.
4. **GLI Oui, étudiant avec caution** : Exige le justificatif étudiant et toutes les pièces de revenus/identité du garant.
5. **GLI Oui, étudiant sans caution** : Affiche une alerte bloquante ou forte si la caution est obligatoire.
6. **GLI Oui, indépendant de moins de 2 ans** : Demande les justificatifs d'activité tout en signalant la contrainte des 2 ans de bilan.
7. **GLI Non, garant accepté** : Demande les pièces standards du candidat et du garant sans appliquer les taux d'effort GLI.
8. **Colocation avec un CDI et un demandeur d'emploi** : Permet le cumul des revenus et génère les checklists pour les deux colocataires.
9. **Retraité seul** : Calcule le reste à vivre indicatif et demande les justificatifs de pension.
10. **Locataire déjà en place depuis plus de 6 mois** : Demande un historique de paiement (quittances des 6 derniers mois et relevés bancaires) à la place des pièces de revenus standards.

Pour lancer les tests :
```bash
npx tsx scratch/validateRequirements.ts
```

---

## ⚠️ Limites du POC & Conformité Légale

* **Valeur Indicative :** Le moteur fournit une analyse indicative de solvabilité pour aider le propriétaire à trier les dossiers. Il ne remplace en aucun cas l'accord final écrit de l'assureur GLI.
* **RGPD & Loi Alur (Décret n° 2015-1437) :** L'application respecte la liste des pièces justificatives autorisées en France. Il est formellement interdit de demander des pièces telles que :
  * Un relevé de compte bancaire complet
  * Une carte vitale ou dossier médical
  * Un extrait de casier judiciaire
  * Un chèque de réservation


