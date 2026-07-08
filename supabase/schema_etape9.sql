-- =====================================================================
--  Posélien — Modifier / supprimer une pose EN ATTENTE (entreprise)
--  À exécuter dans Supabase : SQL Editor > New query > coller > Run.
-- =====================================================================

-- Modification : uniquement SES poses encore "ouverte" (non acceptées).
drop policy if exists "poses_update_own" on public.poses;
create policy "poses_update_own" on public.poses for update to authenticated
using (entreprise_id = auth.uid() and statut = 'ouverte')
with check (entreprise_id = auth.uid() and statut = 'ouverte');

-- Suppression : uniquement SES poses encore "ouverte".
drop policy if exists "poses_delete_own" on public.poses;
create policy "poses_delete_own" on public.poses for delete to authenticated
using (entreprise_id = auth.uid() and statut = 'ouverte');

-- Créneaux : l'entreprise peut supprimer ceux de ses poses ouvertes
-- (pour les re-saisir lors d'une modification).
drop policy if exists "creneaux_delete" on public.creneaux;
create policy "creneaux_delete" on public.creneaux for delete to authenticated
using (exists (
  select 1 from public.poses po
  where po.id = creneaux.pose_id
    and po.entreprise_id = auth.uid()
    and po.statut = 'ouverte'
));

-- Fiche client : l'entreprise propriétaire peut la mettre à jour.
drop policy if exists "pose_client_update" on public.pose_client;
create policy "pose_client_update" on public.pose_client for update to authenticated
using (exists (
  select 1 from public.poses po
  where po.id = pose_client.pose_id and po.entreprise_id = auth.uid()
))
with check (exists (
  select 1 from public.poses po
  where po.id = pose_client.pose_id and po.entreprise_id = auth.uid()
));
