import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit2, Trash2, LogOut, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface Workshop {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  capacity: number;
  registered_count: number;
  image_url: string | null;
}

interface WorkshopFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  capacity: number;
  image_url: string;
  image_file?: File | null;
}

interface Registrant {
  registration_id: string;
  workshop_id: string;
  workshop_title: string;
  registered_at: string;
  status: string;
  user_id: string;
  profile: any;
}

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [formData, setFormData] = useState<WorkshopFormData>({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    capacity: 30,
    image_url: "",
    image_file: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin === true) {
      fetchWorkshops();
      fetchRegistrants();

      const channel = supabase
        .channel("admin-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, () => fetchRegistrants())
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchRegistrants())
        .on("postgres_changes", { event: "*", schema: "public", table: "workshops" }, () => fetchWorkshops())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else if (isAdmin === false) {
      navigate("/");
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki akses ke halaman admin.",
        variant: "destructive",
      });
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;
      setIsAdmin(!!data);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("workshops")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      setWorkshops(data || []);
    } catch (error) {
      console.error("Error fetching workshops:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data workshop.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrants = async () => {
    try {
      const { data: regs, error } = await supabase
        .from("registrations")
        .select("id, workshop_id, registered_at, status, user_id, workshops(title)")
        .order("registered_at", { ascending: false });
      if (error) throw error;

      const userIds = Array.from(new Set((regs || []).map((r: any) => r.user_id)));
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("*").in("id", userIds);
        profilesMap = Object.fromEntries((profs || []).map((p: any) => [p.id, p]));
      }

      setRegistrants(
        (regs || []).map((r: any) => ({
          registration_id: r.id,
          workshop_id: r.workshop_id,
          workshop_title: r.workshops?.title || "-",
          registered_at: r.registered_at,
          status: r.status,
          user_id: r.user_id,
          profile: profilesMap[r.user_id] || {},
        }))
      );
    } catch (e) {
      console.error("Error fetching registrants:", e);
    }
  };

  const exportRegistrantsCSV = () => {
    if (registrants.length === 0) {
      toast({ title: "Tidak ada data", description: "Belum ada pendaftar untuk di-export.", variant: "destructive" });
      return;
    }
    const headers = [
      "Workshop", "Tanggal Daftar", "Status",
      "Nama Pemilik", "NIK", "Bidang Usaha", "No Telp/WA",
      "Desa", "Kecamatan", "Alamat Lengkap",
      "Nama Usaha", "Produk", "Tahun Berdiri", "Perizinan",
      "Bantuan/Fasilitasi", "Kegiatan Dinas Pernah", "Kegiatan Dinas Sekarang",
      "Paguyuban", "Modal Awal", "Tenaga Kerja", "Kapasitas Produksi",
      "Harga per Unit", "Media Pemasaran Online", "Daerah Pemasaran Offline",
      "Omzet/Bulan", "Kesulitan Usaha", "Pelatihan Diharapkan",
      "Akses Permodalan", "Info Ekspor",
    ];
    const escape = (v: any) => {
      const s = Array.isArray(v) ? v.join("; ") : v == null ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const rows = registrants.map((r) => {
      const p = r.profile || {};
      return [
        r.workshop_title, format(new Date(r.registered_at), "dd/MM/yyyy HH:mm"), r.status,
        p.full_name, p.nik, p.bidang_usaha, p.phone_number,
        p.desa, p.kecamatan, p.alamat_lengkap,
        p.nama_usaha, p.produk_dihasilkan, p.tahun_berdiri, p.perizinan,
        p.bantuan_fasilitasi, p.kegiatan_dinas_pernah, p.kegiatan_dinas_sekarang,
        p.paguyuban, p.modal_awal, p.jumlah_tenaga_kerja, p.kapasitas_produksi,
        p.harga_per_unit, p.media_pemasaran_online, p.daerah_pemasaran_offline,
        p.jumlah_penjualan, p.kesulitan_usaha, p.pelatihan_diharapkan,
        p.akses_permodalan, p.info_ekspor,
      ].map(escape).join(",");
    });
    const csv = "\ufeff" + [headers.map(escape).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pendaftar-workshop-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let imageUrl = formData.image_url;

      // Upload image if a file is selected
      if (formData.image_file) {
        const fileExt = formData.image_file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('workshop-images')
          .upload(filePath, formData.image_file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('workshop-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      if (editingWorkshop) {
        const { error } = await supabase
          .from("workshops")
          .update({
            title: formData.title,
            description: formData.description,
            start_date: formData.start_date,
            end_date: formData.end_date,
            location: formData.location,
            capacity: formData.capacity,
            image_url: imageUrl || null,
          })
          .eq("id", editingWorkshop.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Workshop berhasil diperbarui.",
        });
      } else {
        const { error } = await supabase.from("workshops").insert({
          title: formData.title,
          description: formData.description,
          start_date: formData.start_date,
          end_date: formData.end_date,
          location: formData.location,
          capacity: formData.capacity,
          image_url: imageUrl || null,
        });

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Workshop baru berhasil ditambahkan.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchWorkshops();
    } catch (error) {
      console.error("Error saving workshop:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan workshop.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus workshop ini?")) return;

    try {
      const { error } = await supabase.from("workshops").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Workshop berhasil dihapus.",
      });
      fetchWorkshops();
    } catch (error) {
      console.error("Error deleting workshop:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus workshop.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    setFormData({
      title: workshop.title,
      description: workshop.description,
      start_date: format(new Date(workshop.start_date), "yyyy-MM-dd'T'HH:mm"),
      end_date: format(new Date(workshop.end_date), "yyyy-MM-dd'T'HH:mm"),
      location: workshop.location,
      capacity: workshop.capacity,
      image_url: workshop.image_url || "",
      image_file: null,
    });
    setImagePreview(workshop.image_url || null);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingWorkshop(null);
    setFormData({
      title: "",
      description: "",
      start_date: "",
      end_date: "",
      location: "",
      capacity: 30,
      image_url: "",
      image_file: null,
    });
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image_file: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Admin Panel - Workshop Management</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="workshops" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="workshops">Workshop</TabsTrigger>
            <TabsTrigger value="registrants">Pendaftar ({registrants.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="workshops">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">Daftar Workshop</h2>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Workshop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingWorkshop ? "Edit Workshop" : "Tambah Workshop Baru"}
                </DialogTitle>
                <DialogDescription>
                  Isi form di bawah untuk {editingWorkshop ? "memperbarui" : "menambahkan"} workshop.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Judul Workshop</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Tanggal Mulai</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Tanggal Selesai</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Lokasi</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Kapasitas</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="image_file">Upload Gambar (opsional)</Label>
                  <Input
                    id="image_file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-md border"
                      />
                    </div>
                  )}
                  {editingWorkshop?.image_url && !imagePreview && (
                    <div className="mt-2">
                      <img 
                        src={editingWorkshop.image_url} 
                        alt="Current" 
                        className="w-full h-48 object-cover rounded-md border"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingWorkshop ? "Update" : "Tambah"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {workshops.map((workshop) => (
            <Card key={workshop.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{workshop.title}</CardTitle>
                    <CardDescription>{workshop.location}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(workshop)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(workshop.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{workshop.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Mulai:</span>{" "}
                    {format(new Date(workshop.start_date), "dd MMM yyyy, HH:mm")}
                  </div>
                  <div>
                    <span className="font-medium">Selesai:</span>{" "}
                    {format(new Date(workshop.end_date), "dd MMM yyyy, HH:mm")}
                  </div>
                  <div>
                    <span className="font-medium">Kapasitas:</span> {workshop.capacity}
                  </div>
                  <div>
                    <span className="font-medium">Terdaftar:</span> {workshop.registered_count}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {workshops.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Belum ada workshop. Klik "Tambah Workshop" untuk menambahkan.
              </CardContent>
            </Card>
          )}
        </div>
          </TabsContent>

          <TabsContent value="registrants">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-foreground">Database Pendaftar (Realtime)</h2>
              <Button onClick={exportRegistrantsCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Tanggal Daftar</TableHead>
                      <TableHead className="whitespace-nowrap">Workshop</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap">Nama Pemilik (KTP)</TableHead>
                      <TableHead className="whitespace-nowrap">NIK</TableHead>
                      <TableHead className="whitespace-nowrap">Bidang Usaha</TableHead>
                      <TableHead className="whitespace-nowrap">No Telp / WA</TableHead>
                      
                      <TableHead className="whitespace-nowrap">Desa</TableHead>
                      <TableHead className="whitespace-nowrap">Kecamatan</TableHead>
                      <TableHead className="whitespace-nowrap">Alamat Lengkap</TableHead>
                      <TableHead className="whitespace-nowrap">Nama Usaha / Merek</TableHead>
                      <TableHead className="whitespace-nowrap">Produk Dihasilkan</TableHead>
                      <TableHead className="whitespace-nowrap">Tahun Berdiri</TableHead>
                      <TableHead className="whitespace-nowrap">Perizinan</TableHead>
                      <TableHead className="whitespace-nowrap">Bantuan / Fasilitasi</TableHead>
                      <TableHead className="whitespace-nowrap">Kegiatan Dinas (Pernah)</TableHead>
                      <TableHead className="whitespace-nowrap">Kegiatan Dinas (Sekarang)</TableHead>
                      <TableHead className="whitespace-nowrap">Paguyuban</TableHead>
                      <TableHead className="whitespace-nowrap">Modal Awal</TableHead>
                      <TableHead className="whitespace-nowrap">Tenaga Kerja</TableHead>
                      <TableHead className="whitespace-nowrap">Kapasitas Produksi/Bulan</TableHead>
                      <TableHead className="whitespace-nowrap">Harga per Unit/Pcs/Kg</TableHead>
                      <TableHead className="whitespace-nowrap">Media Pemasaran Online</TableHead>
                      <TableHead className="whitespace-nowrap">Daerah Pemasaran Offline</TableHead>
                      <TableHead className="whitespace-nowrap">Omzet / Bulan</TableHead>
                      <TableHead className="whitespace-nowrap">Kesulitan Usaha</TableHead>
                      <TableHead className="whitespace-nowrap">Pelatihan Diharapkan</TableHead>
                      <TableHead className="whitespace-nowrap">Akses Permodalan</TableHead>
                      <TableHead className="whitespace-nowrap">Info Ekspor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrants.map((r) => {
                      const p = r.profile || {};
                      const fmt = (v: any) => {
                        if (v == null || v === "") return "-";
                        if (Array.isArray(v)) return v.length ? v.join(", ") : "-";
                        return String(v);
                      };
                      return (
                        <TableRow key={r.registration_id}>
                          <TableCell className="whitespace-nowrap">{format(new Date(r.registered_at), "dd/MM/yy HH:mm")}</TableCell>
                          <TableCell className="whitespace-nowrap">{r.workshop_title}</TableCell>
                          <TableCell className="whitespace-nowrap">{r.status}</TableCell>
                          <TableCell className="whitespace-nowrap">{fmt(p.full_name)}</TableCell>
                          <TableCell className="whitespace-nowrap">{fmt(p.nik)}</TableCell>
                          <TableCell className="whitespace-nowrap">{fmt(p.bidang_usaha)}</TableCell>
                          <TableCell className="whitespace-nowrap">{fmt(p.phone_number)}</TableCell>
                          
                          <TableCell className="whitespace-nowrap">{fmt(p.desa)}</TableCell>
                          <TableCell className="whitespace-nowrap">{fmt(p.kecamatan)}</TableCell>
                          <TableCell className="max-w-[260px] whitespace-normal">{fmt(p.alamat_lengkap)}</TableCell>
                          <TableCell className="whitespace-nowrap">{fmt(p.nama_usaha)}</TableCell>
                          <TableCell className="max-w-[220px] whitespace-normal">{fmt(p.produk_dihasilkan)}</TableCell>
                          <TableCell className="whitespace-nowrap">{fmt(p.tahun_berdiri)}</TableCell>
                          <TableCell className="max-w-[220px] whitespace-normal">{fmt(p.perizinan)}</TableCell>
                          <TableCell className="max-w-[220px] whitespace-normal">{fmt(p.bantuan_fasilitasi)}</TableCell>
                          <TableCell className="max-w-[220px] whitespace-normal">{fmt(p.kegiatan_dinas_pernah)}</TableCell>
                          <TableCell className="max-w-[220px] whitespace-normal">{fmt(p.kegiatan_dinas_sekarang)}</TableCell>
                          <TableCell className="max-w-[220px] whitespace-normal">{fmt(p.paguyuban)}</TableCell>
                          <TableCell className="whitespace-nowrap">{fmt(p.modal_awal)}</TableCell>
                          <TableCell className="whitespace-nowrap">{fmt(p.jumlah_tenaga_kerja)}</TableCell>
                          <TableCell className="whitespace-nowrap">{fmt(p.kapasitas_produksi)}</TableCell>
                          <TableCell className="whitespace-nowrap">{fmt(p.harga_per_unit)}</TableCell>
                          <TableCell className="max-w-[220px] whitespace-normal">{fmt(p.media_pemasaran_online)}</TableCell>
                          <TableCell className="max-w-[220px] whitespace-normal">{fmt(p.daerah_pemasaran_offline)}</TableCell>
                          <TableCell className="whitespace-nowrap">{fmt(p.jumlah_penjualan)}</TableCell>
                          <TableCell className="max-w-[260px] whitespace-normal">{fmt(p.kesulitan_usaha)}</TableCell>
                          <TableCell className="max-w-[260px] whitespace-normal">{fmt(p.pelatihan_diharapkan)}</TableCell>
                          <TableCell className="max-w-[220px] whitespace-normal">{fmt(p.akses_permodalan)}</TableCell>
                          <TableCell className="max-w-[220px] whitespace-normal">{fmt(p.info_ekspor)}</TableCell>
                        </TableRow>
                      );
                    })}
                    {registrants.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={30} className="text-center py-8 text-muted-foreground">
                          Belum ada pendaftar.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
