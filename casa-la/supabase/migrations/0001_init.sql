-- Casa LA — initial schema
-- Applies the data model from the implementation plan (section 3) with row-level
-- security matched to the roles/invitations model in section 6.

create extension if not exists "pgcrypto";

-- ---------- users ----------
-- id mirrors auth.users(id): one row is created automatically on signup by the
-- handle_new_user() trigger below (standard Supabase pattern for magic-link auth).
create table public.users (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text unique not null,
  name          text,
  role          text not null default 'guest' check (role in ('guest', 'host')),
  created_at    timestamptz not null default now()
);

-- ---------- applications ----------
create table public.applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  name          text not null,
  email         text not null,
  arrival       date not null,
  departure     date not null,
  people        int not null default 1 check (people >= 1),
  status        text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected', 'cancelled')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint departure_after_arrival check (departure >= arrival)
);

create index applications_status_idx on public.applications (status);
create index applications_arrival_idx on public.applications (arrival);
create index applications_user_id_idx on public.applications (user_id);

-- ---------- application_guests ----------
-- the party invited to a single application/request
create table public.application_guests (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications (id) on delete cascade,
  name            text,
  email           text
);

create index application_guests_application_id_idx on public.application_guests (application_id);

-- ---------- blocks ----------
-- host-blocked periods; guests can't request dates inside these
create table public.blocks (
  id            uuid primary key default gen_random_uuid(),
  start_date    date not null,
  end_date      date not null,
  reason        text,
  created_at    timestamptz not null default now(),
  constraint block_end_after_start check (end_date >= start_date)
);

-- ---------- email_log ----------
-- mirror of every notification sent, for the in-app "Mail" inbox / audit trail
create table public.email_log (
  id            uuid primary key default gen_random_uuid(),
  to_email      text not null,
  kind          text not null check (kind in ('request', 'approved', 'rejected')),
  subject       text not null,
  body          text not null,
  sent_at       timestamptz not null default now()
);

create index email_log_sent_at_idx on public.email_log (sent_at desc);

-- ---------- updated_at maintenance ----------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger applications_set_updated_at
  before update on public.applications
  for each row
  execute function public.set_updated_at();

-- ---------- auth.users -> public.users provisioning ----------
-- Fires when someone completes a magic-link signup (see README "Auth & invitations").
-- The very first host account should have its role flipped to 'host' manually
-- after seeding (see README).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------- helper: is the caller the host? ----------
create function public.is_host()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'host'
  );
$$;

-- ---------- row-level security ----------
alter table public.users enable row level security;
alter table public.applications enable row level security;
alter table public.application_guests enable row level security;
alter table public.blocks enable row level security;
alter table public.email_log enable row level security;

-- users: see your own row, or every row if you're the host
create policy users_select on public.users
  for select using (id = auth.uid() or public.is_host());
create policy users_update_self on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

-- applications: owners see their own requests; the host sees everything;
-- everyone else can see approved trips only (dates/headcount, for the shared
-- calendar) — pending/draft/rejected requests stay private to the owner + host.
create policy applications_select on public.applications
  for select using (
    user_id = auth.uid() or public.is_host() or status = 'approved'
  );
create policy applications_insert on public.applications
  for insert with check (user_id = auth.uid() or public.is_host());
-- Guests may edit their own request while it's still theirs to change, and can
-- cancel it even once approved — but only the host can move it into/out of
-- 'approved'/'rejected' (that happens via the service-role approve/reject API).
create policy applications_update on public.applications
  for update using (
    (user_id = auth.uid() and status in ('draft', 'pending', 'rejected', 'approved'))
    or public.is_host()
  ) with check (
    public.is_host()
    or (user_id = auth.uid() and status in ('draft', 'pending', 'cancelled'))
  );

-- application_guests: visible/editable wherever the parent application is
create policy application_guests_select on public.application_guests
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (a.user_id = auth.uid() or public.is_host() or a.status = 'approved')
    )
  );
create policy application_guests_write on public.application_guests
  for all using (
    exists (
      select 1 from public.applications a
      where a.id = application_id and (a.user_id = auth.uid() or public.is_host())
    )
  ) with check (
    exists (
      select 1 from public.applications a
      where a.id = application_id and (a.user_id = auth.uid() or public.is_host())
    )
  );

-- blocks: visible to any signed-in guest (needed to render the calendar);
-- only the host can create/edit/remove them
create policy blocks_select on public.blocks
  for select using (auth.uid() is not null);
create policy blocks_write on public.blocks
  for all using (public.is_host()) with check (public.is_host());

-- email_log: host-only; rows are written by server functions using the
-- service-role key, which bypasses RLS entirely
create policy email_log_select on public.email_log
  for select using (public.is_host());
