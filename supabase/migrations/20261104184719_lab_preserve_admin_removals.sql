create or replace function mn_private.publish_protocol(publishing_key text,protocol jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare k mn_private.publishing_keys; result public.mn_apps; existing public.mn_apps; item_id text; requested_status text;
begin
 if publishing_key is null or publishing_key !~ '^mnl_[a-f0-9]{64}$' then raise exception using errcode='28000',message='Invalid publishing key';end if;
 select * into k from mn_private.publishing_keys where key_hash=encode(extensions.digest(publishing_key,'sha256'),'hex') and revoked_at is null and expires_at>now() for update;
 if k.id is null then raise exception using errcode='28000',message='Invalid or expired publishing key';end if;
 if k.last_used_at>clock_timestamp()-interval '2 seconds' then raise exception using errcode='P0002',message='Wait two seconds before publishing again';end if;
 if jsonb_typeof(protocol) is distinct from 'object' or octet_length(protocol::text)>65536 then raise exception using errcode='22023',message='Invalid protocol payload';end if;
 if exists(select 1 from jsonb_object_keys(protocol) as t(key) where key not in ('id','name','description','about','instructions','url','screenshot','source_url','tools_used','category','embed_mode','permissions','status')) then raise exception using errcode='22023',message='Unknown protocol field';end if;
 item_id=protocol->>'id';requested_status=coalesce(protocol->>'status','published');
 if item_id is null or item_id !~ '^[a-z0-9][a-z0-9-]{2,79}$' or requested_status not in ('published','draft') then raise exception using errcode='22023',message='Invalid id or status';end if;
 if coalesce(length(trim(protocol->>'instructions')),0)=0 or coalesce(protocol->>'url','') !~ '^https://' or coalesce(protocol->>'screenshot','') !~ '^https://' then raise exception using errcode='22023',message='Instructions, HTTPS experience URL and cover URL are required';end if;
 -- Serializes competing keys for the same id as well as retries.
 perform pg_advisory_xact_lock(hashtextextended(item_id,0));
 select * into existing from public.mn_apps where id=item_id for update;
 if existing.id is not null and existing.creator<>k.creator then raise exception using errcode='42501',message='This id belongs to another creator';end if;
 if existing.status='archived' then raise exception using errcode='42501',message='Ask an admin to restore this protocol before updating it';end if;
 if existing.id is not null and existing.kind<>'external' then raise exception using errcode='42501',message='Only external experiences can be updated';end if;
 insert into public.mn_apps(id,creator,owner_id,name,description,about,instructions,source_url,tools_used,url,screenshot,category,embed_mode,permissions,status)
 values(item_id,k.creator,(select user_id from public.mn_profiles where id=k.creator),protocol->>'name',protocol->>'description',protocol->>'about',protocol->>'instructions',coalesce(protocol->>'source_url',''),coalesce(protocol->>'tools_used',''),protocol->>'url',protocol->>'screenshot',coalesce(protocol->>'category','Discover'),coalesce(protocol->>'embed_mode','external'),array(select jsonb_array_elements_text(coalesce(protocol->'permissions','[]'::jsonb))),requested_status)
 on conflict(id) do update set name=excluded.name,description=excluded.description,about=excluded.about,instructions=excluded.instructions,source_url=excluded.source_url,tools_used=excluded.tools_used,url=excluded.url,screenshot=excluded.screenshot,category=excluded.category,embed_mode=excluded.embed_mode,permissions=excluded.permissions,status=excluded.status
 returning * into result;
 update mn_private.publishing_keys set last_used_at=clock_timestamp() where id=k.id;
 return jsonb_build_object('id',result.id,'creator',result.creator,'status',result.status,'updated_at',result.updated_at);
end $$;
