# Forbetra

Real-time 360 coaching platform. Combines structured weekly self-reflection with continuous stakeholder feedback, AI-synthesized insights, and coach-facing intelligence.

**Live:** https://app.forbetra.com
**Repo:** https://github.com/k1bu/FORBETRA (Kieran's GitHub)

## Quick Start

```bash
npm install
# Copy .env.example to .env and fill in values
npx prisma migrate dev     # Apply migrations
npm run seed:comprehensive  # Seed test data
npm run dev                 # http://localhost:5173
```

## Stack

- **Frontend:** SvelteKit 2.47, Svelte 5.41, Tailwind CSS 4.1
- **Backend:** Node.js 22, TypeScript (strict mode)
- **ORM:** Prisma 6.19 → PostgreSQL (Neon)
- **Auth:** Clerk (email/SSO) via svelte-clerk
- **Email:** SendGrid (primary), Postmark (fallback)
- **SMS:** Twilio (A2P 10DLC) — campaign currently rejected, see docs/session-prep-feb27.md
- **AI:** Anthropic Claude API
- **Charts:** Chart.js
- **Webhooks:** Svix (Clerk webhook verification)
- **Deploy:** Vercel (adapter-vercel, Node 22.x runtime)

## Project Structure

```
src/
├── lib/
│   ├── components/     # Svelte components
│   ├── notifications/  # Email + SMS (providers/, templates)
│   ├── prompts/        # AI prompt templates
│   ├── server/         # Server-only utilities (auth, db)
│   ├── stores/         # Svelte stores
│   ├── utils/          # Shared utilities
│   └── validation/     # Zod schemas
├── jobs/               # Cron job logic (remind, insights, etc.)
├── routes/
│   ├── admin/          # Admin dashboard + settings
│   ├── api/            # API endpoints (jobs, debug, webhooks)
│   ├── coach/          # Coach dashboard, invitations, session view
│   ├── individual/     # Individual hub, dashboard, insights, stakeholders
│   ├── onboarding/     # 5-step onboarding wizard
│   ├── stakeholder/    # Stakeholder feedback submission
│   ├── settings/       # Legacy settings (being replaced by role-specific)
│   └── ...             # sign-in, sign-up, privacy, terms, prompts
prisma/
├── schema.prisma       # Data model
├── prisma.config.ts    # Prisma config
└── migrations/         # Migration history
docs/
├── roadmap.md          # Tier 1-4 feature roadmap
├── expert-panel-review.md  # 5-person UX/product audit
├── expert-panel-ux-redesign.md
├── expert-panel-growth-strategy.md
├── ux-evaluation-framework.md  # Systematic UX scoring (10 dims, 8 personas, 16 scenarios)
├── ux-baseline-assessment.md   # Baseline scores (Platform: 6.87) + 34 issues + prioritized fix list
└── session-prep-feb27.md   # Collaboration prep with Kieran
```

## User Roles

- **Individual** — Client receiving coaching. Reflects weekly, views insights, manages stakeholders.
- **Coach** — Facilitates cycles, reviews AI insights, prepares for sessions.
- **Stakeholder** — Provides 360 feedback on an individual (via tokenized link).
- **Admin** — Platform operations, user management, preview/impersonation.

## Key Commands

```bash
npm run dev              # Dev server
npm run build            # Production build (runs prisma generate + vite build)
npm run lint             # Prettier check + ESLint
npm run format           # Prettier write
npm run check            # Svelte type checking
npx prisma migrate dev   # Create/apply migrations
npx prisma studio        # Visual DB browser
npm run seed:comprehensive   # Full seed data
npm run seed:test-data       # Minimal test data
npm run seed:clean           # Remove seed data
```

## Cron Jobs (Vercel)

Defined in `vercel.json`, authenticated via `CRON_SECRET` = `JOB_SECRET_TOKEN`:

| Job                            | Schedule          | Route                        |
| ------------------------------ | ----------------- | ---------------------------- |
| Base reminders                 | Mon-Fri 9am       | /api/jobs/remind-base        |
| Overdue reminders              | Mon-Fri 2pm       | /api/jobs/remind-prompts     |
| Stakeholder feedback reminders | Mon-Fri 3pm       | /api/jobs/remind-feedback    |
| AI insight generation          | Sun 8pm           | /api/jobs/generate-insights  |
| Coach prep                     | Mon 7am           | /api/jobs/coach-prep         |
| Cycle completion               | Daily 1am         | /api/jobs/complete-cycles    |
| Stakeholder impact summaries   | 1st of month 10am | /api/jobs/stakeholder-impact |

## Deployment

- Vercel project: `winning-mind-ai/forbetra`
- Auto-deploys from `main` branch pushes
- Env vars: Set via `vercel env add` — **always use `printf '%s' 'value' | vercel env add NAME env`** (never `echo`, it adds trailing newlines)
- Redeploy manually: `npx vercel deploy --prod`

## Current Status (Feb 27, 2026)

- **Tier 1 (Ship-Blocking):** Complete
- **Tier 2 (Competitive Differentiation):** In progress
- **Email:** Working via SendGrid
- **SMS:** Twilio API connected but A2P 10DLC campaign rejected — carriers blocking delivery
- **AI:** Anthropic key configured, insights/coach-prep/chat functional
- **Uncommitted WIP:** Role-specific settings pages, ObjectiveChange model, notification preferences, custom cadence
