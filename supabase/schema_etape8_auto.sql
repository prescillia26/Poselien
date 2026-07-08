-- =====================================================================
--  Posélien — Mode AUTOMATIQUE (temporaire)
--  Les documents déposés par un poseur sont validés automatiquement,
--  sans passer par l'espace admin.
--
--  Pour revenir plus tard à la validation manuelle par un admin :
--  voir "schema_etape8_manuel.sql" (ou redemandez-moi le script).
-- =====================================================================

-- Valide automatiquement tout document déposé/mis à jour par un poseur.
-- (Une action d'un admin, elle, garde le statut choisi par l'admin.)
create or replace function public.auto_valider_document()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.statut := 'valide';
    new.motif_refus := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_valider on public.documents;
create trigger trg_auto_valider
  before insert or update on public.documents
  for each row execute function public.auto_valider_document();

-- Autorise le statut 'valide' à l'écriture par le poseur (le trigger le pose).
drop policy if exists "documents_insert" on public.documents;
create policy "documents_insert" on public.documents for insert to authenticated
with check (
  poseur_id = auth.uid()
  and public.my_role() = 'poseur'
  and statut in ('a_valider','valide')
);

drop policy if exists "documents_update_poseur" on public.documents;
create policy "documents_update_poseur" on public.documents for update to authenticated
using (poseur_id = auth.uid())
with check (poseur_id = auth.uid() and statut in ('a_valider','valide'));
