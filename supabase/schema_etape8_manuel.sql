-- =====================================================================
--  Posélien — Revenir à la validation MANUELLE par un admin
--  (annule le mode automatique de schema_etape8_auto.sql)
-- =====================================================================

-- Retire la validation automatique.
drop trigger if exists trg_auto_valider on public.documents;

-- Rétablit les règles strictes : le poseur ne peut pas s'auto-valider.
drop policy if exists "documents_insert" on public.documents;
create policy "documents_insert" on public.documents for insert to authenticated
with check (
  poseur_id = auth.uid()
  and public.my_role() = 'poseur'
  and statut = 'a_valider'
);

drop policy if exists "documents_update_poseur" on public.documents;
create policy "documents_update_poseur" on public.documents for update to authenticated
using (poseur_id = auth.uid())
with check (poseur_id = auth.uid() and statut = 'a_valider');

-- Les documents déjà validés automatiquement restent 'valide'. Pour les
-- remettre tous "à valider" et les re-contrôler à la main, décommentez :
-- update public.documents set statut = 'a_valider' where statut = 'valide';
