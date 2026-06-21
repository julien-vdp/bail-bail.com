# Codex Notes

## Project

- Local working folder: `C:\Users\nabnu\Desktop\bail-bail.com`
- GitHub repo: `julien-vdp/bail-bail.com`
- Deployment: Coolify redeploys from GitHub pushes.
- Database: PostgreSQL hosted on the OVH/Coolify server and configured through Coolify/env vars.
- The local `.env` exists on the Desktop copy and contains sensitive values. Do not print or commit it.

## Workflow

- Codex can edit project files, but this environment currently cannot write inside `.git`.
- Because of that, Codex prepares changes and the user runs commit/push manually in PowerShell:

```powershell
cd "C:\Users\nabnu\Desktop\bail-bail.com"
git add <files>
git commit -m "<message>"
git push origin main
```

- After `git push origin main`, Coolify should start a deployment automatically.

## Intentional Project Choices

- The owner/candidate double-account behavior is intentional for testing. Do not remove it without explicit request.
- The DB Explorer is useful for now. Do not remove it yet, but it should be secured or removed later before serious production use.

## Recent Work

- Fixed `.gitignore` so `private_uploads/` is ignored correctly.
- Fixed candidate document access by allowing document authorization via candidate email as well as candidate id.
- Hardened server-side authorization across key actions:
  - owner property create/update/archive;
  - admin application status updates;
  - admin visit confirmation;
  - admin document validation/rejection;
  - candidate document upload/delete/approval;
  - candidate dossier submission and conditions acceptance;
  - direct `/dossier/[applicationId]` access;
  - `/api/seed`, `/api/seed-slots`, `/api/test-email`.
- Fixed home page header stacking so `Mon Espace` remains clickable.
- `npx.cmd tsc --noEmit --pretty false` passed after the security changes.

## Security Notes Still Relevant

- `JWT_SECRET` has a fallback hard-coded value in `src/lib/auth.ts`; make it mandatory in production.
- DB Explorer password is hard-coded in `src/actions/db-explorer.ts`; move it to env or remove the route later.
- `next.config.ts` currently ignores TypeScript and ESLint build failures; clean up gradually and re-enable.
- Confirm Coolify has persistent storage for uploaded documents if uploads need to survive rebuilds.
- Keep `ENCRYPTION_KEY` only in environment variables and backed up securely; changing it makes old encrypted documents unreadable.

## Useful Checks

```powershell
cd "C:\Users\nabnu\Desktop\bail-bail.com"
npx.cmd tsc --noEmit --pretty false
git status --short --branch
```
