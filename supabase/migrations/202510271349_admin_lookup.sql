-- -*- coding: utf-8 -*-
-- Vivaya — Migration: admin lookup RPCs + health view
-- Règles: simple, robuste, sans DROP. Idempotent (CREATE OR REPLACE).
-- Conserve la compatibilité avec le front (fonctions en schéma public).
-- UTF-8

-- 0) Schéma admin (pour la vue santé)
create schema if not exists admin;

-- 1) RPC: find_profile_by_email_v2(email)
create or replace function public.find_profile_by_email_v2(p_email text)
returns table (id uuid, email text, username text)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  -- garde accès admin (basée sur ton implémentation existante)
  if not public.vivaya_is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  return query
  select u.id,
         (u.email)::text     as email,
         (p.username)::text  as username
  from auth.users u
  left join public.profiles p on p.id = u.id
  where lower((u.email)::text) = lower(p_email)
  limit 1;
end;
$$;

revoke all on function public.find_profile_by_email_v2(text) from public;
grant  execute on function public.find_profile_by_email_v2(text) to authenticated;

-- 2) RPC legacy wrapper: find_profile_by_email(email) → appelle v2
create or replace function public.find_profile_by_email(p_email text)
returns table (id uuid, email text, username text)
language sql
security definer
set search_path = public, auth
as $$
  select * from public.find_profile_by_email_v2(p_email);
$$;

revoke all on function public.find_profile_by_email(text) from public;
grant  execute on function public.find_profile_by_email(text) to authenticated;

-- 3) RPC: find_profile_by_id(uuid)
create or replace function public.find_profile_by_id(p_id uuid)
returns table (id uuid, email text, username text)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.vivaya_is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  return query
  select u.id,
         (u.email)::text     as email,
         (p.username)::text  as username
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = p_id
  limit 1;
end;
$$;

revoke all on function public.find_profile_by_id(uuid) from public;
grant  execute on function public.find_profile_by_id(uuid) to authenticated;

-- 4) Vue de santé: alerte si une RPC manque
create or replace view admin.health_missing_rpcs_v as
select name
from (values
  ('find_profile_by_email_v2'),
  ('find_profile_by_email'),
  ('find_profile_by_id')
) v(name)
where not exists (
  select 1
  from information_schema.routines r
  where r.routine_schema = 'public'
    and r.routine_name  = v.name
);

-- 5) Rafraîchir le cache PostgREST (utile après un déploiement)
select pg_notify('pgrst','reload schema');
