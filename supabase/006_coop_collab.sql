-- RC39 collaborative suggestions and advisory verdict votes (NEVER engine facts).
CREATE TABLE IF NOT EXISTS public.ps_coop_collab (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 room_id uuid NOT NULL REFERENCES public.ps_coop_rooms(room_id) ON DELETE CASCADE,
 sender_member uuid NOT NULL,
 client_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('question','evidence','vote')),
 content text NOT NULL CHECK(char_length(content) BETWEEN 1 AND 350),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(room_id,sender_member,client_id)
);
CREATE INDEX IF NOT EXISTS ps_coop_collab_recent_idx ON public.ps_coop_collab(room_id,id DESC);
ALTER TABLE public.ps_coop_collab ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ps_coop_collab FROM public, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.ps_coop_collab TO service_role;
CREATE OR REPLACE FUNCTION public.ps_coop_post_collab(
 p_room_id uuid,p_member_id uuid,p_client_id uuid,p_kind text,p_content text
) RETURNS TABLE(id bigint,sender_member uuid,kind text,content text,created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE old public.ps_coop_collab%ROWTYPE;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(p_room_id::text),hashtext(p_member_id::text));
 IF NOT EXISTS(SELECT 1 FROM public.ps_coop_rooms r WHERE r.room_id=p_room_id AND p_member_id IN(r.owner_member,r.guest_member))
 THEN RAISE EXCEPTION 'collab_not_member'; END IF;
 IF p_kind NOT IN ('question','evidence','vote') OR p_content IS NULL OR
    char_length(btrim(p_content))=0 OR char_length(p_content)>350 OR
    (p_kind='vote' AND p_content NOT IN ('ready','review')) THEN RAISE EXCEPTION 'collab_invalid'; END IF;
 SELECT m.* INTO old FROM public.ps_coop_collab m WHERE m.room_id=p_room_id AND m.sender_member=p_member_id AND m.client_id=p_client_id;
 IF FOUND THEN RETURN QUERY SELECT old.id,old.sender_member,old.kind,old.content,old.created_at;RETURN; END IF;
 IF (SELECT count(*) FROM public.ps_coop_collab m WHERE m.room_id=p_room_id AND m.sender_member=p_member_id
   AND m.created_at > now()-interval '1 minute')>=12 THEN RAISE EXCEPTION 'collab_rate_limited';END IF;
 RETURN QUERY INSERT INTO public.ps_coop_collab(room_id,sender_member,client_id,kind,content)
 VALUES(p_room_id,p_member_id,p_client_id,p_kind,btrim(p_content))
 RETURNING ps_coop_collab.id,ps_coop_collab.sender_member,ps_coop_collab.kind,ps_coop_collab.content,ps_coop_collab.created_at;
END;$$;
REVOKE ALL ON FUNCTION public.ps_coop_post_collab(uuid,uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ps_coop_post_collab(uuid,uuid,uuid,text,text) TO service_role;
