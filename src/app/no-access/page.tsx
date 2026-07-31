"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context";

export default function NoAccessPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-bold">Tidak Ada Akses</h1>
      <p className="text-muted-foreground">
        Anda saat ini tidak terdaftar sebagai anggota atau panitia di kompetisi aktif mana pun.
      </p>
      <Button onClick={handleLogout} variant="outline">
        Kembali ke Login
      </Button>
    </div>
  );
}
