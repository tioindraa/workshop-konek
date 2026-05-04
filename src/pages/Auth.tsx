import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Email tidak valid" }),
});

const PERIZINAN_OPTIONS = ["NIB", "PIRT", "Halal", "Merek", "BPOM", "Lainnya"];
const MEDIA_OPTIONS = ["Whatsapp", "Facebook", "Tiktok", "Instagram", "Marketplace", "Lainnya"];

const initialSignup = {
  fullName: "",
  nik: "",
  bidangUsaha: "",
  phone: "",
  email: "",
  desa: "",
  kecamatan: "",
  alamatLengkap: "",
  namaUsaha: "",
  produkDihasilkan: "",
  tahunBerdiri: "",
  perizinan: [] as string[],
  bantuanFasilitasi: "",
  kegiatanDinasPernah: "",
  kegiatanDinasSekarang: "",
  paguyuban: "",
  modalAwal: "",
  jumlahTenagaKerja: "",
  kapasitasProduksi: "",
  hargaPerUnit: "",
  mediaPemasaranOnline: [] as string[],
  daerahPemasaranOffline: "",
  jumlahPenjualan: "",
  kesulitanUsaha: "",
  pelatihanDiharapkan: "",
  aksesPermodalan: "",
  infoEkspor: "",
  password: "",
  confirmPassword: "",
};

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const loginType = searchParams.get("type") === "admin" ? "admin" : "user";

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "otp">("email");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [signup, setSignup] = useState(initialSignup);

  const updateSignup = (key: keyof typeof initialSignup, value: any) =>
    setSignup((prev) => ({ ...prev, [key]: value }));

  const toggleArray = (key: "perizinan" | "mediaPemasaranOnline", value: string) => {
    setSignup((prev) => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/workshops");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/workshops");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = loginSchema.parse({ email: loginEmail, password: loginPassword });
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });
      if (error) {
        if (error.message.includes("Invalid login credentials")) toast.error("Email atau password salah");
        else toast.error(error.message);
        return;
      }
      if (loginType === "admin" && data.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .single();
        if (!roleData) {
          await supabase.auth.signOut();
          toast.error("Anda tidak memiliki akses admin");
          return;
        }
        navigate("/admin");
      } else {
        toast.success("Login berhasil!");
        navigate("/workshops");
      }
    } catch (error) {
      if (error instanceof z.ZodError) toast.error(error.errors[0].message);
      else toast.error("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signup.fullName.trim().length < 3) return toast.error("Nama minimal 3 karakter");
    if (!/^\S+@\S+\.\S+$/.test(signup.email)) return toast.error("Email tidak valid");
    if (signup.password.length < 6) return toast.error("Password minimal 6 karakter");
    if (signup.password !== signup.confirmPassword) return toast.error("Password tidak cocok");

    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: signup.email,
        password: signup.password,
        options: {
          emailRedirectTo: `${window.location.origin}/workshops`,
          data: { full_name: signup.fullName, phone_number: signup.phone },
        },
      });
      if (error) {
        if (error.message.includes("already registered")) toast.error("Email sudah terdaftar");
        else toast.error(error.message);
        return;
      }

      if (data.user) {
        await supabase.from("profiles").update({
          full_name: signup.fullName,
          phone_number: signup.phone,
          nik: signup.nik,
          bidang_usaha: signup.bidangUsaha,
          desa: signup.desa,
          kecamatan: signup.kecamatan,
          alamat_lengkap: signup.alamatLengkap,
          nama_usaha: signup.namaUsaha,
          produk_dihasilkan: signup.produkDihasilkan,
          tahun_berdiri: signup.tahunBerdiri,
          perizinan: signup.perizinan,
          bantuan_fasilitasi: signup.bantuanFasilitasi,
          kegiatan_dinas_pernah: signup.kegiatanDinasPernah,
          kegiatan_dinas_sekarang: signup.kegiatanDinasSekarang,
          paguyuban: signup.paguyuban,
          modal_awal: signup.modalAwal,
          jumlah_tenaga_kerja: signup.jumlahTenagaKerja,
          kapasitas_produksi: signup.kapasitasProduksi,
          harga_per_unit: signup.hargaPerUnit,
          media_pemasaran_online: signup.mediaPemasaranOnline,
          daerah_pemasaran_offline: signup.daerahPemasaranOffline,
          jumlah_penjualan: signup.jumlahPenjualan,
          kesulitan_usaha: signup.kesulitanUsaha,
          pelatihan_diharapkan: signup.pelatihanDiharapkan,
          akses_permodalan: signup.aksesPermodalan,
          info_ekspor: signup.infoEkspor,
        }).eq("id", data.user.id);
      }

      toast.success("Registrasi berhasil! Silakan login.");
      setActiveTab("login");
      setSignup(initialSignup);
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = forgotPasswordSchema.parse({ email: forgotEmail });
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Email reset password telah dikirim!");
      setForgotEmail("");
    } catch (error) {
      if (error instanceof z.ZodError) toast.error(error.errors[0].message);
      else toast.error("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const field = (label: string, key: keyof typeof initialSignup, type: "text" | "textarea" | "number" = "text", placeholder = "") => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {type === "textarea" ? (
        <Textarea
          value={signup[key] as string}
          onChange={(e) => updateSignup(key, e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
        />
      ) : (
        <Input
          type={type}
          value={signup[key] as string}
          onChange={(e) => updateSignup(key, e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl my-8">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Kembali
            </Button>
          </div>
          <div>
            <CardTitle className="text-2xl text-center">
              {loginType === "admin" ? "Admin Portal" : "Portal Workshop"}
            </CardTitle>
            <CardDescription className="text-center mt-2">
              {activeTab === "login" && (loginType === "admin" ? "Masuk sebagai admin" : "Masuk ke akun Anda")}
              {activeTab === "signup" && "Buat akun baru"}
              {activeTab === "forgot" && "Reset password Anda"}
            </CardDescription>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {loginType !== "admin" && activeTab !== "forgot" && (
            <div className="flex justify-center px-6 mb-6">
              <TabsList className="inline-flex bg-transparent p-0 h-auto gap-3">
                <TabsTrigger
                  value="login"
                  className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border data-[state=active]:border-primary px-8 py-2.5 text-sm font-medium transition-all"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border data-[state=active]:border-primary px-8 py-2.5 text-sm font-medium transition-all"
                >
                  Daftar
                </TabsTrigger>
              </TabsList>
            </div>
          )}

          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="nama@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => setActiveTab("forgot")}
                    >
                      Lupa Password?
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Masuk
                </Button>
              </CardContent>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                {field("Nama Pemilik (sesuai KTP)", "fullName")}
                {field("NIK", "nik")}
                {field("Bidang Usaha", "bidangUsaha", "text", "Kuliner / Fashion / Kerajinan / Jasa / Agribisnis / Perdagangan Besar / Lainnya")}
                {field("No. Telp / WA", "phone")}
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={signup.email}
                    onChange={(e) => updateSignup("email", e.target.value)}
                    placeholder="nama@example.com"
                    disabled={isLoading}
                    required
                  />
                </div>
                {field("Desa", "desa")}
                {field("Kecamatan", "kecamatan")}
                {field("Alamat Lengkap", "alamatLengkap", "textarea")}
                {field("Nama Usaha / Merek", "namaUsaha")}
                {field("Produk yang Dihasilkan", "produkDihasilkan")}
                {field("Tahun Berdiri Usaha", "tahunBerdiri")}

                <div className="space-y-2">
                  <Label>Perizinan yang Dimiliki</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PERIZINAN_OPTIONS.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={signup.perizinan.includes(opt)}
                          onCheckedChange={() => toggleArray("perizinan", opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                {field("Bantuan / Fasilitasi yang Sudah Diperoleh", "bantuanFasilitasi", "textarea")}
                {field("Kegiatan Dinas yang Pernah Diikuti (Pelatihan, Pameran, dll)", "kegiatanDinasPernah", "textarea")}
                {field("Kegiatan Dinas yang Diikuti Sekarang", "kegiatanDinasSekarang", "textarea")}
                {field("Paguyuban yang Diikuti Sekarang", "paguyuban")}
                {field("Modal Awal / Aset (tidak termasuk tanah dan bangunan)", "modalAwal", "text", "Rp.")}
                {field("Jumlah Tenaga Kerja", "jumlahTenagaKerja", "text", "Orang")}
                {field("Kapasitas Produksi Per Bulan", "kapasitasProduksi", "text", "Pcs / unit / Kg")}
                {field("Harga per Unit / Pcs / Kg", "hargaPerUnit", "text", "Rp.")}

                <div className="space-y-2">
                  <Label>Media Pemasaran Online</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {MEDIA_OPTIONS.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={signup.mediaPemasaranOnline.includes(opt)}
                          onCheckedChange={() => toggleArray("mediaPemasaranOnline", opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                {field("Daerah Pemasaran Offline (sebutkan)", "daerahPemasaranOffline", "textarea")}
                {field("Jumlah Penjualan / Omzet per Bulan", "jumlahPenjualan")}
                {field("Kesulitan yang Dihadapi dalam Menjalankan Usaha", "kesulitanUsaha", "textarea")}
                {field("Pelatihan dan Fasilitasi yang Diharapkan", "pelatihanDiharapkan", "textarea")}
                {field("Akses Permodalan / Pembiayaan yang Sudah Pernah Didapat (misal KUR)", "aksesPermodalan", "textarea")}
                {field("Apakah Produk Anda Sudah Pernah Melakukan Ekspor? (sebutkan negara apabila sudah)", "infoEkspor", "textarea")}

                <div className="space-y-2 pt-4 border-t">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••"
                    value={signup.password}
                    onChange={(e) => updateSignup("password", e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Konfirmasi Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••"
                    value={signup.confirmPassword}
                    onChange={(e) => updateSignup("confirmPassword", e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Daftar
                </Button>
              </CardContent>
            </form>
          </TabsContent>

          <TabsContent value="forgot">
            <form onSubmit={handleForgotPassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="nama@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Kirim Email Reset
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setActiveTab("login")}
                >
                  Kembali ke Login
                </Button>
              </CardContent>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
