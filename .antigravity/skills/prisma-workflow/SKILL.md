---
name: Prisma Workflow
description: Guide et règles de sécurité pour la modification de la base de données via Prisma dans le projet Bail-Bail.
---

# 🚀 Workflow Prisma pour Bail-Bail

Lorsque tu es amené à modifier la structure de la base de données (`schema.prisma`), tu dois impérativement respecter les règles suivantes pour garantir la stabilité de l'application et la sécurité des données.

## 1. Ne jamais modifier les tables en direct
Toutes les modifications de schéma doivent passer par le fichier `prisma/schema.prisma`. 

## 2. Commandes de Migration
Après avoir modifié `schema.prisma`, tu dois exécuter les commandes suivantes (via le terminal) :

```bash
# 1. Générer et appliquer la migration en local/développement
npx prisma migrate dev --name <nom_descriptif>

# 2. Re-générer le client Prisma (si nécessaire)
npx prisma generate
```

## 3. Précautions de Production
Ne jamais faire de `prisma db push` sur un environnement de production. Le déploiement s'occupera d'appliquer la migration via `prisma migrate deploy` (configuré dans Coolify).

## 4. Relations et Suppressions
- Toujours penser à ajouter `onDelete: Cascade` sur les relations dépendantes (ex: `PropertyImage` dépend de `Property`).
- Vérifie toujours s'il faut mettre à jour le `db-explorer` (voir la compétence correspondante) après un changement de modèle.
