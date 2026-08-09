# Casa LA

Scheduling family & friends' visits to Casa LA. One host manages availability;
invited guests request date ranges; everyone gets notified by email.

This is a faithful port of the `Casa LA.dc.html` prototype into a real Next.js
app, built in two layers:

1. **The UI you can run right now** — every screen and interaction from the
   prototype (guest calendar, host overview/requests/blocks, apply/block/inbox
   modals, toasts) rebuilt as React components in `src/components/casa/`, with
   the same domain logic ported to plain TypeScript in `src/lib/casa-logic.ts`.
   It persists to `localStorage` (see `src/lib/store.ts`) so it runs with zero
   configuration — no database, no auth, no API keys.
2. **The production backend** — a Postgres schema (`supabase/migrations/0001_init.sql`)
   and a full set of API routes (`src/app/api/**`) implementing the endpoints
   from the original plan, ready to be wired in as the app's real data layer.

## Running it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use the Guest/Host pill in the header to switch
roles — the app seeds itself with a few sample requests and one blocked
period on first load. All state lives in your browser's `localStorage` under
`casa_la_v1`; clear it (or open dev tools → Application → Local Storage) to
reset to the seed data.

Query params let you preview it as a different host without editing code:

- `?role=host` — start on the Host tab
- `?host=Nadia` — change the host's first name (used in email copy)
- `?accent=%234E7A52` — change the accent color (URL-encode the `#`)

## Project layout

```
src/lib/casa-logic.ts     Pure domain logic: dates, availability, validation,
                           status metadata, email copy, calendar grid builder.
                           No React, no I/O — reused by both the local UI and
                           the API routes so the rules can't drift apart.
src/lib/store.ts          localStorage read/write for local/dev mode.
src/lib/types.ts          Shared TypeScript types.
src/components/casa/      All screens/modals, presentational only.
src/components/casa/CasaApp.tsx   The state container (mirrors the prototype's
                           Component class, using React hooks instead).

src/lib/supabase/         Browser + server Supabase clients (SSR-cookie bound,
                           plus a service-role client for privileged writes).
src/lib/db.ts             DB row <-> Application adapters, server-side
                           availability/overlap checks.
src/lib/email.ts          Resend sender + email_log mirroring.
src/lib/api-helpers.ts    Auth/role resolution shared by every API route.
src/app/api/**            REST endpoints — see "API surface" below.
supabase/migrations/      Postgres schema + row-level security policies.
```

## Going to production

The local UI and the backend are built, but not yet wired together — swapping
`CasaApp`'s `loadLocal`/`persist` calls (in `src/components/casa/CasaApp.tsx`)
for `fetch()` calls against the API routes below is the remaining integration
step, once you're ready to point this at a real Supabase project. That's a
deliberate seam: it means you always have a working, zero-config demo even
before infra exists.

### 1. Create a Supabase project

Run the migration in `supabase/migrations/0001_init.sql` (via the Supabase
SQL editor, or `supabase db push` with the Supabase CLI). It creates:

- `users`, `applications`, `application_guests`, `blocks`, `email_log`
- a trigger that provisions a `public.users` row on signup
- row-level security policies matching the roles model (guests see their own
  requests + approved trips; the host sees everything; blocks are read-only
  for guests)

After your own account signs up once (see auth below), promote it manually:

```sql
update public.users set role = 'host' where email = 'you@example.com';
```

### 2. Set environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only, never expose to the client
RESEND_API_KEY=<resend api key>
CASA_EMAIL_FROM="Casa LA <notifications@yourdomain.com>"
NEXT_PUBLIC_SITE_URL=https://your-deployed-domain.com
```

Without `RESEND_API_KEY` set, the API routes still work end-to-end but log a
warning and skip the actual send (useful for staging).

### 3. Auth

Magic-link, no passwords (see plan §6). The `users` table's `handle_new_user()`
trigger creates a profile row automatically on signup. This repo ships the
server/browser Supabase clients and the `/api/invites` endpoint (which sends
Supabase's built-in invite email via `auth.admin.inviteUserByEmail`); a login
page and `/auth/callback` route to complete the magic-link exchange still need
to be added — the standard `@supabase/ssr` Next.js App Router pattern applies
directly here.

### 4. API surface

All routes require a signed-in Supabase session (cookie-based); host-only
routes additionally check `public.users.role`.

| Method & path | Who | Purpose |
|---|---|---|
| `GET /api/availability?from&to` | anyone signed in | Sanitized blocks + approved/pending ranges (no PII) for the calendar |
| `GET /api/applications?status=` | host | All requests, optionally filtered by status |
| `GET /api/applications/mine` | guest | The signed-in guest's own requests |
| `POST /api/applications` | guest / host | Create a draft or submitted request; host can pass `hostAdd:true` for a pre-approved manual add |
| `PATCH /api/applications/:id` | owner (pre-approval) / host | Edit dates, people, party |
| `POST /api/applications/:id/submit` | owner | draft → pending (fires host email) |
| `POST /api/applications/:id/cancel` | owner / host | → cancelled |
| `POST /api/applications/:id/approve` | host | → approved (fires guest email; re-validates availability) |
| `POST /api/applications/:id/reject` | host | → rejected (fires guest email) |
| `GET /api/blocks` | anyone signed in | List blocked periods |
| `POST /api/blocks` | host | Add a blocked period |
| `DELETE /api/blocks/:id` | host | Remove a blocked period |
| `POST /api/invites` | anyone signed in | Send a magic-link invite to an email |

Availability is always re-validated server-side on submit/approve — the
calendar can go stale between a guest's selection and the host's approval, so
the client's view is never trusted for the final check (`src/lib/db.ts`,
`isRangeOpenDb`).

## Testing

```bash
npm run lint
npx tsc --noEmit
npm test        # if vitest is configured — see src/lib/casa-logic.test.ts
```
