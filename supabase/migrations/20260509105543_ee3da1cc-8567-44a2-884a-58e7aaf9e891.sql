CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.profiles (
    id, full_name, phone_number, nik, bidang_usaha,
    desa, kecamatan, alamat_lengkap, nama_usaha, produk_dihasilkan,
    tahun_berdiri, perizinan, bantuan_fasilitasi, kegiatan_dinas_pernah,
    kegiatan_dinas_sekarang, paguyuban, modal_awal, jumlah_tenaga_kerja,
    kapasitas_produksi, harga_per_unit, media_pemasaran_online,
    daerah_pemasaran_offline, jumlah_penjualan, kesulitan_usaha,
    pelatihan_diharapkan, akses_permodalan, info_ekspor
  ) VALUES (
    NEW.id,
    COALESCE(m->>'full_name', ''),
    COALESCE(m->>'phone_number', ''),
    NULLIF(m->>'nik',''),
    NULLIF(m->>'bidang_usaha',''),
    NULLIF(m->>'desa',''),
    NULLIF(m->>'kecamatan',''),
    NULLIF(m->>'alamat_lengkap',''),
    NULLIF(m->>'nama_usaha',''),
    NULLIF(m->>'produk_dihasilkan',''),
    NULLIF(m->>'tahun_berdiri',''),
    CASE WHEN m ? 'perizinan' THEN ARRAY(SELECT jsonb_array_elements_text(m->'perizinan')) ELSE NULL END,
    NULLIF(m->>'bantuan_fasilitasi',''),
    NULLIF(m->>'kegiatan_dinas_pernah',''),
    NULLIF(m->>'kegiatan_dinas_sekarang',''),
    NULLIF(m->>'paguyuban',''),
    NULLIF(m->>'modal_awal',''),
    NULLIF(m->>'jumlah_tenaga_kerja',''),
    NULLIF(m->>'kapasitas_produksi',''),
    NULLIF(m->>'harga_per_unit',''),
    CASE WHEN m ? 'media_pemasaran_online' THEN ARRAY(SELECT jsonb_array_elements_text(m->'media_pemasaran_online')) ELSE NULL END,
    NULLIF(m->>'daerah_pemasaran_offline',''),
    NULLIF(m->>'jumlah_penjualan',''),
    NULLIF(m->>'kesulitan_usaha',''),
    NULLIF(m->>'pelatihan_diharapkan',''),
    NULLIF(m->>'akses_permodalan',''),
    NULLIF(m->>'info_ekspor','')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    nik = EXCLUDED.nik,
    bidang_usaha = EXCLUDED.bidang_usaha,
    desa = EXCLUDED.desa,
    kecamatan = EXCLUDED.kecamatan,
    alamat_lengkap = EXCLUDED.alamat_lengkap,
    nama_usaha = EXCLUDED.nama_usaha,
    produk_dihasilkan = EXCLUDED.produk_dihasilkan,
    tahun_berdiri = EXCLUDED.tahun_berdiri,
    perizinan = EXCLUDED.perizinan,
    bantuan_fasilitasi = EXCLUDED.bantuan_fasilitasi,
    kegiatan_dinas_pernah = EXCLUDED.kegiatan_dinas_pernah,
    kegiatan_dinas_sekarang = EXCLUDED.kegiatan_dinas_sekarang,
    paguyuban = EXCLUDED.paguyuban,
    modal_awal = EXCLUDED.modal_awal,
    jumlah_tenaga_kerja = EXCLUDED.jumlah_tenaga_kerja,
    kapasitas_produksi = EXCLUDED.kapasitas_produksi,
    harga_per_unit = EXCLUDED.harga_per_unit,
    media_pemasaran_online = EXCLUDED.media_pemasaran_online,
    daerah_pemasaran_offline = EXCLUDED.daerah_pemasaran_offline,
    jumlah_penjualan = EXCLUDED.jumlah_penjualan,
    kesulitan_usaha = EXCLUDED.kesulitan_usaha,
    pelatihan_diharapkan = EXCLUDED.pelatihan_diharapkan,
    akses_permodalan = EXCLUDED.akses_permodalan,
    info_ekspor = EXCLUDED.info_ekspor;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();