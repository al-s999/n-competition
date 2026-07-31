"use client";

import { useState, useEffect } from "react";
import { useNavigationGuard } from "@/contexts/navigation-guard";
import { format } from "date-fns";
import { TimezoneDisplay } from "@/components/shared/timezone-display";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Edit, AlertCircle, ChevronLeft, ChevronRight, Users, CreditCard, CalendarDays, Banknote, Gift, Search, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompetitionService } from "@/features/competitions/data/service";
import { ParticipantService } from "@/features/participants/data/service";

import { PhaseRegistration } from "./_components/phase-registration";
import { PhasePayment } from "./_components/phase-payment";
import { PhaseQualification } from "./_components/phase-qualification";
import { PhaseStandings } from "./_components/phase-standings";
import { PhaseGroupStage, LocalGroup, GameApp } from "./_components/phase-group-stage";
import { PhaseChampion } from "./_components/phase-champion";
import { TeamManagement } from "./_components/team-management";
import ReceptionistClient from "./receptionist-client";
import { CompetitionPhase } from "@/types/competition";
import { cacheService } from "@/lib/services/cache-service";
import { useActiveContext } from "@/hooks/use-active-context";


const statusConfig: Record<string, any> = {
  published: {
    label: "Published",
    fallback: "Published",
    className: "bg-emerald-500/15 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800",
  },
  draft: {
    label: "Draft",
    fallback: "Draft",
    className: "bg-gray-500/15 text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700",
  },
  completed: {
    label: "Completed",
    fallback: "Completed",
    className: "bg-blue-500/15 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
  },
  coming_soon: {
    label: "Coming Soon",
    fallback: "Coming Soon",
    className: "bg-orange-500/15 text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800",
  },
  finished: {
    label: "Finished",
    fallback: "Finished",
    className: "bg-purple-500/15 text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800",
  },
};

export default function CompetitionClient() {
  const params = useParams();
  const compId = params.id as string;
  const userId = params.userId as string;
  const router = useRouter();
  const { activeRole } = useActiveContext();

  const [detail, setDetail] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [players, setPlayers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [activePhase, setActivePhase] = useState<CompetitionPhase | "teams">("teams");
  
  useEffect(() => {
    if (activeRole === "MC") {
      setActivePhase("group_stage");
    } else {
      setActivePhase("teams");
    }
  }, [activeRole]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);

  const formatCurrency = (val: number | string) => {
    if (typeof val === 'string' && isNaN(Number(val))) return val;
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(val));
  };


  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [comp, parts] = await Promise.all([
          CompetitionService.getCompetitionById(compId),
          ParticipantService.getParticipantsByCompetition(compId)
        ]);
        if (mounted && comp) setDetail(comp as any);

        if (mounted) {
          const mapped = parts.map(p => ({
            id: p.id,
            userId: p.user_id || "",
            name: p.name,
            username: p.username || "",
            avatar: p.avatar || null,
            gamesPlayed: p.games_played || 0,
            avgScore: p.avg_score || 0,
            paid: p.is_paid || false,
            registeredAt: p.registered_at || p.created_at,
            isFinalist: p.is_finalist,
            isPresent: p.is_present,
            category: p.category,
            subject: p.subject,
            schoolName: p.school_name,
            sessions: []
          }));
          setPlayers(mapped);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [compId, refreshKey]);

  useEffect(() => {
    if (!detail) return;
    
    // Auto generate dummy groups based on detail
    const categories = detail.categories && Array.isArray(detail.categories) && detail.categories.length > 0
      ? detail.categories.map((c: any) => typeof c === 'string' ? c : c.name || "Unknown")
      : detail.category ? detail.category.split(",").map((s: string) => s.trim()).filter(Boolean) : ["Uncategorized"];
      
    const subjects = (detail.is_split_by_subject && detail.subjects && Array.isArray(detail.subjects) && detail.subjects.length > 0) 
      ? detail.subjects.map((s: any) => typeof s === 'string' ? s : s.name || "General") 
      : ["General"];

    let dummyGroupId = 1;
    const generatedGroups: any[] = [];

    categories.forEach((cat: string) => {
      subjects.forEach((sub: string) => {
        // Semifinal Group 1
        generatedGroups.push({
          id: String(dummyGroupId++),
          name: "Group 1",
          stage: "Semifinal",
          category: cat === "Uncategorized" ? "" : cat,
          sources: [sub === "General" ? "" : sub],
          members: [],
          rounds: []
        });
        // Semifinal Group 2
        generatedGroups.push({
          id: String(dummyGroupId++),
          name: "Group 2",
          stage: "Semifinal",
          category: cat === "Uncategorized" ? "" : cat,
          sources: [sub === "General" ? "" : sub],
          members: [],
          rounds: []
        });
        // Final
        generatedGroups.push({
          id: String(dummyGroupId++),
          name: "Final",
          stage: "Final",
          category: cat === "Uncategorized" ? "" : cat,
          sources: [sub === "General" ? "" : sub],
          members: [],
          rounds: []
        });
        // Champion
        generatedGroups.push({
          id: String(dummyGroupId++),
          name: "Champion",
          stage: "Champion",
          category: cat === "Uncategorized" ? "" : cat,
          sources: [sub === "General" ? "" : sub],
          members: [],
          rounds: []
        });
      });
    });
    
    setGroups(generatedGroups);
  }, [detail]);

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  if (activeRole === "RECEPTIONIST") {
    return <ReceptionistClient compId={compId} />;
  }

  if (isLoading) {
    return <div className="p-8 flex justify-center">"Loading"...</div>;
  }

  if (!detail) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Competition Not Found</h2>
        <Button onClick={() => router.push("/competitions")}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      </div>
    );
  }


  const startDate = detail.start_date ? new Date(detail.start_date) : null;
  const endDate = detail.end_date ? new Date(detail.end_date) : null;

  const cfg = statusConfig[detail.status] || statusConfig.draft;
  const totalRegistered = players.length;
  const totalPaid = players.filter(p => p.paid).length;
  const paidPercentage = totalRegistered > 0 ? Math.round((totalPaid / totalRegistered) * 100) : 0;


  return (
    <div className="w-full p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {(activeRole === "COMPETITION" || activeRole === "MANAGER" || activeRole === "MC") ? (
          <>
            <Link href={`/${userId}/competitions`} className="hover:text-foreground transition-colors cursor-pointer">
              Competitions
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
          </>
        ) : null}
        <span className="text-foreground font-medium">Competition Detail</span>
      </nav>

      {/* Title + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-4 min-w-0 flex-1">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground line-clamp-2" title={detail.name || detail.title}>{detail.name || detail.title}</h1>
          </div>

          {/* Inline Stats */}
          <div className="flex items-center gap-x-3 gap-y-2 text-sm text-muted-foreground flex-wrap">
            <Badge variant="outline" className={`capitalize border shrink-0 ${cfg.className}`}>
              {cfg.label}
            </Badge>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span><strong className="text-foreground">{totalRegistered.toLocaleString("id-ID")}</strong> Registered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              <span><strong className="text-foreground">{totalPaid.toLocaleString("id-ID")}</strong> Paid</span>
              <div className="flex items-center gap-1.5 ml-1">
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${paidPercentage}%` }}
                  />
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{paidPercentage}%</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              <span className="text-xs sm:text-sm">
                {detail.registration_start_date
                  ? <TimezoneDisplay date={detail.registration_start_date} compact={false} showBadge={false} />
                  : "—"}
                {" — "}
                {(detail.final_end_date || detail.registration_end_date)
                  ? <TimezoneDisplay date={detail.final_end_date || detail.registration_end_date} compact={false} showBadge={false} />
                  : "—"}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 cursor-help"
              title={`Registration Fee: ${formatCurrency(detail.registration_fee || 0)}`}
            >
              <Banknote className="h-4 w-4 text-yellow-500" />
              <span>{formatCurrency(detail.registration_fee || 0)}</span>
            </div>
            <div
              className="flex items-center gap-1.5 cursor-help"
              title={`Prize Pool: ${formatCurrency(detail.prize_pool || 0)}`}
            >
              <Gift className="h-4 w-4 text-rose-500" />
              <strong className="text-foreground">{formatCurrency(detail.prize_pool || 0)}</strong>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {activeRole !== "MC" && (
            <Button size="sm" className="gap-1.5" onClick={() => router.push(`/${params?.userId}/competitions/${compId}/edit`)}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Poster + Description + Rules */}
      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* Poster */}
        <div className="shrink-0">
          <div
            className={`rounded-lg overflow-hidden border bg-muted/30 relative group transition-all duration-200 shadow-sm hover:shadow-md ${detail.poster_url ? "cursor-zoom-in" : ""}`}
            style={{ width: "160px", height: "120px" }}
            onClick={() => detail.poster_url && setIsImageModalOpen(true)}
          >
            {detail.poster_url ? (
              <>
                <img
                  src={detail.poster_url}
                  alt={detail.name || detail.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Search className="text-white opacity-0 group-hover:opacity-100 h-6 w-6 transition-opacity" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted border">
                <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-5 min-w-0 overflow-hidden">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold mb-1.5">Description</h3>
            <p className={`text-sm text-muted-foreground leading-relaxed wrap-break-word ${!descExpanded ? "line-clamp-2" : ""}`}>
              {detail.description}
            </p>
            {detail.description && detail.description.length > 100 && (
              <button
                type="button"
                onClick={() => setDescExpanded(!descExpanded)}
                className="text-xs text-primary hover:underline cursor-pointer whitespace-nowrap mt-1"
              >
                {descExpanded ? "Show less" : "Show All"}
              </button>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold mb-1.5">Rules</h3>
            <div className="text-sm text-muted-foreground wrap-break-word space-y-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:list-outside [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:pl-5 [&_ol]:my-2 [&_li]:mb-1 [&_li_p]:inline">
              {rulesExpanded ? (
                <div>
                  {(detail.rules || []).map((rule: string, i: number) => (
                    <div key={i} dangerouslySetInnerHTML={{ __html: rule }} className="mb-2" />
                  ))}
                </div>
              ) : (
                <div
                  className="line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: detail.rules?.[0] || "—" }}
                />
              )}
            </div>
            {detail.rules && detail.rules.length > 1 && (
              <button
                type="button"
                onClick={() => setRulesExpanded(!rulesExpanded)}
                className="text-xs text-primary hover:underline cursor-pointer whitespace-nowrap mt-1"
              >
                {rulesExpanded ? "Show less" : "Show All"}
              </button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activePhase} onValueChange={(v) => setActivePhase(v as CompetitionPhase | "teams")} className="w-full relative z-0">
        <TabsList className="mb-4 w-full justify-start h-auto bg-transparent p-0 gap-0.5 sm:gap-2 overflow-x-auto rounded-none border-b no-scrollbar">
          {activeRole !== "MC" && (
            <>
              <TabsTrigger value="teams" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2.5 sm:px-4 pb-3 pt-2 text-xs sm:text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer whitespace-nowrap">
                Teams
              </TabsTrigger>
              <TabsTrigger value="registration" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2.5 sm:px-4 pb-3 pt-2 text-xs sm:text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer whitespace-nowrap">
                Registration
              </TabsTrigger>
              <TabsTrigger value="payment" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2.5 sm:px-4 pb-3 pt-2 text-xs sm:text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer whitespace-nowrap">
                Payment
              </TabsTrigger>
              <TabsTrigger value="qualification" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2.5 sm:px-4 pb-3 pt-2 text-xs sm:text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer whitespace-nowrap">
                Qualification
              </TabsTrigger>
              <TabsTrigger value="standings" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2.5 sm:px-4 pb-3 pt-2 text-xs sm:text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer whitespace-nowrap">
                Standings
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="group_stage" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2.5 sm:px-4 pb-3 pt-2 text-xs sm:text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer whitespace-nowrap">
            Group Stage
          </TabsTrigger>
          <TabsTrigger value="champion" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-2.5 sm:px-4 pb-3 pt-2 text-xs sm:text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer whitespace-nowrap">
            Champion
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="teams" className="m-0">
            <TeamManagement competitionId={compId} />
          </TabsContent>
          <TabsContent value="registration" className="m-0">
            <PhaseRegistration
              competition={detail}
              players={players}
              totalPlayersCount={players.length}
              refreshData={triggerRefresh}
              dbTotalRegistered={players.length}
            />
          </TabsContent>
          <TabsContent value="payment" className="m-0">
            <PhasePayment
              competition={detail}
              players={players}
              refreshData={triggerRefresh}
              dbTotalPaid={players.filter(p => p.paid).length}
            />
          </TabsContent>
          <TabsContent value="qualification" className="m-0">
            <PhaseQualification
              competition={detail}
              players={players}
              refreshData={triggerRefresh}
              dbTotalFinalists={players.filter(p => p.isFinalist).length}
            />
          </TabsContent>
          <TabsContent value="standings" className="m-0">
            <PhaseStandings
              groups={groups}
              finalists={players.filter(p => p.isFinalist)}
              categories={detail?.categories?.length > 0 ? detail.categories.map((c: any) => typeof c === 'string' ? c : c.name || "Unknown") : (detail?.category ? detail.category.split(",").map((s: string) => s.trim()).filter(Boolean) : ["TK", "SD/MI", "SMP/MTs", "SMA/SMK/MA", "Mahasiswa"])}
              showBracket={false}
            />
          </TabsContent>
          <TabsContent value="group_stage" className="m-0">
            <PhaseGroupStage
              competitionId={compId}
              finalists={players.filter(p => p.isFinalist)}
              groups={groups}
              quizzes={[]}
              games={[]}
              categories={detail?.categories?.length > 0 ? detail.categories.map((c: any) => typeof c === 'string' ? c : c.name || "Unknown") : (detail?.category ? detail.category.split(",").map((s: string) => s.trim()).filter(Boolean) : ["TK", "SD/MI", "SMP/MTs", "SMA/SMK/MA", "Mahasiswa"])}
              onGroupsChange={setGroups}
              showGroupStageHeader={false}
              showBracket={true}
            />
          </TabsContent>
          <TabsContent value="champion" className="m-0">
            <PhaseChampion
              groups={groups}
              finalists={players.filter(p => p.isFinalist)}
              categories={detail?.categories?.length > 0 ? detail.categories.map((c: any) => typeof c === 'string' ? c : c.name || "Unknown") : (detail?.category ? detail.category.split(",").map((s: string) => s.trim()).filter(Boolean) : ["TK", "SD/MI", "SMP/MTs", "SMA/SMK/MA", "Mahasiswa"])}
            />
          </TabsContent>
        </div>

      </Tabs>

      {/* Image Preview Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-lg p-2">
          <DialogTitle className="sr-only">Poster Preview</DialogTitle>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium px-2 pt-2">{detail.name || detail.title}</p>
            <img
              src={detail.poster_url}
              alt={detail.name || detail.title}
              className="w-full rounded-md object-contain max-h-[70vh]"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

