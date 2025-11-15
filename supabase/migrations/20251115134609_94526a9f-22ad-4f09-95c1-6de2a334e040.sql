-- Add triggers to auto-increment workshop registered_count
CREATE OR REPLACE FUNCTION public.increment_workshop_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.workshops
  SET registered_count = registered_count + 1
  WHERE id = NEW.workshop_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.decrement_workshop_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.workshops
  SET registered_count = registered_count - 1
  WHERE id = OLD.workshop_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_workshop_registered
AFTER INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.increment_workshop_count();

CREATE TRIGGER decrement_workshop_registered
AFTER DELETE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.decrement_workshop_count();

-- Add address and city columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;