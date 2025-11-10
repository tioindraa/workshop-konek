import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const ThankYou = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate("/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-card)] text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-secondary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Pendaftaran Berhasil!
          </CardTitle>
          <CardDescription>
            Terima kasih telah mendaftar workshop
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Anda telah berhasil mendaftar workshop. Informasi lebih lanjut akan dikirimkan melalui email.
          </p>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-1">Langkah Selanjutnya:</p>
            <ul className="text-sm text-muted-foreground text-left space-y-1">
              <li>• Cek email untuk konfirmasi pendaftaran</li>
              <li>• Simpan tanggal dan lokasi workshop</li>
              <li>• Datang tepat waktu pada hari pelaksanaan</li>
            </ul>
          </div>
          <Button onClick={() => navigate("/")} className="w-full">
            Kembali ke Daftar Workshop
          </Button>
          <p className="text-xs text-muted-foreground">
            Halaman akan otomatis kembali dalam 5 detik...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThankYou;
