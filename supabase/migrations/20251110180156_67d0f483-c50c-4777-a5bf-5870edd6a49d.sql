-- Create workshops table
CREATE TABLE public.workshops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 30,
  registered_count INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  business_name TEXT,
  business_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create registrations table
CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'confirmed',
  UNIQUE(user_id, workshop_id)
);

-- Enable Row Level Security
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workshops (public read, admin write)
CREATE POLICY "Anyone can view workshops"
  ON public.workshops FOR SELECT
  USING (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for registrations
CREATE POLICY "Users can view their own registrations"
  ON public.registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own registrations"
  ON public.registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own registrations"
  ON public.registrations FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workshops_updated_at
  BEFORE UPDATE ON public.workshops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to increment registered_count when a registration is created
CREATE OR REPLACE FUNCTION public.increment_workshop_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.workshops
  SET registered_count = registered_count + 1
  WHERE id = NEW.workshop_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_registration_created
  AFTER INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_workshop_count();

-- Trigger to decrement registered_count when a registration is deleted
CREATE OR REPLACE FUNCTION public.decrement_workshop_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.workshops
  SET registered_count = registered_count - 1
  WHERE id = OLD.workshop_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_registration_deleted
  AFTER DELETE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_workshop_count();

-- Insert sample workshops
INSERT INTO public.workshops (title, description, start_date, end_date, location, capacity, image_url) VALUES
  ('Workshop Digital Marketing untuk UMKM', 'Pelajari strategi pemasaran digital untuk meningkatkan penjualan usaha Anda. Materi meliputi social media marketing, content creation, dan online advertising.', '2025-12-15 09:00:00+07', '2025-12-15 16:00:00+07', 'Aula Kantor Dinas Koperasi dan UMKM', 50, NULL),
  ('Pelatihan Manajemen Keuangan Usaha', 'Workshop praktis tentang pembukuan sederhana, pengelolaan arus kas, dan perencanaan keuangan untuk usaha mikro.', '2025-12-20 13:00:00+07', '2025-12-20 17:00:00+07', 'Gedung Serbaguna Kabupaten', 40, NULL),
  ('Workshop Desain Produk dan Kemasan', 'Belajar membuat desain produk dan kemasan yang menarik untuk meningkatkan daya saing produk UMKM Anda.', '2025-12-22 09:00:00+07', '2025-12-22 15:00:00+07', 'Balai Pelatihan Kewirausahaan', 35, NULL),
  ('Strategi Ekspor untuk Produk Lokal', 'Panduan lengkap memulai ekspor produk lokal ke pasar internasional, termasuk perizinan dan strategi pemasaran global.', '2026-01-05 08:00:00+07', '2026-01-05 17:00:00+07', 'Hotel Grand Ballroom', 60, NULL),
  ('Workshop E-commerce dan Marketplace', 'Cara efektif berjualan di platform e-commerce seperti Tokopedia, Shopee, dan Bukalapak untuk meningkatkan omzet.', '2026-01-10 10:00:00+07', '2026-01-10 16:00:00+07', 'Aula Kantor Dinas Koperasi dan UMKM', 45, NULL);