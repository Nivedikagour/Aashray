# Running Aashray AI outside Lovable (VS Code + your own backend)

This guide takes the app from Lovable to your own machine with your own
Supabase project and your own Gemini or OpenAI key.

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

## 4. Configure authentication & Resend Email Confirmations

In your Supabase dashboard → Authentication:

1. **Email Provider**:
   - Enable the Email provider.
   - Keep "Confirm email" enabled for production verification.

2. **Connecting Resend for Email Confirmations (Recommended)**:
   You have two complementary options:
   
   - **Option A: Native Supabase Custom SMTP with Resend**:
     In your Supabase Dashboard → **Project Settings** → **Authentication** → **SMTP Settings**:
     - **Enable Custom SMTP**: Toggle ON
     - **Sender Email**: `onboarding@resend.dev` (or your verified domain on Resend)
     - **Sender Name**: `Aashray AI`
     - **Host**: `smtp.resend.com`
     - **Port**: `465` (or `587`)
     - **Minimum TLS Version**: `1.2`
     - **Username**: `resend`
     - **Password**: `<YOUR_RESEND_API_KEY>` (starts with `re_...`)
     When enabled, Supabase routes all confirmation and reset emails securely through Resend.

   - **Option B: Application Direct Resend API**:
     Add `RESEND_API_KEY=re_...` in your `.env` file. The app's sign-up flow (`/auth`) will dispatch custom-branded, responsive verification and onboarding emails directly using the Resend REST API.

3. **Google OAuth**: Authentication → Providers → Google → Enable.
   - Authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`.
   - In Authentication → URL Configuration, set Site URL to `http://localhost:8080`.

## 5. Set environment variables

Create or update your `.env` file in the project root:

```bash
# Supabase project
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your anon/publishable key>
VITE_SUPABASE_PROJECT_ID=<your-project-ref>
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your anon/publishable key>
SUPABASE_PROJECT_ID=<your-project-ref>

# Resend API — used for email confirmations during sign up
# Get an API key at https://resend.com/api-keys
RESEND_API_KEY=re_123456789...
RESEND_FROM_EMAIL=Aashray <onboarding@resend.dev>

# Google Gemini API — used for interior designing, budget planning & recommendations, and construction AI
# Get a free API key at https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash

# Optional: Supabase Service Role Key (allows server to generate admin verification links)
# SUPABASE_SERVICE_ROLE_KEY=ey...

# Optional: OpenAI API Key (used as fallback if GEMINI_API_KEY is not set)
# OPENAI_API_KEY=sk-...
```

### Why Gemini?
The app uses Gemini 2.5 Flash / 1.5 Flash via Google's Generative AI API:
- Fast, high-intelligence structured JSON outputs
- Multimodal site photos & crack analysis
- Climate-aware interior design suggestions
- Phase-wise Indian rupee budget planning and cost-saving recommendations

## 6. One small code note

`src/integrations/supabase/` files read the environment variables automatically. If `previewAuthStorage.ts` causes issues outside Lovable, sessions will automatically fall back to standard `localStorage`.

## 7. Run it

```bash
npm run dev
```

Open `http://localhost:8080`, test the sign up with Resend email confirmation, try the **AI Budget Planner & Design Studio**, and test **Construction AI**. Weather data comes from Open-Meteo (free, no key needed).

## What does NOT transfer

- **Existing data**: accounts and saved analyses in the Lovable-hosted backend stay there. Your new Supabase project starts fresh.
- **AI credits**: outside Lovable the app uses your `GEMINI_API_KEY` (with Google's generous free tier) or your OpenAI key.
- **Deployment**: `npm run build` produces the production build. The app is a TanStack Start app and can be deployed to Cloudflare Workers, Vercel, or Node hosts.

