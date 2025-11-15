import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  full_name: z.string().trim().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter"),
  address: z.string().trim().min(5, "Alamat minimal 5 karakter").max(200, "Alamat maksimal 200 karakter"),
  city: z.string().min(1, "Silakan pilih kota/kabupaten"),
  phone_number: z.string().trim().min(10, "Nomor HP minimal 10 digit").max(15, "Nomor HP maksimal 15 digit").regex(/^[0-9]+$/, "Nomor HP hanya boleh berisi angka"),
});

type FormData = z.infer<typeof formSchema>;

interface RegistrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workshopId: string;
  workshopTitle: string;
  onSuccess: () => void;
}

const INDONESIAN_CITIES = [
  "Jakarta",
  "Surabaya",
  "Bandung",
  "Medan",
  "Semarang",
  "Makassar",
  "Palembang",
  "Tangerang",
  "Depok",
  "Bekasi",
  "Bogor",
  "Malang",
  "Yogyakarta",
  "Pontianak",
  "Balikpapan",
  "Banjarmasin",
  "Samarinda",
  "Jambi",
  "Pekanbaru",
  "Padang",
  "Manado",
  "Denpasar",
  "Mataram",
  "Kupang",
  "Jayapura",
  "Ambon",
  "Banda Aceh",
  "Bengkulu",
  "Lampung",
  "Serang",
  "Cilegon",
  "Sukabumi",
  "Cirebon",
  "Tasikmalaya",
  "Pekalongan",
  "Tegal",
  "Magelang",
  "Surakarta",
  "Kediri",
  "Blitar",
  "Probolinggo",
  "Pasuruan",
  "Mojokerto",
  "Madiun",
  "Batu",
  "Banyuwangi",
].sort();

const RegistrationForm = ({ open, onOpenChange, workshopId, workshopTitle, onSuccess }: RegistrationFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      address: "",
      city: "",
      phone_number: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Silakan login terlebih dahulu");
        return;
      }

      // Update profile with registration data
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          address: data.address,
          city: data.city,
          phone_number: data.phone_number,
        })
        .eq("id", user.id);

      if (profileError) {
        toast.error("Gagal menyimpan data profil");
        return;
      }

      // Create registration
      const { error: registrationError } = await supabase
        .from("registrations")
        .insert({
          user_id: user.id,
          workshop_id: workshopId,
        });

      if (registrationError) {
        if (registrationError.code === "23505") {
          toast.error("Anda sudah terdaftar di workshop ini");
        } else {
          toast.error("Gagal mendaftar workshop");
        }
        return;
      }

      toast.success("Berhasil mendaftar workshop!");
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Formulir Pendaftaran Workshop</DialogTitle>
          <DialogDescription>
            Lengkapi data diri Anda untuk mendaftar "{workshopTitle}"
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama lengkap" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Tinggal</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan alamat lengkap" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kota/Kabupaten</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kota/kabupaten" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {INDONESIAN_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor HP</FormLabel>
                  <FormControl>
                    <Input placeholder="08xxxxxxxxxx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Daftar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationForm;