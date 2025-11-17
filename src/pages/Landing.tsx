import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-bg.jpg";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">SUCOCK</h1>
          <nav className="hidden md:flex gap-6">
            <button className="text-foreground hover:text-primary">Beranda</button>
            <button className="text-foreground hover:text-primary">Produk</button>
            <button className="text-foreground hover:text-primary">Tentang</button>
            <button className="text-foreground hover:text-primary">Kontak</button>
            <button className="text-foreground hover:text-primary">Daftar</button>
          </nav>
          <Button 
            variant="outline"
            onClick={() => navigate("/auth")}
          >
            Masuk
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="flex-1 relative bg-cover bg-center flex items-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl text-white">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">Sucock</h2>
            <p className="text-xl md:text-2xl mb-8">
              Dukung produk lokal dan temukan shuttlecock terbaik dari Sumengko di sini!
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-white text-primary hover:bg-white/90"
            >
              Daftar Sekarang!
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
