-- =====================================================================
--  Posélien — Notifications push (Web Push)
--  À exécuter dans Supabase : SQL Editor > New query > coller > Run.
-- =====================================================================

-- Un abonnement = un appareil/navigateur d'un utilisateur.
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Chaque utilisateur ne gère QUE ses propres abonnements.
drop policy if exists "push_select_own" on public.push_subscriptions;
create policy "push_select_own" on public.push_subscriptions for select to authenticated
using (user_id = auth.uid());

drop policy if exists "push_insert_own" on public.push_subscriptions;
create policy "push_insert_own" on public.push_subscriptions for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "push_update_own" on public.push_subscriptions;
create policy "push_update_own" on public.push_subscriptions for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "push_delete_own" on public.push_subscriptions;
create policy "push_delete_own" on public.push_subscriptions for delete to authenticated
using (user_id = auth.uid());

-- L'envoi des notifications est fait côté serveur avec la clé secrète, qui lit
-- tous les abonnements du destinataire (elle contourne la RLS).
