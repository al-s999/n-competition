"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CompetitionService } from "@/features/competitions/data/service";
import { ParticipantService } from "@/features/participants/data/service";
import { MemberService } from "@/features/members/data/service";
import { Competition } from "@/features/competitions/data/types";
import { Participant } from "@/features/participants/data/types";
import { Users, Trophy, Layers, Wallet, BarChart3, Clock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/features/auth/context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReceptionistDashboard } from "./_components/receptionist-dashboard";

// DUMMY DATA
const dummyTopCategories = [
  { name: "SMP/MTs", participants: 1250, percentage: 80 },
  { name: "SMA/SMK/MA", participants: 850, percentage: 55 },
  { name: "SD", participants: 420, percentage: 30 },
];

const dummyTopSubjects = [
  { name: "IPA", participants: 600, percentage: 85 },
  { name: "Bahasa Inggris", participants: 450, percentage: 65 },
  { name: "IPS", participants: 300, percentage: 40 },
];

const dummyTopCountries = [
  { name: "Indonesia", participants: 2000, percentage: 95 },
  { name: "Malaysia", participants: 100, percentage: 15 },
  { name: "Singapura", participants: 50, percentage: 8 },
];

const dummyTopStates = [
  { name: "Jawa Timur", participants: 900, percentage: 80 },
  { name: "DKI Jakarta", participants: 600, percentage: 65 },
  { name: "Jawa Barat", participants: 350, percentage: 40 },
];

const dummyTopCities = [
  { name: "Surabaya", participants: 600, percentage: 90 },
  { name: "Jakarta Selatan", participants: 300, percentage: 60 },
  { name: "Malang", participants: 250, percentage: 45 },
];

const dummyTeamActivities = [
  { competition: "Olimpiade Sains 2026", action: "Mengubah jadwal final", who: "Manager", time: "10 menit yang lalu" },
  { competition: "Olimpiade Sains 2026", action: "Memverifikasi 15 absensi peserta", who: "Receptionist", time: "1 jam yang lalu" },
];

const dummyReceptionistProgress = [
  { competition: "Olimpiade Sains 2026", date: "24 Ags 2026", totalParticipants: 150, checkedIn: 120 },
  { competition: "kompetisi sains", date: "02 Sep 2026", totalParticipants: 100, checkedIn: 10 },
];

function HorizontalBarChart({ data }: { data: { name: string; participants: number; percentage: number }[] }) {
  return (
    <div className="space-y-4 py-2">
      <TooltipProvider>
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-4 group">
            <div className="w-28 text-right text-sm text-muted-foreground truncate" title={item.name}>
              {item.name}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1 h-6 cursor-pointer">
                  <div
                    className="h-full bg-emerald-500 rounded-sm transition-opacity group-hover:opacity-80"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">Total: {item.participants} peserta</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </TooltipProvider>
    </div>
  );
}

export default function GlobalDashboardPage() {
  const { user } = useAuth();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReceptionist, setIsReceptionist] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      let comps: Competition[] = [];
      let receptionistFlag = false;

      if (user.role === "competition") {
        comps = await CompetitionService.getCompetitionsByOwner(user.id);
      } else {
        const members = await MemberService.getMembersByUser(user.id);
        const compIds = members
          .filter(m => m.role === "MANAGER" || m.role === "RECEPTIONIST" || m.role === "MC")
          .map(m => m.competition_id);
        
        if (members.length > 0 && members.every(m => m.role === "RECEPTIONIST")) {
          receptionistFlag = true;
        } else if (members.some(m => m.role === "RECEPTIONIST") && members.every(m => m.role !== "MANAGER")) {
           // If they are receptionist and mc, maybe they want the receptionist view?
           receptionistFlag = true;
        }

        // Remove duplicates if any
        const uniqueIds = Array.from(new Set(compIds));
        
        const allComps = await Promise.all(uniqueIds.map(id => CompetitionService.getCompetitionById(id)));
        comps = allComps.filter(Boolean) as Competition[];
      }

      const partsArrays = await Promise.all(
        comps.map(comp => ParticipantService.getParticipantsByCompetition(comp.id))
      );
      const allParts = partsArrays.flat();

      setCompetitions(comps);
      setParticipants(allParts);
      setIsReceptionist(receptionistFlag);
      setIsLoading(false);
    }
    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const activeCompetitions = competitions.filter(c => c.status !== "finished").length;

  if (isReceptionist) {
    return <ReceptionistDashboard competitions={competitions} participants={participants} />;
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Dashboard"
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kompetisi</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{competitions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kompetisi Aktif</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCompetitions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendaftar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participants.length > 0 ? participants.length : 2520}</div>
          </CardContent>
        </Card>
      </div>

      {/* Block Charts: Categories & Subjects */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" />
              Top Kategori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={dummyTopCategories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" />
              Top Subjek
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={dummyTopSubjects} />
          </CardContent>
        </Card>
      </div>

      {/* Block Charts: Locations (Country, State, City) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" />
              Top Negara
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={dummyTopCountries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" />
              Top Provinsi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={dummyTopStates} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" />
              Top Kota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={dummyTopCities} />
          </CardContent>
        </Card>
      </div>

      {/* Monitoring Tables */}
      <div className="space-y-6 w-full">
        {/* Receptionist Progress Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Progres Receptionist</h2>
          </div>
          <div className="rounded-md border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kompetisi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-center">Peserta</TableHead>
                  <TableHead className="text-center">Check-In</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dummyReceptionistProgress.map((item, i) => (
                  <TableRow key={i} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-sm">{item.competition}</TableCell>
                    <TableCell className="text-sm">{item.date}</TableCell>
                    <TableCell className="text-center text-sm">{item.totalParticipants}</TableCell>
                    <TableCell className="text-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                      {item.checkedIn}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Recent Activities Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Aktivitas Terkini</h2>
          </div>
          <div className="rounded-md border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kompetisi</TableHead>
                  <TableHead>Aktivitas</TableHead>
                  <TableHead>Oleh</TableHead>
                  <TableHead className="text-right">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dummyTeamActivities.map((item, i) => (
                  <TableRow key={i} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-sm">{item.competition}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.action}</TableCell>
                    <TableCell className="text-sm">{item.who}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {item.time}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

    </div>
  );
}
