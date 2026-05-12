---
name: DB Explorer Maintenance
description: Procédure de mise à jour du panneau d'administration "DB Explorer" lors de l'ajout de nouvelles tables.
---

# 🔍 Maintenir le DB Explorer

Le projet contient un explorateur de base de données visuel accessible sur `/db-explorer`. 
Dès que tu ajoutes un nouveau modèle (table) dans `schema.prisma` qui mérite d'être consulté par l'administrateur, tu dois mettre à jour ce système.

## 1. Mettre à jour l'action côté serveur
Dans le fichier `src/actions/db-explorer.ts` :
1. Ajoute le modèle dans le mappage `getPrismaModel` :
   ```typescript
   const models = { ..., monNouveauModele: prisma.monNouveauModele }
   ```
2. Dans `getTableData()`, définis les clés étrangères (relations) pour l'affichage visuel :
   ```typescript
   if (modelName === "monNouveauModele") {
     include = { targetRelation: { select: { id: true, name: true } } };
   }
   ```
   *Note: On inclut toujours l'ID pour que la navigation cliquable fonctionne.*

## 2. Mettre à jour le Frontend
Dans le fichier `src/app/db-explorer/Dashboard.tsx` :
1. Ajoute l'entrée dans la constante `TABLES` avec une icône de `lucide-react` cohérente.
2. Si ton modèle possède un rendu très spécifique, tu peux ajuster la fonction `renderCell()` pour l'affichage des badges relationnels.

## 3. Métriques
N'oublie pas de vérifier si la fonction `getDatabaseMetrics()` dans `src/actions/db-explorer.ts` a besoin d'être mise à jour avec des statistiques concernant ce nouveau modèle (ex: `prisma.monModele.count()`).
