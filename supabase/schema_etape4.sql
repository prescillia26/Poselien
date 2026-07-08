-- =====================================================================
--  Posélien — Étape 4 : acceptation d'une pose
--  À exécuter dans Supabase : SQL Editor > New query > coller > Run.
--  (Nécessite d'avoir exécuté schema.sql (étape 2) et schema_etape3.sql.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Créneau choisi par le poseur au moment de l'acceptation
-- ---------------------------------------------------------------------
alter table public.poses
  add column if not exists creneau_id uuid references public.creneaux (id);

-- ---------------------------------------------------------------------
-- 2) Le lieu de retrait devient PRIVÉ (débloqué à l'acceptation)
--    -> on le déplace de "poses" vers "pose_client".
-- ---------------------------------------------------------------------
alter table public.pose_client
  add column if not exists lieu_retrait text;

do $migr$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'poses'
      and column_name = 'lieu_retrait'
  ) then
    update public.pose_client pc
      set lieu_retrait = p.lieu_retrait
      from public.poses p
      where p.id = pc.pose_id
        and pc.lieu_retrait is null
        and p.lieu_retrait is not null;
    alter table public.poses drop column lieu_retrait;
  end if;
end
$migr$;

-- ---------------------------------------------------------------------
-- 3) Refus : une pose refusée disparaît pour CE poseur, reste ouverte
--    pour les autres.
-- ---------------------------------------------------------------------
create table if not exists public.pose_refus (
  pose_id   uuid not null references public.poses (id) on delete cascade,
  poseur_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pose_id, poseur_id)
);
alter table public.pose_refus enable row level security;

drop policy if exists "refus_select_own" on public.pose_refus;
create policy "refus_select_own" on public.pose_refus for select to authenticated
using (poseur_id = auth.uid());

drop policy if exists "refus_insert_own" on public.pose_refus;
create policy "refus_insert_own" on public.pose_refus for insert to authenticated
with check (poseur_id = auth.uid() and public.my_role() = 'poseur');

-- ---------------------------------------------------------------------
-- 4) Fil du poseur : exclure les poses qu'il a refusées
--    (l'entreprise et le poseur attribué ne sont pas concernés)
-- ---------------------------------------------------------------------
drop policy if exists "poses_select" on public.poses;
create policy "poses_select" on public.poses for select to authenticated
using (
  entreprise_id = auth.uid()
  or poseur_id = auth.uid()
  or (
    statut = 'ouverte'
    and public.poseur_covers(region)
    and not exists (
      select 1 from public.pose_refus r
      where r.pose_id = poses.id and r.poseur_id = auth.uid()
    )
  )
);

-- ---------------------------------------------------------------------
-- 5) Acceptation ATOMIQUE : un seul poseur peut gagner
--    L'UPDATE ... where statut='ouverte' verrouille la ligne ;
--    le 2e poseur voit 0 ligne modifiée -> « pose déjà prise ».
-- ---------------------------------------------------------------------
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

  -- Le créneau doit appartenir à cette pose
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

grant execute on function public.accepter_pose(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 6) Bon de commande : le poseur attribué peut le télécharger
--    (le chemin du fichier commence par l'id de la pose : "<pose_id>/…")
-- ---------------------------------------------------------------------
do $storage$
begin
  begin
    execute $p$ create policy "bon_select_poseur_attribue" on storage.objects
      for select to authenticated
      using (
        bucket_id = 'bons-commande'
        and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
        and exists (
          select 1 from public.poses po
          where po.id = ((storage.foldername(name))[1])::uuid
            and po.poseur_id = auth.uid()
            and po.statut <> 'ouverte'
        )
      ) $p$;
  exception when duplicate_object then null;
  end;
exception when others then
  raise notice 'Policy Storage non ajoutée (%). Le téléchargement du bon par le poseur peut nécessiter une config manuelle.', sqlerrm;
end
$storage$;
