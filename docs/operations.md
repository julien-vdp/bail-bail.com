# Exploitation et sécurité

## Variables d'environnement

Copiez `.env.example` vers `.env` pour le développement local, sans jamais versionner ce fichier. En production, renseignez les mêmes variables dans Coolify.

- `DATABASE_URL` : connexion PostgreSQL.
- `JWT_SECRET` : secret long et aléatoire requis pour signer les sessions.
- `ENCRYPTION_KEY` : clé hexadécimale de 64 caractères pour chiffrer les documents. Sa rotation rend les anciens fichiers illisibles si elle n'est pas accompagnée d'une procédure de migration.
- `DB_EXPLORER_PASSWORD` : mot de passe distinct et long pour l'outil d'administration.
- `PRIVATE_UPLOADS_DIR` : emplacement persistant hors de la racine web pour les documents chiffrés.

## Documents candidats

Les documents candidats ne doivent être ni dans `public/`, ni versionnés. Le répertoire `private_uploads/` (ou `PRIVATE_UPLOADS_DIR`) doit être fourni par un volume persistant en production. Un retrait de Git ne purge pas les commits passés : toute réécriture d'historique doit être planifiée, sauvegardée et coordonnée avec les clones et le déploiement.

## Migrations Prisma

Les futures évolutions de `prisma/schema.prisma` doivent être créées avec une migration versionnée :

```powershell
npx.cmd prisma migrate dev --name description_du_changement
```

Pour une base de production déjà existante, ne lancez pas une migration initiale de création de tables. Sauvegardez la base, comparez son schéma à `prisma/schema.prisma`, créez une migration de référence adaptée, puis marquez-la appliquée avec `prisma migrate resolve --applied <migration>` avant d'utiliser `prisma migrate deploy`.

## Vérifications

```powershell
npm run lint
npx.cmd tsc --noEmit --pretty false
npm run build
```

Next.js 16 ne lance plus ESLint au build ; l'exécution de `npm run lint` doit donc rester une étape explicite de CI. Un push GitHub ne prouve pas à lui seul que Coolify a terminé le déploiement.
