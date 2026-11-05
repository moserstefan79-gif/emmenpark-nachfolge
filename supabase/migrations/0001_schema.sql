-- Emmenpark AG · Nachfolgeplattform «Nach mir das Wir!»
-- Schema v1 · Struktur folgt den vier Hebeln aus «Nachfolgefähig werden»

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- Enums
create type app_role as enum ('admin','vr','gl','eigentuemer');
create type dimension as enum ('fundament','verwaltungsrat','team','person');
create type milestone_status as enum ('geplant','in_arbeit','erledigt','gefaehrdet','zurueckgestellt');
create type meeting_kind as enum ('vr','klausur','steuerungsausschuss','gl','review','retro','gv','eignerdialog');
create type doc_category as enum ('protokoll','reglement','eignerstrategie','finanzen','vsop','pflichtenheft','akv','praesentation','sonstiges');
create type visibility as enum ('vr','gl','alle');
create type profilstufe as enum ('offen','kader','gl_ohne_beteiligung','gl_mit_beteiligung');
create type vsop_event_type as enum ('zuteilung','bewertung','rueckstellung','trigger','auszahlung','leaver','notiz');

-- ---------------------------------------------------------------- Mitglieder
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email text unique not null,
  full_name text not null,
  role app_role not null default 'gl',
  funktion text,            -- z.B. «Präsident (VRP) & CEO», «Mitglied · Sitzungsleitung»
  ressort text,             -- z.B. «Finanzen & Audit»
  gremium text,             -- 'VR' | 'GL' | 'VR+GL'
  active boolean not null default true,
  sort int default 100,
  created_at timestamptz default now()
);

-- Verknüpfung beim ersten Login: auth.users.email -> profiles.email
create or replace function public.link_profile_on_signup()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set user_id = new.id where lower(email) = lower(new.email) and user_id is null;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.link_profile_on_signup();

-- Rollen-Helfer (für RLS)
create or replace function public.my_role() returns app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid() and active limit 1
$$;
create or replace function public.my_profile_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles where user_id = auth.uid() limit 1
$$;
create or replace function public.is_vr() returns boolean
language sql stable as $$ select public.my_role() in ('admin','vr','eigentuemer') $$;
create or replace function public.is_admin() returns boolean
language sql stable as $$ select public.my_role() = 'admin' $$;
create or replace function public.is_member() returns boolean
language sql stable as $$ select public.my_role() is not null $$;

-- ---------------------------------------------------------------- Phasen & Meilensteine
create table phases (
  id uuid primary key default gen_random_uuid(),
  nr int not null,
  title text not null,
  subtitle text,
  dimension dimension,
  start_date date not null,
  end_date date not null,
  color text default '#1F3D32'
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid references phases(id) on delete set null,
  nr text,
  title text not null,
  description text,
  dimension dimension,
  owner_id uuid references profiles(id) on delete set null,
  owner_label text,           -- Freitext, wenn kein Profil (EXT Recht, GV, …)
  start_date date,
  due_date date not null,
  status milestone_status not null default 'geplant',
  visibility visibility not null default 'vr',
  source text,                -- 'Fahrplan D.x', 'Vorgehensplan 1.7', 'Zieltreppe'
  sort int default 100,
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------- Sitzungen, Traktanden, Protokolle
create table meetings (
  id uuid primary key default gen_random_uuid(),
  kind meeting_kind not null default 'vr',
  title text not null,
  date date not null,
  time_from time,
  location text,
  chair_id uuid references profiles(id),
  status text default 'geplant',   -- geplant | durchgefuehrt | abgesagt
  notes text,
  visibility visibility not null default 'vr'
);

create table agenda_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  nr int not null,
  title text not null,
  presenter_id uuid references profiles(id),
  duration_min int,
  kind text default 'information',   -- information | diskussion | beschluss
  decision text,
  follow_up text,
  follow_up_owner_id uuid references profiles(id),
  follow_up_due date,
  done boolean default false
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category doc_category not null default 'sonstiges',
  meeting_id uuid references meetings(id) on delete set null,
  storage_path text not null,
  file_name text,
  size_bytes bigint,
  visibility visibility not null default 'vr',
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------- Instrumente aus dem Buch
-- Zieltreppe: Zukunftsbild -> Zwischenstufen (Zustände) -> 3-Monats-Etappen
create table zieltreppen (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'unternehmen',   -- unternehmen | person
  owner_id uuid references profiles(id),
  title text not null,
  zukunftsbild text,
  horizon_years int default 5,
  visibility visibility not null default 'vr',
  updated_at timestamptz default now()
);
create table zieltreppe_stufen (
  id uuid primary key default gen_random_uuid(),
  zieltreppe_id uuid not null references zieltreppen(id) on delete cascade,
  nr int not null,
  zustand text not null,          -- beschreibt einen Zustand, kein To-do
  dimension dimension,
  target_date date,
  status milestone_status default 'geplant'
);
create table zieltreppe_etappen (
  id uuid primary key default gen_random_uuid(),
  stufe_id uuid not null references zieltreppe_stufen(id) on delete cascade,
  title text not null,
  quarter text,                   -- '2027-Q1'
  owner_id uuid references profiles(id),
  status milestone_status default 'geplant'
);

-- Team-Canvas (sechs Felder + Vereinbarungen)
create table team_canvas (
  id uuid primary key default gen_random_uuid(),
  team text not null,             -- 'VR' | 'GL'
  version_date date not null default current_date,
  auftrag text, ziele text, rollen text, spielregeln text, risiken text, beduerfnisse text,
  vereinbarungen jsonb default '[]'::jsonb,   -- [{text, owner, bis, status}]
  review_date date,
  visibility visibility not null default 'vr'
);

-- Nachfolgefähigkeits-Canvas (4 Dimensionen x 3 Fragen), pro Standortbestimmung
create table nf_canvas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  assessment_date date not null default current_date,
  owner_id uuid references profiles(id),
  typmuster text,                 -- «Alles läuft über mich», …
  visibility visibility not null default 'vr'
);
create table nf_canvas_fields (
  id uuid primary key default gen_random_uuid(),
  canvas_id uuid not null references nf_canvas(id) on delete cascade,
  dimension dimension not null,
  traegt text, blockiert text, bewegung text,
  score int check (score between 1 and 5),
  unique (canvas_id, dimension)
);

-- Review & Erfolgscheck (3 Fragen, quartalsweise)
create table reviews (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete set null,
  team text not null default 'VR',
  period text not null,           -- '2027-Q2'
  review_date date not null default current_date,
  gelungen text, abgekommen text, naechstes text,
  entscheide jsonb default '[]'::jsonb,       -- [{text, typ: fortfuehren|weglassen|neu, owner}]
  visibility visibility not null default 'vr'
);

-- Retrospektive (Check-in, Sammeln, Bündeln, Vertiefen, Experimente)
create table retrospectives (
  id uuid primary key default gen_random_uuid(),
  team text not null default 'GL',
  retro_date date not null default current_date,
  moderator_id uuid references profiles(id),
  arbeitsabkommen text,
  checkin jsonb default '[]'::jsonb,          -- [{name, wort}]
  gut text, schwierig text, themen text, vertiefung text,
  experimente jsonb default '[]'::jsonb,      -- [{text, bis, ergebnis}]
  visibility visibility not null default 'gl'
);

-- ---------------------------------------------------------------- GL-Bereich
create table gl_akv (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  role_title text not null,
  aufgaben text, kompetenzen text, verantwortung text,
  stellvertreter_id uuid references profiles(id),
  vertritt_id uuid references profiles(id),
  profilstufe profilstufe not null default 'offen',
  rollenwahl_datum date,
  uebernahme_vom_gf text,         -- Abschnitt «Übernahme vom Geschäftsführer»
  status text default 'entwurf',  -- entwurf | abgestimmt | unterzeichnet
  updated_at timestamptz default now()
);

create table delegation_mandates (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  bereich text not null,
  ziel text, budget text, entscheidungsspielraum text, reporting text,
  start_date date, review_date date,
  status text default 'entwurf',
  lessons text
);

-- ---------------------------------------------------------------- VSOP
create table vsop_settings (
  id int primary key default 1 check (id = 1),
  ebit_reference numeric not null default 350000,
  pool_pct numeric not null default 16,
  quota_default_pct numeric not null default 2,
  vesting_years int not null default 7,
  cliff_months int not null default 12,
  social_pct numeric not null default 8,
  payout_years int not null default 3,
  ebit_factor_min numeric default 0.8,
  ebit_factor_max numeric default 1.5,
  opting_in_start date default '2028-01-01',
  cap_note text
);
insert into vsop_settings (id) values (1);

create table vsop_scenarios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  multiple numeric not null,
  sort int default 1
);

create table vsop_participants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  quota_pct numeric not null default 2,
  profilstufe profilstufe not null default 'offen',
  allocation_date date,
  vesting_start date,
  leaver_status text default 'aktiv',   -- aktiv | good_leaver | bad_leaver
  note text
);

create table vsop_events (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references vsop_participants(id) on delete cascade,
  type vsop_event_type not null,
  event_date date not null default current_date,
  amount numeric,
  note text,
  created_by uuid references profiles(id)
);

-- ---------------------------------------------------------------- Cockpit & Risiken
create table kpi_snapshots (
  id uuid primary key default gen_random_uuid(),
  period text not null unique,           -- '2025-10' oder '2025'
  revenue numeric, gross_profit_1 numeric, personnel_cost numeric,
  ebitda numeric, ebit numeric, ebit_adjusted numeric, net_profit numeric,
  equity_ratio_pct numeric, liquidity numeric, debt numeric,
  db_gastronomie numeric, db_events numeric, db_catering numeric,
  delegation_quote_pct numeric, akv_coverage_pct numeric,
  top_risks text, note text,
  visibility visibility not null default 'vr'
);

create table risks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  early_indicators text,
  countermeasures text,
  owner_id uuid references profiles(id),
  level text default 'mittel',   -- tief | mittel | hoch
  status text default 'offen',
  dimension dimension,
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------- RLS
alter table profiles enable row level security;
alter table phases enable row level security;
alter table milestones enable row level security;
alter table meetings enable row level security;
alter table agenda_items enable row level security;
alter table documents enable row level security;
alter table zieltreppen enable row level security;
alter table zieltreppe_stufen enable row level security;
alter table zieltreppe_etappen enable row level security;
alter table team_canvas enable row level security;
alter table nf_canvas enable row level security;
alter table nf_canvas_fields enable row level security;
alter table reviews enable row level security;
alter table retrospectives enable row level security;
alter table gl_akv enable row level security;
alter table delegation_mandates enable row level security;
alter table vsop_settings enable row level security;
alter table vsop_scenarios enable row level security;
alter table vsop_participants enable row level security;
alter table vsop_events enable row level security;
alter table kpi_snapshots enable row level security;
alter table risks enable row level security;

-- Profile: alle Mitglieder sehen die Mitgliederliste; Admin verwaltet
create policy profiles_read on profiles for select using (is_member());
create policy profiles_admin on profiles for all using (is_admin()) with check (is_admin());
create policy profiles_self on profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Stammdaten: lesen alle Mitglieder, schreiben VR
create policy phases_read on phases for select using (is_member());
create policy phases_write on phases for all using (is_vr()) with check (is_vr());

-- Sichtbarkeitslogik: 'alle' -> jedes Mitglied, 'gl' -> GL+VR, 'vr' -> nur VR
create or replace function public.can_see(v visibility) returns boolean
language sql stable as $$
  select case v when 'alle' then public.is_member()
                when 'gl'   then public.is_member()
                when 'vr'   then public.is_vr() end
$$;

create policy milestones_read on milestones for select using (can_see(visibility));
create policy milestones_write on milestones for all using (is_vr()) with check (is_vr());
create policy milestones_owner_update on milestones for update using (owner_id = my_profile_id()) with check (owner_id = my_profile_id());

create policy meetings_read on meetings for select using (can_see(visibility));
create policy meetings_write on meetings for all using (is_vr()) with check (is_vr());
create policy agenda_read on agenda_items for select using (exists (select 1 from meetings m where m.id = meeting_id and can_see(m.visibility)));
create policy agenda_write on agenda_items for all using (is_vr()) with check (is_vr());

create policy documents_read on documents for select using (can_see(visibility));
create policy documents_insert on documents for insert with check (is_member() and (visibility <> 'vr' or is_vr()));
create policy documents_write on documents for update using (is_vr() or uploaded_by = my_profile_id());
create policy documents_delete on documents for delete using (is_vr() or uploaded_by = my_profile_id());

create policy zt_read on zieltreppen for select using (can_see(visibility) or owner_id = my_profile_id());
create policy zt_write on zieltreppen for all using (is_vr() or owner_id = my_profile_id()) with check (is_vr() or owner_id = my_profile_id());
create policy zts_read on zieltreppe_stufen for select using (exists (select 1 from zieltreppen z where z.id = zieltreppe_id and (can_see(z.visibility) or z.owner_id = my_profile_id())));
create policy zts_write on zieltreppe_stufen for all using (exists (select 1 from zieltreppen z where z.id = zieltreppe_id and (is_vr() or z.owner_id = my_profile_id())));
create policy zte_read on zieltreppe_etappen for select using (exists (select 1 from zieltreppe_stufen s join zieltreppen z on z.id = s.zieltreppe_id where s.id = stufe_id and (can_see(z.visibility) or z.owner_id = my_profile_id())));
create policy zte_write on zieltreppe_etappen for all using (exists (select 1 from zieltreppe_stufen s join zieltreppen z on z.id = s.zieltreppe_id where s.id = stufe_id and (is_vr() or z.owner_id = my_profile_id())));

create policy tc_read on team_canvas for select using (can_see(visibility));
create policy tc_write on team_canvas for all using (is_vr() or (team = 'GL' and is_member())) with check (is_vr() or (team = 'GL' and is_member()));

create policy nfc_read on nf_canvas for select using (can_see(visibility) or owner_id = my_profile_id());
create policy nfc_write on nf_canvas for all using (is_vr() or owner_id = my_profile_id()) with check (is_vr() or owner_id = my_profile_id());
create policy nfcf_read on nf_canvas_fields for select using (exists (select 1 from nf_canvas c where c.id = canvas_id and (can_see(c.visibility) or c.owner_id = my_profile_id())));
create policy nfcf_write on nf_canvas_fields for all using (exists (select 1 from nf_canvas c where c.id = canvas_id and (is_vr() or c.owner_id = my_profile_id())));

create policy rev_read on reviews for select using (can_see(visibility));
create policy rev_write on reviews for all using (is_vr() or (team = 'GL' and is_member())) with check (is_vr() or (team = 'GL' and is_member()));
create policy retro_read on retrospectives for select using (can_see(visibility));
create policy retro_write on retrospectives for all using (is_member()) with check (is_member());

create policy akv_read on gl_akv for select using (is_member());
create policy akv_write on gl_akv for all using (is_vr() or profile_id = my_profile_id()) with check (is_vr() or profile_id = my_profile_id());
create policy dm_read on delegation_mandates for select using (is_member());
create policy dm_write on delegation_mandates for all using (is_vr()) with check (is_vr());

-- VSOP: Beschlüsse und Bewertungen nur VR (nicht-begünstigt); Teilnehmende sehen eigenen Datensatz
create policy vsopset_read on vsop_settings for select using (is_member());
create policy vsopset_write on vsop_settings for all using (is_vr()) with check (is_vr());
create policy vsopsc_read on vsop_scenarios for select using (is_member());
create policy vsopsc_write on vsop_scenarios for all using (is_vr()) with check (is_vr());
create policy vsopp_read on vsop_participants for select using (is_vr() or profile_id = my_profile_id());
create policy vsopp_write on vsop_participants for all using (is_vr()) with check (is_vr());
create policy vsope_read on vsop_events for select using (is_vr() or exists (select 1 from vsop_participants p where p.id = participant_id and p.profile_id = my_profile_id()));
create policy vsope_write on vsop_events for all using (is_vr()) with check (is_vr());

create policy kpi_read on kpi_snapshots for select using (can_see(visibility));
create policy kpi_write on kpi_snapshots for all using (is_vr()) with check (is_vr());
create policy risks_read on risks for select using (is_member());
create policy risks_write on risks for all using (is_vr()) with check (is_vr());

-- ---------------------------------------------------------------- Storage
insert into storage.buckets (id, name, public) values ('dokumente', 'dokumente', false)
on conflict (id) do nothing;

-- Pfadkonvention: vr/… (nur VR), gl/… (GL+VR), alle/…
create policy docs_storage_read on storage.objects for select
  using (bucket_id = 'dokumente' and (
    (storage.foldername(name))[1] = 'alle' and is_member() or
    (storage.foldername(name))[1] = 'gl'   and is_member() or
    (storage.foldername(name))[1] = 'vr'   and is_vr()));
create policy docs_storage_insert on storage.objects for insert
  with check (bucket_id = 'dokumente' and (
    (storage.foldername(name))[1] in ('alle','gl') and is_member() or
    (storage.foldername(name))[1] = 'vr' and is_vr()));
create policy docs_storage_delete on storage.objects for delete
  using (bucket_id = 'dokumente' and is_vr());

-- ---------------------------------------------------------------- Views
create or replace view v_milestones as
select m.*, p.title as phase_title, p.nr as phase_nr, pr.full_name as owner_name
from milestones m
left join phases p on p.id = m.phase_id
left join profiles pr on pr.id = m.owner_id;
