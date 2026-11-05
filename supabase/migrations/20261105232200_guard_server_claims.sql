-- Use the same server-set subject without requiring usage of Supabase-owned auth schema.
CREATE OR REPLACE FUNCTION mn_private.guard_app()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$begin
 if tg_op='UPDATE' and (new.id<>old.id or (new.owner_id is distinct from old.owner_id and current_user not in ('postgres','supabase_admin')) or new.creator<>old.creator or new.kind<>old.kind) then raise exception 'App identity cannot be changed';end if;
 if not mn_private.is_moderator() and (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub') is not null then
  if tg_op='UPDATE' and old.status='archived' and new.status<>'archived' then raise exception 'Ask an admin to restore this protocol';end if;
  if new.status not in ('draft','pending','archived') and not(new.status='published' and mn_private.is_publisher()) then raise exception 'Publishing requires a whitelisted account or admin review';end if;
  if tg_op='INSERT' and new.review_note<>'' then raise exception 'Only moderators can add review notes';end if;
  if tg_op='UPDATE' and new.review_note is distinct from old.review_note then raise exception 'Only moderators can change review notes';end if;
  new.review_note='';
  if new.kind<>'external' then raise exception 'Submissions must link to an external app';end if;
 end if;
 new.updated_at=now();return new;end$function$

