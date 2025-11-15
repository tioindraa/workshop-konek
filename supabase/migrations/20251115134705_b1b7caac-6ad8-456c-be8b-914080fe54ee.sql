-- Fix search_path for security
DROP FUNCTION IF EXISTS public.increment_workshop_count() CASCADE;
DROP FUNCTION IF EXISTS public.decrement_workshop_count() CASCADE;

CREATE OR REPLACE FUNCTION public.increment_workshop_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.workshops
  SET registered_count = registered_count + 1
  WHERE id = NEW.workshop_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_workshop_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.workshops
  SET registered_count = registered_count - 1
  WHERE id = OLD.workshop_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER increment_workshop_registered
AFTER INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.increment_workshop_count();

CREATE TRIGGER decrement_workshop_registered
AFTER DELETE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.decrement_workshop_count();