# Casa LA — Implementation Plan

A micro-app for scheduling family & friends' visits to your place in LA. One admin (you, the **Host**) manages availability; **Guests** you invite request date ranges, and everyone is notified by email. The prototype (`Casa LA.dc.html`) is the source of truth for UX, copy, and visual style.

---

## 1. Scope (MVP)

- **Host (admin):** see who's arriving/departing + headcount, approve/decline requests, block date ranges, manually add a visit.
- **Guest:** browse a calendar of what's free/booked/blocked, request a date range (arrival → departure), invite others to their party by email, track their requests, edit until approved.
- **Booking unit:** individual days — an arrival date and a departure date.
- **Capacity:** one visit per period; first approved wins. Overlapping requests for an already-approved range are rejected at validation time.
- **Comms:** all coordination happens in-app; **email is the notification channel** (host on new request, guest on approve/decline).
- **Statuses:** `draft → pending → approved / rejected → cancelled`.
- **Primary device:** mobile-first for everyone (the prototype is a 440px column; scale up gracefully on desktop).

Out of scope for MVP: payments, multiple properties, multiple hosts, in-app chat, per-period max capacity, availability pricing.

---

## 2. Architecture

Recommended stack (adjust to your comfort):

- **Frontend:** the prototype is already a self-contained component. For production either (a) port the markup/logic into React/Next.js components, or (b) keep it as a static SPA and add a thin API. Keep the inline visual language (see §7).
- **Backend:** any of Supabase / Firebase / a small Node (Express or Next API routes) + Postgres. Supabase is the fastest path — it gives you Postgres, row-level auth, and edge functions for email in one place.
- **Email:** transactional provider — Resend, Postmark, or SendGrid. Triggered from server-side functions only (never the client, to protect API keys).
- **Auth:** magic-link / passwordless email login (no passwords to manage for family). See §6.

```
[ Mobile web client ]  ──HTTPS──►  [ API / Edge functions ]  ──►  [ Postgres ]
                                          │
                                          └──►  [ Email provider ]  ──►  inbox
```

---

## 3. Data model

```sql
-- Guests you've invited (one-time registration via invite link)
users (
  id            uuid pk,
  email         text unique not null,
  name          text,
  role          text not null default 'guest',   -- 'guest' | 'host'
  created_at    timestamptz default now()
)

applications (
  id            uuid pk,
  user_id       uuid fk -> users.id,             -- the lead applicant
  name          text not null,
  email         text not null,
  arrival       date not null,
  departure     date not null,                   -- >= arrival
  people        int  not null default 1,
  status        text not null default 'draft',   -- draft|pending|approved|rejected|cancelled
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
)

application_guests (                             -- the party invited to a request
  id            uuid pk,
  application_id uuid fk -> applications.id on delete cascade,
  name          text,
  email         text
)

blocks (                                         -- host-blocked periods
  id            uuid pk,
  start_date    date not null,
  end_date      date not null,                   -- inclusive
  reason        text,
  created_at    timestamptz default now()
)

email_log (                                      -- optional: mirror of what was sent
  id            uuid pk,
  to_email      text,
  kind          text,                            -- 'request'|'approved'|'rejected'
  subject       text,
  body          text,
  sent_at       timestamptz default now()
)
```

**Availability rule (a date is unavailable if):** it falls inside any `block`, OR inside any `approved` application's range. Pending applications do **not** block others (first approved wins).

---

## 4. API surface

| Method & path | Who | Purpose |
|---|---|---|
| `GET /availability?from&to` | guest, host | Blocks + approved ranges for the calendar |
| `POST /applications` | guest | Create draft or submit (pending) |
| `PATCH /applications/:id` | owner (pre-approval) | Edit dates/people/party |
| `POST /applications/:id/submit` | owner | draft → pending (fires host email) |
| `POST /applications/:id/cancel` | owner | → cancelled |
| `GET /applications/mine` | guest | Guest's own list |
| `GET /applications` | host | All, filterable by status |
| `POST /applications/:id/approve` | host | → approved (fires guest email) |
| `POST /applications/:id/reject` | host | → rejected (fires guest email) |
| `POST /applications` (host) | host | Manual add → approved directly, no email |
| `GET/POST/DELETE /blocks` | host | Manage blocked periods |
| `POST /invites` | guest, host | Send an invite link to an email |

**Server-side validation on submit/approve:** re-check the range is fully open (no block, no other approved app overlaps) — never trust the client. Reject with a clear message if it closed since selection.

---

## 5. Email notifications

Fire from server functions, log to `email_log`. Copy is already drafted in the prototype (`makeEmail` in the logic class) — reuse it.

- **New request** → to **host**. Subject: "New visit request — {name}". Body: dates, headcount, applicant email, party.
- **Approved** → to **applicant**. Subject: "Your stay in Los Angeles is confirmed". Body: arrival, departure, headcount, warm sign-off.
- **Declined** → to **applicant**. Subject: "Update on your visit request". Body: invite to pick another period.
- **Invite** → to invited email. Subject: "You're invited to stay in LA". Body: one-time registration/magic link.

Use a shared template shell (header band in the accent color, plain-text body) so all four look consistent.

---

## 6. Auth & invitations

- **One-time registration by invite:** Host creates a guest by email (or a guest invites others). System emails a **magic link**; clicking it creates/authenticates the `users` row and drops a session. No passwords.
- **Roles:** `host` role is assigned to your own account manually (seed it). Everyone else is `guest`.
- **Party invites:** a guest adds names+emails to their application (`application_guests`). Optionally send each invitee an FYI email; they do **not** need their own account for MVP.
- **Row-level security:** guests read only their own applications + public availability; host reads everything.

---

## 7. Visual system (from the prototype — keep it)

- **Fonts:** `Instrument Serif` (display / headings / numbers), `Hanken Grotesk` (UI / body).
- **Palette:** ivory bg `#F6F2EA`, card `#FFFDF8`, hairline `#EBE3D5`, ink `#23211C`, muted `#8A8271`. Accent (clay) `#B85C38`, deep `#93472A`.
- **Status colors:** pending `#8A5A16` / `#F6E8CE`, approved `#2F5A3A` / `#DCEBDD`, declined `#8A3529` / `#F3DAD5`, draft/cancelled `#6B6459` / `#ECE7DD`.
- **Calendar dots:** booked = green `#4E7A52`, pending = amber `#C98A2B`, blocked = hatched grey.
- **Chrome:** 440px mobile column, rounded 12–22px, sheet modals slide up from the bottom, toast pill for confirmations.

Accent is themeable — the prototype exposes it as a tweak; keep it a single token in production.

---

## 8. Screen inventory (maps 1:1 to the prototype)

**Guest**
1. Calendar — month nav, availability, tap-to-select arrival→departure, selection bar → request.
2. Request sheet — name, email, arrival, departure, headcount stepper, add party members, Save draft / Send request.
3. My trips — list with status badges; Edit (draft/pending/rejected) and Cancel (draft/pending/approved).

**Host**
4. Overview — here-now headcount, pending count, arriving-soon, departing-soon.
5. Requests — approve / decline pending; see all statuses.
6. Calendar — same grid; tap free dates to add a visit (auto-approved).
7. Blocked — list + add/remove blocked periods.

**Shared:** Mail inbox (in production this is just their real inbox; keep an in-app log optional), email preview.

---

## 9. Build order

- [ ] 1. Schema + auth (magic link) + seed your host account.
- [ ] 2. `GET /availability` + calendar rendering (read-only).
- [ ] 3. Guest request create/submit + validation + host email.
- [ ] 4. Host requests list + approve/reject + guest emails.
- [ ] 5. Blocks CRUD + host manual add.
- [ ] 6. My trips edit/cancel; party invites.
- [ ] 7. Polish: empty states, error toasts, timezone handling (store dates as plain `date`, no TZ math), responsive scale-up for desktop.

---

## 10. Notes & gotchas

- **Dates are calendar days, not timestamps** — store as `date`, compare as strings/`date`; avoid `Date` timezone drift (the prototype uses local-midnight ISO strings for this reason).
- **Inclusive ranges** everywhere (arrival and departure days both count).
- **Re-validate availability server-side** at submit and approve — the calendar can go stale between a guest selecting and the host approving.
- **First-approved-wins** means you may want to auto-notify or auto-reject other pending apps that overlap a newly approved range (nice-to-have, not MVP).
- The prototype persists to `localStorage` under `casa_la_v1`; that's throwaway — production state lives in the DB.
