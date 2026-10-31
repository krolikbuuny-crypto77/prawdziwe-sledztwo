-- RC35.1: Private text chat for participants in the SAME co-op room.
-- Run AFTER 004_coop_rooms.sql. No AI access, no public/anon REST access.
CREATE TABLE IF NOT EXISTS public.ps_coop_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.ps_coop_rooms(room_id) ON DELETE CASCADE,
  sender_member uuid NOT NULL,
  client_message_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 600),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, sender_member, client_message_id)
);
CREATE INDEX IF NOT EXISTS ps_coop_messages_room_idx ON public.ps_coop_messages(room_id, id DESC);
CREATE INDEX IF NOT EXISTS ps_coop_messages_rate_idx ON public.ps_coop_messages(room_id, sender_member, created_at DESC);
ALTER TABLE public.ps_coop_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ps_coop_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.ps_coop_messages TO service_role;

-- Lock per sender to prevent racing concurrent requests around the rate limit.
-- Idempotent retries reuse client_message_id and return the same row.
CREATE OR REPLACE FUNCTION public.ps_coop_send_chat(
 p_room_id uuid, p_member_id uuid, p_client_message_id uuid, p_content text
) RETURNS TABLE(id bigint, sender_member uuid, content text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE previous public.ps_coop_messages%ROWTYPE;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(p_room_id::text), hashtext(p_member_id::text));
 IF NOT EXISTS (
    SELECT 1 FROM public.ps_coop_rooms r WHERE r.room_id = p_room_id
     AND p_member_id IN (r.owner_member, r.guest_member)
 ) THEN RAISE EXCEPTION 'chat_not_member'; END IF;
 IF p_content IS NULL OR char_length(btrim(p_content)) < 1 OR char_length(p_content) > 600 THEN
    RAISE EXCEPTION 'chat_invalid_content'; END IF;
 SELECT m.* INTO previous FROM public.ps_coop_messages m
   WHERE m.room_id=p_room_id AND m.sender_member=p_member_id AND m.client_message_id=p_client_message_id;
 IF FOUND THEN
    RETURN QUERY SELECT previous.id,previous.sender_member,previous.content,previous.created_at;
    RETURN;
 END IF;
 IF EXISTS (SELECT 1 FROM public.ps_coop_messages m WHERE m.room_id=p_room_id AND m.sender_member=p_member_id
   AND m.created_at > now()-interval '1 second') THEN
    RAISE EXCEPTION 'chat_rate_limited'; END IF;
 IF (SELECT count(*) FROM public.ps_coop_messages m WHERE m.room_id=p_room_id AND m.sender_member=p_member_id
    AND m.created_at > now()-interval '1 minute') >= 20 THEN
    RAISE EXCEPTION 'chat_rate_limited'; END IF;
 RETURN QUERY
  INSERT INTO public.ps_coop_messages(room_id,sender_member,client_message_id,content)
  VALUES(p_room_id,p_member_id,p_client_message_id,btrim(p_content))
  RETURNING ps_coop_messages.id,ps_coop_messages.sender_member,
    ps_coop_messages.content,ps_coop_messages.created_at;
END;
$$;
REVOKE ALL ON FUNCTION public.ps_coop_send_chat(uuid,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ps_coop_send_chat(uuid,uuid,uuid,text) TO service_role;
