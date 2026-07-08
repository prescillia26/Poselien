-- =====================================================================
--  Posélien — Étape 6 : documents + contrat + validation admin
--  À exécuter dans Supabase : SQL Editor > New query > coller > Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Colonnes sur profiles : admin + signature du contrat
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_admin        boolean not null default false,
  add column if not exists contrat_signe   boolean not null default false,
  add column if not exists contrat_signe_at timestamptz;

-- Protège le rôle ET le drapeau admin (un utilisateur ne peut pas se
-- promouvoir admin via l'API ; seul le SQL Editor, sans session, le peut).
create or replace function public.protect_profile()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role then
    raise exception 'Le rôle ne peut pas être modifié.';
  end if;
  if auth.uid() is not null and new.is_admin is distinct from old.is_admin then
    raise exception 'Le statut admin ne peut pas être modifié ici.';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_prevent_role_change on public.profiles;
drop trigger if exists trg_protect_profile on public.profiles;
create trigger trg_protect_profile
  before update on public.profiles
  for each row execute function public.protect_profile();

-- Utilisateur courant = admin ?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- L'admin peut lire tous les profils (pour l'espace d'administration).
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles for select to authenticated
using (public.is_admin());

-- ---------------------------------------------------------------------
-- 2) Table des documents du poseur
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'doc_statut') then
    create type public.doc_statut as enum ('a_valider','valide','refuse');
  end if;
end$$;

create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  poseur_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  type         text not null,   -- rge | urssaf | fiscale | kbis | decennale
  statut       public.doc_statut not null default 'a_valider',
  fichier_path text,
  motif_refus  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (poseur_id, type)
);

alter table public.documents enable row level security;

-- LECTURE : le poseur voit les siens ; l'admin voit tout.
drop policy if exists "documents_select" on public.documents;
create policy "documents_select" on public.documents for select to authenticated
using (poseur_id = auth.uid() or public.is_admin());

-- INSERT : le poseur crée les siens (statut forcé à 'a_valider').
drop policy if exists "documents_insert" on public.documents;
create policy "documents_insert" on public.documents for insert to authenticated
with check (
  poseur_id = auth.uid()
  and public.my_role() = 'poseur'
  and statut = 'a_valider'
);

-- UPDATE poseur : re-dépôt de SON document, remis à 'a_valider'.
drop policy if exists "documents_update_poseur" on public.documents;
create policy "documents_update_poseur" on public.documents for update to authenticated
using (poseur_id = auth.uid())
with check (poseur_id = auth.uid() and statut = 'a_valider');

-- UPDATE admin : validation / refus.
drop policy if exists "documents_update_admin" on public.documents;
create policy "documents_update_admin" on public.documents for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 3) Éligibilité du poseur (documents validés + contrat signé)
-- ---------------------------------------------------------------------
create or replace function public.poseur_peut_accepter()
returns boolean language sql stable security definer set search_path = public as $$
  select
    coalesce((select contrat_signe from public.profiles where id = auth.uid()), false)
    and not exists (
      select 1
      from (values ('rge'),('urssaf'),('fiscale'),('kbis'),('decennale')) as req(type)
      where not exists (
        select 1 from public.documents d
        where d.poseur_id = auth.uid()
          and d.type = req.type
          and d.statut = 'valide'
      )
    );
$$;
grant execute on function public.poseur_peut_accepter() to authenticated;

-- Blocage côté serveur : impossible d'accepter sans dossier complet.
create or replace function public.accepter_pose(p_pose_id uuid, p_creneau_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if public.my_role() <> 'poseur' then
    raise exception 'NON_AUTORISE';
  end if;

  if not public.poseur_peut_accepter() then
    raise exception 'DOSSIER_INCOMPLET';
  end if;

  if not exists (
    select 1 from public.creneaux c
    where c.id = p_creneau_id and c.pose_id = p_pose_id
  ) then
    raise exception 'CRENEAU_INVALIDE';
  end if;

  update public.poses
     set statut = 'en_cours',
         poseur_id = auth.uid(),
         creneau_id = p_creneau_id
   where id = p_pose_id
     and statut = 'ouverte'
     and public.poseur_covers(region);

  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'POSE_DEJA_PRISE';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 4) Stockage des documents (bucket privé)
-- ---------------------------------------------------------------------
do $storage$
begin
  insert into storage.buckets (id, name, public)
  values ('documents','documents', false)
  on conflict (id) do nothing;

  begin
    execute $p$ create policy "docs_insert_own" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'documents' and owner = auth.uid()) $p$;
  exception when duplicate_object then null;
  end;

  begin
    execute $p$ create policy "docs_update_own" on storage.objects
      for update to authenticated
      using (bucket_id = 'documents' and owner = auth.uid()) $p$;
  exception when duplicate_object then null;
  end;

  begin
    execute $p$ create policy "docs_select_own_or_admin" on storage.objects
      for select to authenticated
      using (bucket_id = 'documents' and (owner = auth.uid() or public.is_admin())) $p$;
  exception when duplicate_object then null;
  end;
exception when others then
  raise notice 'Stockage documents non configuré automatiquement (%).', sqlerrm;
end
$storage$;
