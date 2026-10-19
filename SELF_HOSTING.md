# Running SpaceCraft AI outside Lovable (VS Code + your own backend)

This guide takes the app from Lovable to your own machine with your own
Supabase project and your own OpenAI key.

## 1. Get the code

1. In Lovable, connect the project to GitHub (project Settings → GitHub →
   Connect). Lovable pushes the full source to a repo you own.
2. In VS Code: `git clone <your-repo-url>` and open the folder.
3. Install dependencies: `npm install` (or `bun install`).

## 2. Create your own Supabase project

1. Go to https://supabase.com → New project (free tier is fine).
2. From Project Settings → API, copy:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **anon / publishable key**

## 3. Create the database tables

In your Supabase dashboard → SQL Editor, run:

```sql
-- Climate-aware interior suggestions
create table public.climate_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  city text not null,
  room_type text not null,
  area_sqm numeric not null,
  style text not null,
  weather jsonb not null default '{}',
  result jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.climate_suggestions enable row level security;

create policy "own rows only" on public.climate_suggestions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, delete on public.climate_suggestions to authenticated;

-- Construction AI analyses
create table public.construction_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null,
  title text not null,
  input jsonb not null default '{}',
  result jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.construction_analyses enable row level security;

create policy "own rows only" on public.construction_analyses
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, delete on public.construction_analyses to authenticated;
```

## 4. Configure authentication

In your Supabase dashboard → Authentication:

1. **Email**: enable the Email provider (on by default). If you want instant
   sign-in during development, turn off "Confirm email" — otherwise users must
   click the confirmation link first.
2. **Google**: Authentication → Providers → Google → Enable. You need a Google
   Cloud OAuth client:
   - Google Cloud Console → APIs & Services → Credentials → Create OAuth client
     ID (Web application).
   - Authorized redirect URI: copy the callback URL shown in the Supabase
     Google provider panel (looks like
     `https://<your-project>.supabase.co/auth/v1/callback`).
   - Paste the Client ID and Client Secret into Supabase and save.
   - In Authentication → URL Configuration, set Site URL to
     `http://localhost:8080` while developing (change to your domain later).

## 5. Set environment variables

Create a `.env` file in the project root (it is git-ignored — never commit
keys):

```bash
# Your Supabase project
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your anon/publishable key>
VITE_SUPABASE_PROJECT_ID=<your-project-ref>
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your anon/publishable key>
SUPABASE_PROJECT_ID=<your-project-ref>

# AI — used when LOVABLE_API_KEY is absent (i.e. outside Lovable)
OPENAI_API_KEY=sk-...
```

Get an OpenAI key at https://platform.openai.com/api-keys. The app uses the
Responses API with `gpt-4o` (vision + structured output) when self-hosted.

## 6. One small code note

`src/integrations/supabase/` files are generated for Lovable but work
standalone because they read the env vars above. If `previewAuthStorage.ts`
causes issues outside Lovable, replace the `storage:` option in
`client.ts` with the default (remove the `storage` line) so sessions use
plain `localStorage`.

## 7. Run it

```bash
npm run dev
```

Open http://localhost:8080, sign up, and try Construction AI and the Climate
Advisor. Weather data comes from Open-Meteo (free, no key needed).

## What does NOT transfer

- **Existing data**: accounts and saved analyses in the Lovable-hosted backend
  stay there. Your new Supabase project starts empty.
- **Lovable AI credits**: outside Lovable the app uses your OpenAI key and
  bills to your OpenAI account.
- **Deployment**: `npm run build` produces the production build. The app is a
  TanStack Start app and can be deployed to Cloudflare Workers, Vercel, or
  Node hosts — see the TanStack Start deployment docs for your target.
