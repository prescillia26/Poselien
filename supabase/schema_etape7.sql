-- =====================================================================
--  Posélien — Chat fermé (messages prédéfinis)
--  À exécuter dans Supabase : SQL Editor > New query > coller > Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Messages prédéfinis autorisés (par rôle)
-- ---------------------------------------------------------------------
create table if not exists public.messages_predefinis (
  role  public.user_role not null,
  texte text not null,
  primary key (role, texte)
);
alter table public.messages_predefinis enable row level security;
drop policy if exists "predefinis_read" on public.messages_predefinis;
create policy "predefinis_read" on public.messages_predefinis for select to authenticated using (true);

insert into public.messages_predefinis (role, texte) values
  ('poseur','À quelle heure dois-je arriver ?'),
  ('poseur','Le matériel est-il fourni sur place ?'),
  ('poseur','La dépose de l''ancien équipement est-elle incluse ?'),
  ('poseur','Quel étage ? Y a-t-il un ascenseur ?'),
  ('poseur','Accès / stationnement pour le camion ?'),
  ('poseur','Le client sera-t-il présent le jour J ?'),
  ('poseur','Une contrainte particulière sur le chantier ?'),
  ('entreprise','Oui'),
  ('entreprise','Non'),
  ('entreprise','Je vérifie et reviens vers vous'),
  ('entreprise','8h00'),
  ('entreprise','9h00'),
  ('entreprise','10h00'),
  ('entreprise','14h00'),
  ('entreprise','Oui, fourni sur place'),
  ('entreprise','Non, à retirer au point relais'),
  ('entreprise','Oui, dépose incluse'),
  ('entreprise','Non, dépose non incluse'),
  ('entreprise','Rez-de-chaussée'),
  ('entreprise','Avec ascenseur'),
  ('entreprise','Sans ascenseur'),
  ('entreprise','Stationnement facile'),
  ('entreprise','Stationnement difficile'),
  ('entreprise','Autorisation à prévoir'),
  ('entreprise','Oui, présent'),
  ('entreprise','Non, clés au gardien'),
  ('entreprise','À convenir'),
  ('entreprise','Aucune contrainte'),
  ('entreprise','Voir détails du chantier')
on conflict (role, texte) do nothing;

-- ---------------------------------------------------------------------
-- 2) Messages du chat
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  pose_id    uuid not null references public.poses (id) on delete cascade,
  sender_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  texte      text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_pose_idx on public.messages (pose_id, created_at);

alter table public.messages enable row level security;

-- Rôle de l'utilisateur courant pour CETTE pose ('entreprise' | 'poseur' | null)
create or replace function public.role_sur_pose(p_pose_id uuid)
returns public.user_role language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.poses po where po.id = p_pose_id and po.entreprise_id = auth.uid())
      then 'entreprise'::public.user_role
    when exists (select 1 from public.poses po
                 where po.id = p_pose_id and po.poseur_id = auth.uid() and po.statut <> 'ouverte')
      then 'poseur'::public.user_role
    else null
  end;
$$;

-- LECTURE : seuls l'entreprise et le poseur attribué de la pose.
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages for select to authenticated
using (
  exists (
    select 1 from public.poses po
    where po.id = messages.pose_id
      and (
        po.entreprise_id = auth.uid()
        or (po.poseur_id = auth.uid() and po.statut <> 'ouverte')
      )
  )
);

-- ÉCRITURE : l'expéditeur doit être partie prenante de la pose (après
-- acceptation) ET le texte doit figurer dans la liste prédéfinie de son rôle.
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and public.role_sur_pose(pose_id) is not null
  and exists (
    select 1 from public.messages_predefinis mp
    where mp.role = public.role_sur_pose(pose_id) and mp.texte = messages.texte
  )
);

-- ---------------------------------------------------------------------
-- 3) Temps réel (Realtime) sur les messages
-- ---------------------------------------------------------------------
do $rt$
begin
  alter publication supabase_realtime add table public.messages;
exception when others then
  -- déjà ajoutée, ou publication absente : sans gravité
  null;
end
$rt$;
