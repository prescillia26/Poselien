-- =====================================================================
--  Posélien — Notifications
--  À exécuter dans Supabase : SQL Editor > New query > coller > Run.
--  (Nécessite les scripts des étapes précédentes.)
-- =====================================================================

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null,               -- 'nouvelle_pose' | 'pose_acceptee'
  pose_id    uuid references public.poses (id) on delete cascade,
  titre      text not null,
  corps      text,
  lu         boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Chaque utilisateur ne voit QUE ses notifications
drop policy if exists "notif_select_own" on public.notifications;
create policy "notif_select_own" on public.notifications for select to authenticated
using (user_id = auth.uid());

-- Chaque utilisateur peut marquer SES notifications comme lues
drop policy if exists "notif_update_own" on public.notifications;
create policy "notif_update_own" on public.notifications for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Aucune policy INSERT : les notifications sont créées côté serveur avec la
-- clé secrète (service role), qui contourne la RLS. Un utilisateur ne peut
-- donc pas se fabriquer des notifications.
