"use client";

import { Competition } from "@/features/competitions/data/types";
import { Participant } from "@/features/participants/data/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { Trophy, QrCode, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface Props {
  competitions: Competition[];
  participants: Participant[];
}

function getGridClass(length: number) {
  if (length === 1) return "grid-cols-1 md:grid-cols-1 lg:grid-cols-1";
  if (length === 2) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-2";
  if (length === 3) return "grid-cols-1 md:grid-cols-3 lg:grid-cols-3";
  if (length === 4) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-2";
  return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
}

export function ReceptionistDashboard({ competitions, participants }: Props) {
  const router = useRouter();
  const params = useParams<{ userId: string }>();

  if (competitions.length === 0) {
    return (
      <div className="space-y-6 pb-10">
        <PageHeader title="Receptionist Dashboard" />
        <div className="flex flex-col items-center justify-center p-12 bg-muted/20 border rounded-xl border-dashed">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground text-center">
            Anda belum ditugaskan sebagai Receptionist di kompetisi mana pun.
          </p>
        </div>
      </div>
    );
  }

  const progressData = competitions.map(comp => {
    const compParts = participants.filter(p => p.competition_id === comp.id);

    // Group participants by category
    const categoriesMap = new Map<string, Participant[]>();
    compParts.forEach(p => {
      const cat = p.category || 'Umum';
      if (!categoriesMap.has(cat)) {
        categoriesMap.set(cat, []);
      }
      categoriesMap.get(cat)!.push(p);
    });

    const categories = Array.from(categoriesMap.entries()).map(([catName, parts]) => {
      const total = parts.length;
      const checkedIn = parts.filter(p => p.is_present).length;
      const pending = total - checkedIn;
      const progressPerc = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

      return {
        name: catName,
        total,
        checkedIn,
        pending,
        progressPerc
      };
    });

    // Sort categories based on custom order (TK -> Mahasiswa)
    const categoryOrder = ["TK", "SD/MI", "SMP/MTs", "SMA/SMK/MA", "Mahasiswa"];
    categories.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.name);
      const indexB = categoryOrder.indexOf(b.name);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    const total = categories.reduce((sum, c) => sum + c.total, 0);
    const checkedIn = categories.reduce((sum, c) => sum + c.checkedIn, 0);
    const progressPerc = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    // Use final_end_date or created_at for the date display
    const dateStr = comp.final_end_date || comp.registration_end_date || comp.created_at;
    const formattedDate = new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return {
      competition: comp,
      categories,
      total,
      checkedIn,
      pending: total - checkedIn,
      progressPerc,
      formattedDate
    };
  });

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Dashboard"
      />

      <div className="space-y-6">
        {progressData.map((data) => (
          <Card key={data.competition.id} className="w-full overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <CardTitle className="text-xl">{data.competition.name}</CardTitle>
                </div>
                <CardDescription className="flex items-center gap-1.5 text-sm">
                  <Calendar className="h-4 w-4" />
                  {data.formattedDate}
                </CardDescription>
              </div>
              <Button
                className="gap-2 shrink-0"
                onClick={() => router.push(`/${params?.userId}/competitions/${data.competition.id}`)}
              >
                <QrCode className="h-4 w-4" />
                Scan
              </Button>
            </CardHeader>
            <CardContent className="p-6">

              {data.categories.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground border rounded-lg border-dashed">
                  Belum ada peserta untuk kompetisi ini.
                </div>
              ) : (
                <div className={`grid gap-4 ${getGridClass(data.categories.length)}`}>
                  {data.categories.map(cat => (
                    <Card key={cat.name} className="flex flex-col border shadow-none bg-background/50 hover:bg-muted/10 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-center line-clamp-1" title={cat.name}>
                          {cat.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col space-y-4 pb-4">
                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-2 text-center divide-x">
                          <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total</p>
                            <p className="text-lg font-bold">{cat.total}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Check In</p>
                            <p className="text-lg font-bold text-emerald-600">{cat.checkedIn}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider">Belum</p>
                            <p className="text-lg font-bold text-rose-500">{cat.pending}</p>
                          </div>
                        </div>

                        {/* Progress Bar Chart */}
                        <div className="space-y-1.5 mt-auto pt-2">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">Progres Kehadiran</span>
                            <span className={cat.progressPerc === 100 ? "text-emerald-600" : ""}>{cat.progressPerc}%</span>
                          </div>
                          <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${cat.progressPerc}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
