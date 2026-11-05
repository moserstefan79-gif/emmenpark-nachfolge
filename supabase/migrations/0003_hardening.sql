-- Härtung nach Code-Review (Nov 2026)

-- Helferfunktionen: search_path fixieren, Trigger-Funktion nicht via API aufrufbar
alter function public.is_vr() set search_path = public;
alter function public.is_admin() set search_path = public;
alter function public.is_member() set search_path = public;
alter function public.can_see(visibility) set search_path = public;
revoke execute on function public.link_profile_on_signup() from anon, authenticated, public;
revoke execute on function public.my_role() from anon;
revoke execute on function public.my_profile_id() from anon;

-- S3: deaktivierte Mitglieder verlieren auch owner-basierte Rechte
create or replace function public.my_profile_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles where user_id = auth.uid() and active limit 1
$$;

-- S1: View nur mit RLS des Aufrufers, kein anonymer Zugriff
alter view public.v_milestones set (security_invoker = on);
revoke all on public.v_milestones from anon;
drop policy if exists milestones_read on milestones;
create policy milestones_read on milestones for select
  using (can_see(visibility) or owner_id = my_profile_id());

-- S2/S4: Nicht-Admins dürfen am eigenen Profil keine Rechte ändern;
--        Nicht-VR-Owner dürfen an Meilensteinen nur Status/Beschreibung ändern
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and (new.role, new.active, new.email, new.user_id, new.gremium, new.sort)
     is distinct from (old.role, old.active, old.email, old.user_id, old.gremium, old.sort) then
    raise exception 'Rolle, Status, E-Mail und Gremium kann nur ein Admin ändern';
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard on profiles;
create trigger profiles_guard before update on profiles for each row execute function public.guard_profile_update();

create or replace function public.guard_milestone_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_vr() and (new.title, new.nr, new.phase_id, new.dimension, new.owner_id, new.owner_label,
                      new.start_date, new.due_date, new.visibility, new.source, new.sort)
     is distinct from (old.title, old.nr, old.phase_id, old.dimension, old.owner_id, old.owner_label,
                      old.start_date, old.due_date, old.visibility, old.source, old.sort) then
    raise exception 'Verantwortliche dürfen nur Status und Beschreibung ändern';
  end if;
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists milestones_guard on milestones;
create trigger milestones_guard before update on milestones for each row execute function public.guard_milestone_update();

-- S6: GL kann keine «nur VR»-Datensätze erzeugen
drop policy if exists tc_write on team_canvas;
create policy tc_write on team_canvas for all
  using (is_vr() or (team = 'GL' and is_member()))
  with check ((is_vr() or (team = 'GL' and is_member())) and (visibility <> 'vr' or is_vr()));
drop policy if exists rev_write on reviews;
create policy rev_write on reviews for all
  using (is_vr() or (team = 'GL' and is_member()))
  with check ((is_vr() or (team = 'GL' and is_member())) and (visibility <> 'vr' or is_vr()));
drop policy if exists retro_write on retrospectives;
create policy retro_write on retrospectives for all
  using (is_member()) with check (is_member() and (visibility <> 'vr' or is_vr()));

-- S7: Pendenzen aus VR-Sitzungen für den Pendenzen-Owner sichtbar
drop policy if exists agenda_read on agenda_items;
create policy agenda_read on agenda_items for select
  using (follow_up_owner_id = my_profile_id()
         or exists (select 1 from meetings m where m.id = meeting_id and can_see(m.visibility)));

-- S5: Hochladende dürfen eigene Dateien auch im Storage löschen
drop policy if exists docs_storage_delete on storage.objects;
create policy docs_storage_delete on storage.objects for delete
  using (bucket_id = 'dokumente' and (is_vr() or owner = auth.uid()));

-- S8: Verknüpfung auch, wenn der Auth-User vor dem Profil existiert oder die E-Mail korrigiert wird
create or replace function public.link_profile_on_profile_change() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  if new.user_id is null then
    select u.id into new.user_id from auth.users u where lower(u.email) = lower(new.email) limit 1;
  end if;
  return new;
end $$;
drop trigger if exists profiles_link on profiles;
create trigger profiles_link before insert or update of email on profiles
  for each row execute function public.link_profile_on_profile_change();
create unique index if not exists profiles_email_lower_idx on profiles (lower(email));

-- updated_at pflegen
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists gl_akv_touch on gl_akv;
create trigger gl_akv_touch before update on gl_akv for each row execute function public.touch_updated_at();
drop trigger if exists risks_touch on risks;
create trigger risks_touch before update on risks for each row execute function public.touch_updated_at();
drop trigger if exists zt_touch on zieltreppen;
create trigger zt_touch before update on zieltreppen for each row execute function public.touch_updated_at();

-- FK-Indizes
create index if not exists milestones_phase_idx on milestones (phase_id);
create index if not exists milestones_owner_idx on milestones (owner_id);
create index if not exists agenda_meeting_idx on agenda_items (meeting_id);
create index if not exists agenda_followup_idx on agenda_items (follow_up_owner_id);
create index if not exists documents_meeting_idx on documents (meeting_id);
create index if not exists zts_zt_idx on zieltreppe_stufen (zieltreppe_id);
create index if not exists zte_stufe_idx on zieltreppe_etappen (stufe_id);
create index if not exists nfcf_canvas_idx on nf_canvas_fields (canvas_id);
create index if not exists vsope_participant_idx on vsop_events (participant_id);
create index if not exists akv_profile_idx on gl_akv (profile_id);
