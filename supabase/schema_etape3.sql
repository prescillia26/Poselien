-- =====================================================================
--  Posélien — Étape 3 : publication réelle des poses
--  À exécuter dans Supabase : SQL Editor > New query > coller > Run.
--  (Nécessite d'avoir déjà exécuté schema.sql de l'étape 2.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) Statut d'une pose
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pose_statut') then
    create type public.pose_statut as enum ('ouverte','en_cours','terminee','annulee');
  end if;
end$$;

-- ---------------------------------------------------------------------
-- 1) Périmètre du poseur : ajouté sur profiles
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists perimetre_toute_france boolean not null default false,
  add column if not exists perimetre_regions text[] not null default '{}';

-- Empêche un utilisateur de changer son propre rôle via un update
create or replace function public.prevent_role_change()
returns trigger language plpgsql as $$
begin
  if new.role <> old.role then
    raise exception 'Le rôle ne peut pas être modifié.';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_prevent_role_change on public.profiles;
create trigger trg_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ---------------------------------------------------------------------
-- 2) Table de référence départements -> région
-- ---------------------------------------------------------------------
create table if not exists public.departements (
  code   text primary key,
  label  text not null,
  region text not null
);
alter table public.departements enable row level security;
drop policy if exists "departements_read_all" on public.departements;
create policy "departements_read_all"
  on public.departements for select to authenticated using (true);

insert into public.departements (code, label, region) values
  ('75','75 Paris','Île-de-France'),
  ('77','77 Seine-et-Marne','Île-de-France'),
  ('78','78 Yvelines','Île-de-France'),
  ('91','91 Essonne','Île-de-France'),
  ('92','92 Hauts-de-Seine','Île-de-France'),
  ('93','93 Seine-Saint-Denis','Île-de-France'),
  ('94','94 Val-de-Marne','Île-de-France'),
  ('95','95 Val-d''Oise','Île-de-France'),
  ('01','01 Ain','Auvergne-Rhône-Alpes'),
  ('03','03 Allier','Auvergne-Rhône-Alpes'),
  ('07','07 Ardèche','Auvergne-Rhône-Alpes'),
  ('15','15 Cantal','Auvergne-Rhône-Alpes'),
  ('26','26 Drôme','Auvergne-Rhône-Alpes'),
  ('38','38 Isère','Auvergne-Rhône-Alpes'),
  ('42','42 Loire','Auvergne-Rhône-Alpes'),
  ('43','43 Haute-Loire','Auvergne-Rhône-Alpes'),
  ('63','63 Puy-de-Dôme','Auvergne-Rhône-Alpes'),
  ('69','69 Rhône','Auvergne-Rhône-Alpes'),
  ('73','73 Savoie','Auvergne-Rhône-Alpes'),
  ('74','74 Haute-Savoie','Auvergne-Rhône-Alpes'),
  ('21','21 Côte-d''Or','Bourgogne-Franche-Comté'),
  ('25','25 Doubs','Bourgogne-Franche-Comté'),
  ('39','39 Jura','Bourgogne-Franche-Comté'),
  ('58','58 Nièvre','Bourgogne-Franche-Comté'),
  ('70','70 Haute-Saône','Bourgogne-Franche-Comté'),
  ('71','71 Saône-et-Loire','Bourgogne-Franche-Comté'),
  ('89','89 Yonne','Bourgogne-Franche-Comté'),
  ('90','90 Territoire de Belfort','Bourgogne-Franche-Comté'),
  ('22','22 Côtes-d''Armor','Bretagne'),
  ('29','29 Finistère','Bretagne'),
  ('35','35 Ille-et-Vilaine','Bretagne'),
  ('56','56 Morbihan','Bretagne'),
  ('18','18 Cher','Centre-Val de Loire'),
  ('28','28 Eure-et-Loir','Centre-Val de Loire'),
  ('36','36 Indre','Centre-Val de Loire'),
  ('37','37 Indre-et-Loire','Centre-Val de Loire'),
  ('41','41 Loir-et-Cher','Centre-Val de Loire'),
  ('45','45 Loiret','Centre-Val de Loire'),
  ('2A','2A Corse-du-Sud','Corse'),
  ('2B','2B Haute-Corse','Corse'),
  ('08','08 Ardennes','Grand Est'),
  ('10','10 Aube','Grand Est'),
  ('51','51 Marne','Grand Est'),
  ('52','52 Haute-Marne','Grand Est'),
  ('54','54 Meurthe-et-Moselle','Grand Est'),
  ('55','55 Meuse','Grand Est'),
  ('57','57 Moselle','Grand Est'),
  ('67','67 Bas-Rhin','Grand Est'),
  ('68','68 Haut-Rhin','Grand Est'),
  ('88','88 Vosges','Grand Est'),
  ('02','02 Aisne','Hauts-de-France'),
  ('59','59 Nord','Hauts-de-France'),
  ('60','60 Oise','Hauts-de-France'),
  ('62','62 Pas-de-Calais','Hauts-de-France'),
  ('80','80 Somme','Hauts-de-France'),
  ('14','14 Calvados','Normandie'),
  ('27','27 Eure','Normandie'),
  ('50','50 Manche','Normandie'),
  ('61','61 Orne','Normandie'),
  ('76','76 Seine-Maritime','Normandie'),
  ('16','16 Charente','Nouvelle-Aquitaine'),
  ('17','17 Charente-Maritime','Nouvelle-Aquitaine'),
  ('19','19 Corrèze','Nouvelle-Aquitaine'),
  ('23','23 Creuse','Nouvelle-Aquitaine'),
  ('24','24 Dordogne','Nouvelle-Aquitaine'),
  ('33','33 Gironde','Nouvelle-Aquitaine'),
  ('40','40 Landes','Nouvelle-Aquitaine'),
  ('47','47 Lot-et-Garonne','Nouvelle-Aquitaine'),
  ('64','64 Pyrénées-Atlantiques','Nouvelle-Aquitaine'),
  ('79','79 Deux-Sèvres','Nouvelle-Aquitaine'),
  ('86','86 Vienne','Nouvelle-Aquitaine'),
  ('87','87 Haute-Vienne','Nouvelle-Aquitaine'),
  ('09','09 Ariège','Occitanie'),
  ('11','11 Aude','Occitanie'),
  ('12','12 Aveyron','Occitanie'),
  ('30','30 Gard','Occitanie'),
  ('31','31 Haute-Garonne','Occitanie'),
  ('32','32 Gers','Occitanie'),
  ('34','34 Hérault','Occitanie'),
  ('46','46 Lot','Occitanie'),
  ('48','48 Lozère','Occitanie'),
  ('65','65 Hautes-Pyrénées','Occitanie'),
  ('66','66 Pyrénées-Orientales','Occitanie'),
  ('81','81 Tarn','Occitanie'),
  ('82','82 Tarn-et-Garonne','Occitanie'),
  ('44','44 Loire-Atlantique','Pays de la Loire'),
  ('49','49 Maine-et-Loire','Pays de la Loire'),
  ('53','53 Mayenne','Pays de la Loire'),
  ('72','72 Sarthe','Pays de la Loire'),
  ('85','85 Vendée','Pays de la Loire'),
  ('04','04 Alpes-de-Haute-Provence','Provence-Alpes-Côte d''Azur'),
  ('05','05 Hautes-Alpes','Provence-Alpes-Côte d''Azur'),
  ('06','06 Alpes-Maritimes','Provence-Alpes-Côte d''Azur'),
  ('13','13 Bouches-du-Rhône','Provence-Alpes-Côte d''Azur'),
  ('83','83 Var','Provence-Alpes-Côte d''Azur'),
  ('84','84 Vaucluse','Provence-Alpes-Côte d''Azur')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- 3) Table des poses (données visibles)
-- ---------------------------------------------------------------------
create table if not exists public.poses (
  id            uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  prestations   text[] not null default '{}',
  departement   text not null,
  region        text,
  ville         text not null,
  prix          integer not null check (prix >= 0),
  aides         boolean not null default false,
  description   text,
  lieu_retrait  text,
  statut        public.pose_statut not null default 'ouverte',
  poseur_id     uuid references public.profiles (id),
  created_at    timestamptz not null default now()
);

-- La région est calculée automatiquement à partir du département (anti-triche)
create or replace function public.set_pose_region()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select d.region into new.region
  from public.departements d
  where d.code = split_part(new.departement, ' ', 1);
  return new;
end;
$$;
drop trigger if exists trg_set_pose_region on public.poses;
create trigger trg_set_pose_region
  before insert or update of departement on public.poses
  for each row execute function public.set_pose_region();

-- ---------------------------------------------------------------------
-- 4) Créneaux d'une pose
-- ---------------------------------------------------------------------
create table if not exists public.creneaux (
  id       uuid primary key default gen_random_uuid(),
  pose_id  uuid not null references public.poses (id) on delete cascade,
  jour     date not null,
  h_debut  text not null,
  h_fin    text not null
);

-- ---------------------------------------------------------------------
-- 5) Fiche client + bon de commande (PRIVÉ : jamais visible avant acceptation)
-- ---------------------------------------------------------------------
create table if not exists public.pose_client (
  pose_id           uuid primary key references public.poses (id) on delete cascade,
  client_nom        text,
  client_adresse    text,
  client_tel        text,
  client_details    text,
  bon_commande_path text
);

-- ---------------------------------------------------------------------
-- 6) Fonctions d'aide pour la sécurité
-- ---------------------------------------------------------------------
create or replace function public.my_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Le périmètre du poseur connecté couvre-t-il cette région ?
create or replace function public.poseur_covers(pose_region text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'poseur'
      and (p.perimetre_toute_france or pose_region = any(p.perimetre_regions))
  );
$$;

-- ---------------------------------------------------------------------
-- 7) RLS
-- ---------------------------------------------------------------------
alter table public.poses       enable row level security;
alter table public.creneaux    enable row level security;
alter table public.pose_client enable row level security;

-- POSES : l'entreprise voit les siennes ; le poseur voit les poses OUVERTES
-- de son périmètre (ou celles qui lui sont attribuées).
drop policy if exists "poses_select" on public.poses;
create policy "poses_select" on public.poses for select to authenticated
using (
  entreprise_id = auth.uid()
  or poseur_id = auth.uid()
  or (statut = 'ouverte' and public.poseur_covers(region))
);

drop policy if exists "poses_insert" on public.poses;
create policy "poses_insert" on public.poses for insert to authenticated
with check (entreprise_id = auth.uid() and public.my_role() = 'entreprise');

drop policy if exists "poses_update_own" on public.poses;
create policy "poses_update_own" on public.poses for update to authenticated
using (entreprise_id = auth.uid()) with check (entreprise_id = auth.uid());

-- CRÉNEAUX : visibles si la pose parente est visible (réutilise la RLS de poses)
drop policy if exists "creneaux_select" on public.creneaux;
create policy "creneaux_select" on public.creneaux for select to authenticated
using (exists (select 1 from public.poses po where po.id = creneaux.pose_id));

drop policy if exists "creneaux_insert" on public.creneaux;
create policy "creneaux_insert" on public.creneaux for insert to authenticated
with check (exists (
  select 1 from public.poses po
  where po.id = creneaux.pose_id and po.entreprise_id = auth.uid()
));

-- FICHE CLIENT : UNIQUEMENT l'entreprise propriétaire, OU le poseur attribué
-- une fois la pose acceptée (statut <> 'ouverte'). Jamais un poseur sinon.
drop policy if exists "pose_client_select" on public.pose_client;
create policy "pose_client_select" on public.pose_client for select to authenticated
using (exists (
  select 1 from public.poses po
  where po.id = pose_client.pose_id
    and (
      po.entreprise_id = auth.uid()
      or (po.poseur_id = auth.uid() and po.statut <> 'ouverte')
    )
));

drop policy if exists "pose_client_insert" on public.pose_client;
create policy "pose_client_insert" on public.pose_client for insert to authenticated
with check (exists (
  select 1 from public.poses po
  where po.id = pose_client.pose_id and po.entreprise_id = auth.uid()
));

-- ---------------------------------------------------------------------
-- 8) Stockage des bons de commande (bucket privé)
--    Enveloppé dans un bloc tolérant aux erreurs : si votre projet ne
--    permet pas de créer ces règles ici, le reste du script s'exécute
--    quand même (le bucket pourra être créé à la main dans Storage).
-- ---------------------------------------------------------------------
do $storage$
begin
  insert into storage.buckets (id, name, public)
  values ('bons-commande','bons-commande', false)
  on conflict (id) do nothing;

  begin
    execute $p$ create policy "bon_insert_own" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'bons-commande' and owner = auth.uid()) $p$;
  exception when duplicate_object then null;
  end;

  begin
    execute $p$ create policy "bon_select_own" on storage.objects
      for select to authenticated
      using (bucket_id = 'bons-commande' and owner = auth.uid()) $p$;
  exception when duplicate_object then null;
  end;
exception when others then
  raise notice 'Stockage non configuré automatiquement (%). Créez le bucket « bons-commande » (privé) manuellement dans Storage si besoin.', sqlerrm;
end
$storage$;
