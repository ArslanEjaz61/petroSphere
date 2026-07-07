## Diagnosis
The seed data is in the database (57 companies, 35 deals, 164 documents, 67 market prices, 34 news, 86 contacts). The client requests come back as `[]` because the browser's Supabase client is sending the anonymous key — not a user JWT — so RLS filters out every owned row.

Two things to fix so the seeded data actually renders in the UI:

## 1. Broaden the demo SELECT policies (auth‑gated, no anon)
Add an "any signed‑in user can read" SELECT policy on the demo tables so the seeded rows show up for whoever is signed in, without weakening writes and without exposing anything to anonymous visitors.

Tables getting an added `TO authenticated USING (true)` SELECT policy:
- `companies`
- `contacts`
- `deals`
- `documents`
- `tasks`
- `activities`

INSERT / UPDATE / DELETE policies stay owner‑scoped exactly as they are today — writes are unchanged. `profiles` stays as‑is (already scoped to self + admin). `market_prices`, `market_news`, `products`, `countries`, `ports`, `currencies` already have permissive SELECT policies.

## 2. Confirm the session on the client
The dashboard page is under the `_authenticated` gate, so if you're seeing `/dashboard` you technically have a session, but the outgoing requests are using the anon key (localStorage snapshot is empty). If the UI still looks empty after policy 1, the answer is a fresh sign‑in through the app's `/auth` page — the browser client will then attach the user JWT and every read returns rows.

## Out of scope
- No schema changes.
- No new tables, functions, or triggers.
- No changes to insert/update/delete policies — writes remain owner‑scoped.
- No anon read policies — anonymous visitors still see nothing.
- No source code changes.

## Files touched
- One migration adding the SELECT policies listed above. No app code files.