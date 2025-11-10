import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

interface WorkshopCardProps {
  workshop: Workshop;
  isRegistered?: boolean;
  onRegisterSuccess?: () => void;
}

const WorkshopCard = ({ workshop, isRegistered = false, onRegisterSuccess }: WorkshopCardProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const isFull = workshop.registered_count >= workshop.capacity;

  const handleRegister = async () => {
    if (isRegistered) {
      toast.info("Anda sudah terdaftar di workshop ini");
      return;
    }

    if (isFull) {
      toast.error("Maaf, kuota workshop sudah penuh");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Silakan login terlebih dahulu");
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("registrations")
        .insert({
          user_id: user.id,
          workshop_id: workshop.id,
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("Anda sudah terdaftar di workshop ini");
        } else {
          toast.error("Gagal mendaftar workshop");
        }
        return;
      }

      toast.success("Berhasil mendaftar workshop!");
      
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
      
      navigate("/thank-you");
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col transition-all hover:shadow-[var(--shadow-hover)] hover:-translate-y-1">
      <CardHeader>
        <div className="flex justify-between items-start gap-2 mb-2">
          <CardTitle className="text-xl line-clamp-2">{workshop.title}</CardTitle>
          {isRegistered && (
            <Badge variant="secondary" className="shrink-0">
              Terdaftar
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-3">
          {workshop.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="flex items-start gap-2 text-sm">
          <Calendar className="w-4 h-4 mt-0.5 text-primary shrink-0" />
          <div>
            <p className="font-medium">
              {format(new Date(workshop.start_date), "EEEE, d MMMM yyyy", { locale: id })}
            </p>
            <p className="text-muted-foreground text-xs">
              {format(new Date(workshop.start_date), "HH:mm", { locale: id })} - {format(new Date(workshop.end_date), "HH:mm", { locale: id })} WIB
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
          <p className="text-muted-foreground">{workshop.location}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-primary" />
          <p className="text-muted-foreground">
            {workshop.registered_count} / {workshop.capacity} peserta
          </p>
          {isFull && (
            <Badge variant="destructive" className="ml-auto text-xs">
              Penuh
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleRegister} 
          className="w-full"
          disabled={isLoading || isRegistered || isFull}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isRegistered ? "Sudah Terdaftar" : isFull ? "Kuota Penuh" : "Daftar Sekarang"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WorkshopCard;
