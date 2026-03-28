## IPL 2026 Fantasy Auction League

Phase 1 includes a modern `/teams` page with:
- auction teams
- player ownership mapping
- IPL franchise mapping + color theming
- search and filters

## Run Locally

```bash
npm run dev
```

Open [http://localhost:3000/teams](http://localhost:3000/teams).

## Supabase Setup

1. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. In Supabase SQL editor, run:
   - `supabase/schema.sql`
   - `supabase/seed.sql`

After this, the `/teams` page reads your real data from Supabase.

## Notes

- A fallback dataset from your screenshots is included for preview when Supabase env/data is unavailable.
- Some names may need spelling confirmation from you before final lock.
