-- Allow admins to view all profiles and registrations
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can view all registrations"
ON public.registrations FOR SELECT
TO authenticated
USING (public.is_admin());

-- Enable realtime
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.registrations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;