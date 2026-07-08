-- =====================================================================
--  Posélien — Étape 2 : comptes
--  À exécuter dans Supabase : SQL Editor > New query > coller > Run.
-- =====================================================================

-- 1) Type de rôle (entreprise ou poseur)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('entreprise', 'poseur');
  end if;
end$$;

-- 2) Table des profils, liée 1-1 au compte auth.users
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       public.user_role not null,
  email      text not null,
  nom        text,
  created_at timestamptz not null default now()
);

-- 3) Sécurité au niveau des lignes (RLS) : activée
alter table public.profiles enable row level security;

-- Chaque utilisateur ne voit que son propre profil
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Chaque utilisateur ne peut modifier que son propre profil (sauf le rôle)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Remarque : aucune policy INSERT n'est nécessaire.
-- La création du profil est faite par le trigger ci-dessous, qui s'exécute
-- avec les droits du propriétaire (security definer) et contourne donc la RLS.

-- 4) Création automatique du profil à l'inscription
--    Le rôle et le nom sont lus depuis les métadonnées envoyées au signUp.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, email, nom)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'entreprise')::public.user_role,
    new.email,
    new.raw_user_meta_data ->> 'nom'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
