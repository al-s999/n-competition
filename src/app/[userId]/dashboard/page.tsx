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

function HorizontalBarChart({ data }: { data: { name: string; participants: number; percentage: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground border rounded-lg border-dashed">
        <p className="text-sm">No data available</p>
      </div>
    );
  }

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
      <div className="space-y-6 pb-10">
        <PageHeader title="Dashboard" />

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>

        {/* Charts: Categories & Subjects */}
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[250px] rounded-xl" />
          <Skeleton className="h-[250px] rounded-xl" />
        </div>

        {/* Charts: Locations */}
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-[250px] rounded-xl" />
          <Skeleton className="h-[250px] rounded-xl" />
          <Skeleton className="h-[250px] rounded-xl" />
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  const activeCompetitions = competitions.filter(c => c.status !== "finished").length;

  if (isReceptionist) {
    return <ReceptionistDashboard competitions={competitions} participants={participants} />;
  }

  // Calculate real top categories
  const categoryCount: Record<string, number> = {};
  participants.forEach(p => {
    const cat = p.category || "General";
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  const totalCat = participants.length;
  const realTopCategories = Object.entries(categoryCount)
    .map(([name, count]) => ({
      name,
      participants: count,
      percentage: totalCat > 0 ? Math.round((count / totalCat) * 100) : 0,
    }))
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 3);

  // Calculate real top subjects
  const subjectCount: Record<string, number> = {};
  participants.forEach(p => {
    const sub = p.subject || "General";
    subjectCount[sub] = (subjectCount[sub] || 0) + 1;
  });
  const realTopSubjects = Object.entries(subjectCount)
    .map(([name, count]) => ({
      name,
      participants: count,
      percentage: totalCat > 0 ? Math.round((count / totalCat) * 100) : 0,
    }))
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 3);

  // Empty arrays for location data since it's not in the current schema
  const realTopCountries: { name: string; participants: number; percentage: number }[] = [];
  const realTopStates: { name: string; participants: number; percentage: number }[] = [];
  const realTopCities: { name: string; participants: number; percentage: number }[] = [];

  // Calculate real receptionist progress
  const realReceptionistProgress = competitions.map(comp => {
    const compParts = participants.filter(p => p.competition_id === comp.id);
    const total = compParts.length;
    const checkedIn = compParts.filter(p => p.is_present).length;
    
    const dateStr = comp.final_end_date || comp.registration_end_date || comp.created_at;
    const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : "-";
    
    return {
      competition: comp.name,
      date: formattedDate,
      totalParticipants: total,
      checkedIn: checkedIn
    };
  });

  // Empty array for team activities since it's not in the current schema
  const realTeamActivities: { competition: string; action: string; who: string; time: string }[] = [];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Dashboard"
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Competitions</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{competitions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Competitions</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCompetitions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participants.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Block Charts: Categories & Subjects */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={realTopCategories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" />
              Top Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={realTopSubjects} />
          </CardContent>
        </Card>
      </div>

      {/* Block Charts: Locations (Country, State, City) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" />
              Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={realTopCountries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" />
              Top States
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={realTopStates} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" />
              Top Cities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={realTopCities} />
          </CardContent>
        </Card>
      </div>

      {/* Monitoring Tables */}
      <div className="space-y-6 w-full">
        {/* Receptionist Progress Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Receptionist Progress</h2>
          </div>
          <div className="rounded-md border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competition</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Participants</TableHead>
                  <TableHead className="text-center">Check-In</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {realReceptionistProgress.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No competitions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  realReceptionistProgress.map((item, i) => (
                    <TableRow key={i} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium text-sm">{item.competition}</TableCell>
                      <TableCell className="text-sm">{item.date}</TableCell>
                      <TableCell className="text-center text-sm">{item.totalParticipants}</TableCell>
                      <TableCell className="text-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                        {item.checkedIn}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Recent Activities Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Recent Activities</h2>
          </div>
          <div className="rounded-md border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competition</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {realTeamActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No recent activities
                    </TableCell>
                  </TableRow>
                ) : (
                  realTeamActivities.map((item, i) => (
                    <TableRow key={i} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium text-sm">{item.competition}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.action}</TableCell>
                      <TableCell className="text-sm">{item.who}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        {item.time}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

    </div>
  );
}
