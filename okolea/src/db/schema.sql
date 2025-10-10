create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text default 'organizer' check (role in ('visitor','donor','organizer','admin')),
  created_at timestamptz default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  title text not null,
  story text not null,
  target_amount_kes bigint not null check (target_amount_kes > 0),
  raised_amount_kes bigint not null default 0,
  payout_method text not null check (payout_method in ('mpesa','bank')),
  payout_destination text not null,
  scheduled_payout_date timestamptz not null,
  deadline timestamptz not null,
  privacy text not null default 'public' check (privacy in ('public','private')),
  contact_email text not null,
  contact_phone text not null,
  cover_photo_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','closed')),
  kyc_complete boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  donor_id uuid references public.profiles(id),
  donor_name text,
  donor_email text,
  donor_phone text,
  amount_kes bigint not null check (amount_kes > 0),
  method text not null check (method in ('mpesa','card_flutterwave','card_paystack')),
  is_anonymous boolean default false,
  cover_fees boolean default false,
  status text not null default 'pending' check (status in ('pending','confirmed','held','disbursed','refunded')),
  provider_ref text,
  receipt_url text,
  created_at timestamptz default now()
);

create table if not exists public.ledger (
  id bigserial primary key,
  donation_id uuid references public.donations(id) on delete cascade,
  event text not null,
  provider text not null,
  provider_event_id text,
  amount_kes bigint not null,
  created_at timestamptz default now()
);

create table if not exists public.disbursements (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  amount_kes bigint not null,
  status text not null default 'pending' check (status in ('pending','processing','success','failed')),
  method text not null,
  destination text not null,
  provider text,
  provider_ref text,
  attempt_count int default 0,
  last_attempt_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.webhook_events (
  id text primary key,
  provider text not null,
  received_at timestamptz default now()
);

create table if not exists public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  kind text not null,
  file_path text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.donations enable row level security;
alter table public.kyc_documents enable row level security;
alter table public.disbursements enable row level security;
alter table public.ledger enable row level security;
alter table public.webhook_events enable row level security;

create policy "select own profile" on public.profiles for select using (auth.uid() = id);
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);
create policy "admin profiles" on public.profiles for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "public read public campaigns" on public.campaigns for select using (privacy = 'public' or auth.jwt() is not null);
create policy "owner manage campaigns" on public.campaigns for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "admin manage campaigns" on public.campaigns for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "insert donations" on public.donations for insert with check (true);
create policy "select own or campaign owner" on public.donations for select using (donor_id = auth.uid() or exists (select 1 from public.campaigns c where c.id = campaign_id and c.owner_id = auth.uid()));
create policy "admin donations" on public.donations for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "owner manage kyc" on public.kyc_documents for all using (owner_id = auth.uid());
create policy "admin kyc" on public.kyc_documents for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "admin read disbursements" on public.disbursements for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admin read ledger" on public.ledger for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admin read webhooks" on public.webhook_events for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create or replace function public.increment_campaign_raised(cid uuid, delta bigint)
returns void language plpgsql as $$
begin
  update public.campaigns set raised_amount_kes = raised_amount_kes + delta where id = cid;
end $$;

