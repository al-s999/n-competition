"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/context";

export default function PublicRegistrationPage() {
  const params = useParams();
  const competitionId = typeof params?.id === "string" ? params.id : "";
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulasi API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
    }, 1000);
  };

  if (success) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center py-8">
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">Pendaftaran Berhasil!</CardTitle>
            <CardDescription>
              Silakan periksa email Anda untuk instruksi pembayaran.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push("/")}>Kembali ke Beranda</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Daftar Kompetisi</CardTitle>
          <CardDescription>
            Isi formulir di bawah untuk mendaftar ke kompetisi ini.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Fullname</Label>
              <Input 
                id="name" 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Kontak</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Memproses..." : "Daftar Sekarang"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
