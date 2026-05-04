-- 1. Remove sensitive tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
ALTER PUBLICATION supabase_realtime DROP TABLE public.registrations;

-- 2. Workshop capacity race condition: lock + check
CREATE OR REPLACE FUNCTION public.increment_workshop_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cur_capacity INTEGER;
  cur_count INTEGER;
BEGIN
  SELECT capacity, registered_count INTO cur_capacity, cur_count
  FROM public.workshops
  WHERE id = NEW.workshop_id
  FOR UPDATE;

  IF cur_count >= cur_capacity THEN
    RAISE EXCEPTION 'Workshop sudah penuh';
  END IF;

  UPDATE public.workshops
  SET registered_count = registered_count + 1
  WHERE id = NEW.workshop_id;

  RETURN NEW;
END;
$$;

-- 3. user_roles - block all client-side mutations
CREATE POLICY "No client inserts on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "No client updates on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO anon, authenticated
USING (false);

CREATE POLICY "No client deletes on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO anon, authenticated
USING (false);

-- 4. Revoke EXECUTE on SECURITY DEFINER functions from public roles
REVOKE EXECUTE ON FUNCTION public.increment_workshop_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.decrement_workshop_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated, public;

-- 5. Storage: drop broad SELECT on workshop-images (public CDN URLs still work)
DROP POLICY IF EXISTS "Workshop images are publicly accessible" ON storage.objects;