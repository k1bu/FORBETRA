# Contributing to Forbetra

## Branch Strategy

- **`main`** is the production branch. It auto-deploys to Vercel.
- Create **feature branches** for all work: `feature/hub-redesign`, `fix/email-templates`, etc.
- Open a **pull request** to merge into `main`. Don't push directly to `main`.
- Use the PR template — it's there for a reason.

## Development Workflow

1. Pull latest `main` and branch off it
2. Make your changes
3. Pre-commit hooks run automatically (Prettier + ESLint on staged files)
4. Push your branch and open a PR
5. Get a review, then merge

## Prisma / Database

**Schema changes require coordination.** Two developers running `prisma migrate dev` independently will create conflicting migration files.

Rules:

- Announce schema changes before starting them
- Only one person should run `prisma migrate dev` at a time
- After creating a migration, commit it immediately so the other person can pull it
- If you pull someone else's migration, run `npx prisma migrate dev` to apply it locally

## Vercel Environment Variables

**Never use `echo` to pipe values into `vercel env add`.** It appends a trailing newline that corrupts the value.

```bash
# WRONG — adds trailing \n
echo "my-value" | vercel env add MY_VAR production

# CORRECT
printf '%s' 'my-value' | vercel env add MY_VAR production
```

When adding a new env var:

1. Add it to `.env.example` with a description
2. Add it to your local `.env`
3. Add it to Vercel using `printf` (see above)
4. Tell the other developer

## Commit Style

Keep commits descriptive. Examples from this repo:

- `Add SMS invite support across all areas`
- `Fix 5 ship-blocking issues: deduplicate utilities, fix token expiry, ...`
- `Harden security, fix email reliability, and improve validation`

## Code Style

- Prettier and ESLint are configured — pre-commit hooks handle formatting
- TypeScript strict mode is on
- Use Zod for validation at system boundaries
- Notifications go through `$lib/notifications/email.ts` and `sms.ts` — don't call providers directly
