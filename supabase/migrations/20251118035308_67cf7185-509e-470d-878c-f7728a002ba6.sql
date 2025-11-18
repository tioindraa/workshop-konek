-- Create storage bucket for workshop images
INSERT INTO storage.buckets (id, name, public)
VALUES ('workshop-images', 'workshop-images', true);

-- Create RLS policies for workshop images bucket
CREATE POLICY "Anyone can view workshop images"
ON storage.objects FOR SELECT
USING (bucket_id = 'workshop-images');

CREATE POLICY "Admins can upload workshop images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workshop-images' 
  AND auth.uid() IS NOT NULL
  AND public.is_admin()
);

CREATE POLICY "Admins can update workshop images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'workshop-images'
  AND public.is_admin()
);

CREATE POLICY "Admins can delete workshop images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'workshop-images'
  AND public.is_admin()
);