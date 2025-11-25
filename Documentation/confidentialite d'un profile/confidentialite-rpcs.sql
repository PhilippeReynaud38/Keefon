-- Vivaya - RPCs de confidentialite
-- get_privacy_flags / get_viewer_is_certified
-- Security: SECURITY DEFINER; grant execute to authenticated; revoke all from public;

create or replace function public.get_privacy_flags(p_ids uuid[])
returns table(user_id uuid, is_public boolean, cert_only boolean)
language sql
security definer
set search_path = public
as $$
  select
    us.user_id,
    coalesce(us.is_public, true)                  as is_public,
    coalesce(us.visible_to_certified_only, false) as cert_only
  from public.user_settings us
  where us.user_id = any(p_ids)
$$;

revoke all on function public.get_privacy_flags(uuid[]) from public;
grant execute on function public.get_privacy_flags(uuid[]) to authenticated;

create or replace function public.get_viewer_is_certified()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
           select 1 from public.profiles p
           where p.id = auth.uid() and p.certified_status = 'approved'
         )
      or exists(
           select 1 from public.certified_photos c
           where c.user_id = auth.uid() and c.status = 'approved'
         );
$$;

revoke all on function public.get_viewer_is_certified() from public;
grant execute on function public.get_viewer_is_certified() to authenticated;
