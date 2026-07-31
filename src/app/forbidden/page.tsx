"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-bold">Akses Ditolak (403)</h1>
      <p className="text-muted-foreground">
        Anda tidak memiliki peran (role) yang diizinkan untuk mengakses halaman ini.
      </p>
      <Button onClick={() => router.back()} variant="default">
        Kembali ke Halaman Sebelumnya
      </Button>
    </div>
  );
}
