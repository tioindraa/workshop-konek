import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, MapPin, Award, Shield } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">Portal Workshop UMKM</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/auth?type=admin")}
            className="gap-2"
          >
            <Shield className="w-4 h-4" />
            Login Admin
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-r from-primary/90 to-primary/70">
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
            Workshop UMKM
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            Pendaftaran Workshop Kabupaten Kediri
          </p>
          <p className="text-lg text-white/80 mb-12 max-w-xl mx-auto">
            Tingkatkan keterampilan dan kembangkan bisnis UMKM Anda melalui workshop berkualitas
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Daftar Sekarang!
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">
            Mengapa Bergabung dengan Workshop Kami?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-card-foreground">Jadwal Fleksibel</h3>
              <p className="text-muted-foreground">
                Berbagai pilihan waktu workshop yang disesuaikan dengan kesibukan Anda
              </p>
            </div>

            <div className="bg-card p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-card-foreground">Mentor Berpengalaman</h3>
              <p className="text-muted-foreground">
                Dibimbing langsung oleh praktisi dan ahli di bidangnya
              </p>
            </div>

            <div className="bg-card p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-card-foreground">Lokasi Strategis</h3>
              <p className="text-muted-foreground">
                Tempat workshop yang mudah dijangkau di berbagai lokasi
              </p>
            </div>

            <div className="bg-card p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-card-foreground">Sertifikat Resmi</h3>
              <p className="text-muted-foreground">
                Dapatkan sertifikat untuk setiap workshop yang Anda ikuti
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Siap Mengembangkan UMKM Anda?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Jangan lewatkan kesempatan untuk meningkatkan kemampuan dan memperluas jaringan bisnis Anda
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 rounded-full shadow-lg"
          >
            Mulai Daftar Sekarang
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Portal Workshop UMKM Kabupaten Kediri. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
