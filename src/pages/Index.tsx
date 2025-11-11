import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LogOut, Search, Calendar } from "lucide-react";
import { toast } from "sonner";
import WorkshopCard from "@/components/WorkshopCard";
import { User, Session } from "@supabase/supabase-js";

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

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [filteredWorkshops, setFilteredWorkshops] = useState<Workshop[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [registeredWorkshopIds, setRegisteredWorkshopIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchWorkshops();
      fetchRegistrations();
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    filterWorkshops();
  }, [searchQuery, workshops]);

  const fetchWorkshops = async () => {
    try {
      const { data, error } = await supabase
        .from("workshops")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) throw error;

      setWorkshops(data || []);
    } catch (error) {
      toast.error("Gagal memuat daftar workshop");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("registrations")
        .select("workshop_id")
        .eq("user_id", user.id);

      if (error) throw error;

      const ids = new Set(data?.map((reg) => reg.workshop_id) || []);
      setRegisteredWorkshopIds(ids);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    }
  };

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!data);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const filterWorkshops = () => {
    if (!searchQuery.trim()) {
      setFilteredWorkshops(workshops);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = workshops.filter((workshop) => {
      const titleMatch = workshop.title.toLowerCase().includes(query);
      const dateMatch = new Date(workshop.start_date)
        .toLocaleDateString("id-ID")
        .includes(query);
      return titleMatch || dateMatch;
    });

    setFilteredWorkshops(filtered);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Gagal logout");
    } else {
      toast.success("Berhasil logout");
      navigate("/auth");
    }
  };

  const handleRegisterSuccess = () => {
    fetchWorkshops();
    fetchRegistrations();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Portal Workshop UMKM
              </h1>
              <p className="text-sm text-muted-foreground">
                Platform Pendaftaran Workshop Kabupaten
              </p>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Button onClick={() => navigate("/admin")} variant="outline" size="sm">
                  Admin Panel
                </Button>
              )}
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">
              Selamat Datang, {user?.user_metadata?.full_name || "Peserta"}!
            </h2>
            <p className="text-primary-foreground/90 max-w-2xl mx-auto">
              Tingkatkan kemampuan usaha Anda dengan mengikuti workshop-workshop berkualitas yang kami sediakan
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <Card className="p-4 mb-8 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari workshop berdasarkan judul atau tanggal (contoh: Digital Marketing, 15/12/2025)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </Card>

        {/* Workshop Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 text-center bg-primary/5 border-primary/20">
            <p className="text-3xl font-bold text-primary">{workshops.length}</p>
            <p className="text-sm text-muted-foreground">Total Workshop</p>
          </Card>
          <Card className="p-4 text-center bg-secondary/5 border-secondary/20">
            <p className="text-3xl font-bold text-secondary">{registeredWorkshopIds.size}</p>
            <p className="text-sm text-muted-foreground">Workshop Terdaftar</p>
          </Card>
          <Card className="p-4 text-center bg-accent/5 border-accent/20">
            <p className="text-3xl font-bold text-accent">
              {workshops.filter(w => new Date(w.start_date) > new Date()).length}
            </p>
            <p className="text-sm text-muted-foreground">Workshop Mendatang</p>
          </Card>
        </div>

        {/* Workshops Grid */}
        <div className="mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-semibold">
            Daftar Workshop Tersedia
          </h3>
        </div>

        {filteredWorkshops.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery
                ? "Tidak ada workshop yang sesuai dengan pencarian"
                : "Belum ada workshop tersedia"}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkshops.map((workshop) => (
              <WorkshopCard
                key={workshop.id}
                workshop={workshop}
                isRegistered={registeredWorkshopIds.has(workshop.id)}
                onRegisterSuccess={handleRegisterSuccess}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© 2025 Portal Workshop UMKM Kabupaten. Semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
