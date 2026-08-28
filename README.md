# Dental Lab Leaderboard

Internal production performance and recognition tracking for the lab. 1 unit of production = 1 tooth.

## Stack

Next.js (App Router, TypeScript) · Prisma + SQLite · Vitest · Tailwind CSS.

## Getting started

```bash
npm install
npm run db:migrate   # applies the schema to prisma/dev.db
npm run db:seed      # seeds the 6 initial departments (Design, Build Up, Model, Finishing, QC, Dispatch)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first visit to `/admin` will prompt you to create the
one Admin account — everyone else uses the app view-only, with no login.

## Scripts

- `npm run dev` / `npm run build` / `npm run start` — Next.js app
- `npm test` — runs the scoring engine test suite (Vitest)
- `npm run db:migrate` — apply Prisma migrations
- `npm run db:seed` — re-seed the initial departments (safe to re-run, upserts by slug)
- `npm run db:studio` — browse the SQLite database with Prisma Studio

## Architecture

Business logic lives in `src/lib/scoring/` as plain, database-free TypeScript functions — this is what's under
test. Reads go through `src/lib/queries.ts`, writes go through `src/lib/actions/*.ts` (Next.js Server Actions),
and both call into `src/lib/scoring/` rather than recomputing anything inline. See `prisma/schema.prisma` for the
data model — every score-changing event is one row in the append-only `ScoreTransaction` ledger.
