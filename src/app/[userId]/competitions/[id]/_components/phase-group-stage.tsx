"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DummyPlayer, MockQuiz } from "@/types/competition";
import {
  Plus, Trash2, Users, UserPlus, BookOpen, Trophy, Clock,
  ArrowUpRight, ChevronDown as ChevronDownIcon, ChevronUp, Maximize2, Edit, Gamepad2, Save, ArrowLeft, RefreshCw, Play, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "@/components/shared/search-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getScoreTextClass } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Combobox } from "@/components/ui/combobox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, ChevronDown } from "lucide-react";
import { LiquipediaBracket } from "@/components/bracket/liquipedia-bracket";
import { generateXID } from "@/lib/id-generator";
import { startRoundSession, deleteGroupFromDatabase, saveGroupRoundsToDatabase } from "../actions";

export interface GameApp {
  name: string;
  count: number;
}

interface PhaseGroupStageProps {
  readOnly?: boolean;
  finalists: DummyPlayer[];
  groups: LocalGroup[];
  quizzes: MockQuiz[];
  games: GameApp[];
  onGroupsChange: (groups: LocalGroup[]) => void;
  onSave?: () => void;
  isSaving?: boolean;
  currentUserId?: string | null;
  competitionId?: string;
  isDirty?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  categories?: string[];
  title?: string;
  defaultStage?: string;
  stageOptions?: string[];
  visibleStages?: string[];
  showGroupStageHeader?: boolean;
  stageFilter?: string;
  onStageFilterChange?: (stage: string) => void;
  categoryFilter?: string;
  onCategoryFilterChange?: (cat: string) => void;
  groupSearchQuery?: string;
  onGroupSearchQueryChange?: (q: string) => void;
  showBracket?: boolean;
}

export interface RoundConfig {
  round: number;
  quiz_id: string;
  game_id: string;
  session_id?: string;
  game_pin?: string;
  lobby_id?: string;
  settings?: {
    durationMinutes: number;
    questionCount: number;
    sound: boolean;
    difficulty: string;
  };
}

export interface LocalGroup {
  id: string;
  name: string;
  rounds: RoundConfig[];
  members: LocalGroupMember[];
  stage?: string;
  sources?: string[];
  category?: string;
}

export interface LocalGroupMember {
  playerId: string;
  playerName: string;
  score: number;
  timeSeconds: number;
  isAdvanced: boolean;
}

function formatTime(seconds: number): string {
  if (seconds === 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function PhaseGroupStage({
  finalists,
  groups,
  quizzes,
  games,
  onGroupsChange,
  onSave,
  isSaving,
  currentUserId,
  competitionId,
  isDirty,
  onRefresh,
  isRefreshing,
  categories,
  title,
  defaultStage = "Semifinal",
  stageOptions,
  visibleStages,
  showGroupStageHeader = true,
  stageFilter,
  onStageFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  groupSearchQuery,
  onGroupSearchQueryChange,
  showBracket = true,
}: PhaseGroupStageProps) {
  const availableStageOptions = stageOptions && stageOptions.length > 0
    ? stageOptions
    : ["Group Stage", "Semifinal", "Final", "Champion"];
  const firstStageOption = availableStageOptions[0] || defaultStage;
  const isFirstStage = (stage: string) => stage === firstStageOption;
  const isStageVisible = (stage?: string) => {
    if (!visibleStages || visibleStages.length === 0) return true;
    return visibleStages.includes(stage || "Semifinal");
  };
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupStage, setNewGroupStage] = useState(defaultStage);
  const [newGroupSources, setNewGroupSources] = useState<string[]>([]);
  const [newGroupCategory, setNewGroupCategory] = useState("");

  const [localStageFilter, setLocalStageFilter] = useState("all");
  const activeStageFilter = stageFilter !== undefined ? stageFilter : localStageFilter;
  const setActiveStageFilter = onStageFilterChange !== undefined ? onStageFilterChange : setLocalStageFilter;

  const [localCategoryFilter, setLocalCategoryFilter] = useState("all");
  const activeCategoryFilter = categoryFilter !== undefined ? categoryFilter : localCategoryFilter;
  const setActiveCategoryFilter = onCategoryFilterChange !== undefined ? onCategoryFilterChange : setLocalCategoryFilter;

  const [localGroupSearchQuery, setLocalGroupSearchQuery] = useState("");
  const activeGroupSearchQuery = groupSearchQuery !== undefined ? groupSearchQuery : localGroupSearchQuery;
  const setActiveGroupSearchQuery = onGroupSearchQueryChange !== undefined ? onGroupSearchQueryChange : setLocalGroupSearchQuery;

  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [detailDialog, setDetailDialog] = useState<LocalGroup | null>(null);
  const [detailSearch, setDetailSearch] = useState("");
  const [assignDialog, setAssignDialog] = useState<LocalGroup | null>(null);
  const [roundsDialog, setRoundsDialog] = useState<{
    group: LocalGroup;
    rounds: {
      quizId: string;
      gameId: string;
      session_id?: string;
      game_pin?: string;
      lobby_id?: string;
      settings?: {
        durationMinutes: number;
        questionCount: number;
        sound: boolean;
        difficulty: string;
      };
    }[];
  } | null>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignSelected, setAssignSelected] = useState<string[]>([]);

  // Edit Group state
  const [editGroup, setEditGroup] = useState<LocalGroup | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupStage, setEditGroupStage] = useState("");
  const [editGroupSources, setEditGroupSources] = useState<string[]>([]);
  const [editGroupCategory, setEditGroupCategory] = useState("");

  // Remove confirmation state
  const [removeConfirm, setRemoveConfirm] = useState<{
    type: "member" | "quiz" | "game";
    groupId: string;
    itemId: string;
    label: string;
  } | null>(null);

  // Session creation state
  const [startingRound, setStartingRound] = useState<string | null>(null);

  // Delete group state
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  // All assigned player IDs across all groups
  const allAssignedIds = groups.flatMap((g) => g.members.map((m) => m.playerId));
  const visibleGroups = groups.filter((group) => isStageVisible(group.stage));

  const filteredGroups = visibleGroups.filter((group) => {
    // Stage filter
    if (activeStageFilter !== "all" && group.stage !== activeStageFilter) return false;

    // Category filter
    if (activeCategoryFilter !== "all") {
      if (activeCategoryFilter === "uncategorized") {
        if (group.category) return false;
      } else {
        if (group.category !== activeCategoryFilter) return false;
      }
    }

    // Search filter
    if (activeGroupSearchQuery.trim() !== "" && !group.name.toLowerCase().includes(activeGroupSearchQuery.toLowerCase())) return false;

    return true;
  });

  const getQuizById = (quizId: string) => quizzes.find((quiz) => quiz.id === quizId);

  const getQuestionLimitOptions = (quizId: string) => {
    const selectedQuiz = getQuizById(quizId);
    const maxCount = selectedQuiz?.questionCount ?? 20;
    const baseOptions = [5, 10, 20];
    const options = baseOptions.filter((num) => num <= maxCount);
    if (selectedQuiz && maxCount > 0 && maxCount < 20 && !options.includes(maxCount)) {
      options.push(maxCount);
    }
    return options.sort((a, b) => a - b);
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    let initialMembers: LocalGroupMember[] = [];
    if (newGroupSources.length > 0) {
      const sourceGrps = groups.filter((g) => newGroupSources.includes(g.id));
      initialMembers = sourceGrps.flatMap(sourceGrp =>
        sourceGrp.members
          .filter((m) => m.isAdvanced)
          .map((m) => {
            const isChampion = newGroupStage === "Champion" || newGroupName.trim().toLowerCase().includes("juara");
            return {
              ...m,
              isAdvanced: false,
              score: isChampion ? m.score : 0,
              timeSeconds: isChampion ? m.timeSeconds : 0
            };
          })
      );
    }

    const newGroup: LocalGroup = {
      id: generateXID(),
      name: newGroupName.trim(),
      rounds: [],
      members: initialMembers,
      stage: newGroupStage,
      sources: newGroupSources,
      category: newGroupCategory || undefined,
    };
    onGroupsChange([...groups, newGroup]);
    toast.success(`Group created: ${newGroupName}`);
    setNewGroupName("");
    setNewGroupSources([]);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!competitionId) {
      toast.error("Competition ID not found");
      return;
    }

    try {
      setDeletingGroupId(groupId);

      // Call server action to delete from database
      const result = await deleteGroupFromDatabase(groupId, competitionId);

      if (result.success) {
        // Update local state after successful DB deletion
        onGroupsChange(groups.filter((g) => g.id !== groupId));
        toast.success("Group deleted");
      } else {
        toast.error(result.error || "Failed to delete group");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete group");
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleUpdateGroup = () => {
    if (!editGroup) return;
    if (!editGroupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    onGroupsChange(
      groups.map((g) =>
        g.id === editGroup.id
          ? {
            ...g,
            name: editGroupName.trim(),
            stage: editGroupStage,
            sources: editGroupSources,
            category: editGroupCategory || undefined,
          }
          : g
      )
    );
    toast.success("Group updated successfully");
    setEditGroup(null);
  };

  const handleAssignPlayers = () => {
    if (!assignDialog || assignSelected.length === 0) return;
    const newMembers: LocalGroupMember[] = assignSelected.map((pId) => {
      const player = finalists.find((f) => f.id === pId);

      let prevScore = 0;
      let prevTime = 0;

      const isChampion = assignDialog?.stage === "Champion" || assignDialog?.name.toLowerCase().includes("juara");

      if (isChampion) {
        for (let i = groups.length - 1; i >= 0; i--) {
          const memMatch = groups[i].members.find(m => m.playerId === pId);
          if (memMatch && memMatch.score > 0) {
            prevScore = memMatch.score;
            prevTime = memMatch.timeSeconds;
            break;
          }
        }
      }

      return {
        playerId: pId,
        playerName: player?.name || pId,
        score: prevScore,
        timeSeconds: prevTime,
        isAdvanced: false,
      };
    });

    onGroupsChange(
      groups.map((g) =>
        g.id === assignDialog.id
          ? { ...g, members: [...g.members, ...newMembers] }
          : g
      )
    );
    toast.success(`${assignSelected.length} players assigned`);
    setAssignSelected([]);
    setAssignSearch("");
    setAssignDialog(null);
  };

  const openRoundsDialog = (group: LocalGroup) => {
    const rounds = group.rounds.length > 0
      ? group.rounds.map(r => ({
        quizId: r.quiz_id || "",
        gameId: r.game_id || "",
        session_id: r.session_id,
        game_pin: r.game_pin,
        lobby_id: r.lobby_id,
        settings: r.settings || {
          durationMinutes: 10,
          questionCount: 10,
          sound: true,
          difficulty: "Easy"
        }
      }))
      : [{
        quizId: "",
        gameId: "",
        settings: {
          durationMinutes: 10,
          questionCount: 10,
          sound: true,
          difficulty: "Easy"
        }
      }];
    setRoundsDialog({ group, rounds });
  };

  const handleSaveRounds = async () => {
    if (!roundsDialog) return;

    // Convert dialog rounds to RoundConfig[], preserving session_id/game_pin/lobby_id
    let newRounds: RoundConfig[] = roundsDialog.rounds.map((r, idx) => {
      const roundConfig: RoundConfig = {
        round: idx + 1,
        quiz_id: r.quizId,
        game_id: r.gameId,
        settings: r.settings || {
          durationMinutes: 10,
          questionCount: 10,
          sound: true,
          difficulty: "Easy"
        }
      };
      // Preserve existing session data from previously played rounds
      if (r.session_id) roundConfig.session_id = r.session_id;
      if (r.game_pin) roundConfig.game_pin = r.game_pin;
      if (r.lobby_id) roundConfig.lobby_id = r.lobby_id;
      return roundConfig;
    });

    while (newRounds.length > 0 && newRounds[newRounds.length - 1].quiz_id === "" && newRounds[newRounds.length - 1].game_id === "") {
      newRounds.pop();
    }

    try {
      // Save directly to database in real-time and clean up deleted round databases (groups table / game_sessions table)
      const result = await saveGroupRoundsToDatabase(roundsDialog.group.id, newRounds);

      if (result.success) {
        const newGroups = groups.map((g) =>
          g.id === roundsDialog.group.id ? { ...g, rounds: newRounds } : g
        );
        onGroupsChange(newGroups);
        setRoundsDialog(null);
        toast.success("Rounds configured successfully");
      } else {
        toast.error(result.error || "Failed to configure rounds");
      }
    } catch (err: any) {
      console.error("Error saving rounds:", err);
      toast.error("Failed to configure rounds");
    }
  };

  const toggleAdvance = (groupId: string, playerId: string, forceValue?: boolean) => {
    let playerObj: LocalGroupMember | null = null;
    let nextValue = false;

    // 1. Update the advanced status in the current group
    const updatedGroups = groups.map((g) => {
      if (g.id === groupId) {
        const updatedMembers = g.members.map((m) => {
          if (m.playerId === playerId) {
            nextValue = forceValue !== undefined ? forceValue : !m.isAdvanced;
            playerObj = { ...m, isAdvanced: nextValue };
            return playerObj;
          }
          return m;
        });
        return { ...g, members: updatedMembers };
      }
      return g;
    });

    // 2. Automatically sync to any target groups (e.g. Champion) that have this group as a source
    const finalGroups = updatedGroups.map((g) => {
      if (g.sources && g.sources.includes(groupId)) {
        if (nextValue) {
          // Add to target group if not already there
          const exists = g.members.some((m) => m.playerId === playerId);
          if (!exists && playerObj) {
            const isChampion = g.stage === "Champion" || g.name.toLowerCase().includes("juara");
            return {
              ...g,
              members: [
                ...g.members,
                {
                  playerId: playerId,
                  playerName: playerObj.playerName,
                  score: isChampion ? playerObj.score : 0,
                  timeSeconds: isChampion ? playerObj.timeSeconds : 0,
                  isAdvanced: false,
                }
              ]
            };
          }
        } else {
          // Remove from target group if deselected
          return {
            ...g,
            members: g.members.filter((m) => m.playerId !== playerId)
          };
        }
      }
      return g;
    });

    onGroupsChange(finalGroups);
    if (detailDialog?.id === groupId) {
      setDetailDialog(finalGroups.find(g => g.id === groupId) || null);
    }
  };

  const handleStartSession = async (group: LocalGroup, roundIdx: number) => {
    if (!competitionId || !currentUserId) {
      toast.error("Competition ID or User ID missing");
      return;
    }

    const round = group.rounds[roundIdx];
    if (!round.quiz_id && !round.game_id) {
      toast.error("Please assign a quiz or game first");
      return;
    }

    const loadingId = `${group.id}-${roundIdx}`;
    setStartingRound(loadingId);

    const hostWindow = typeof window !== "undefined" ? window.open("about:blank", "_blank") : null;

    try {
      const result = await startRoundSession({
        competitionId,
        groupId: group.id,
        groupName: group.name,
        roundIndex: roundIdx,
        quizId: round.quiz_id,
        gameId: round.game_id,
        settings: round.settings,
        participants: group.members.map(m => ({ id: m.playerId, user_id: "" })), // user_id will be resolved by action
        hostId: currentUserId
      });

      if (result.success && result.redirectUrl) {
        toast.success("Session started! Redirecting...");
        if (hostWindow) {
          hostWindow.location.href = result.redirectUrl;
        } else {
          window.location.href = result.redirectUrl;
        }

        // Refresh data to show session_id in UI
        if (onRefresh) onRefresh();
      } else {
        if (hostWindow) hostWindow.close();
        toast.error(result.error || "Failed to start session");
      }
    } catch (err: any) {
      if (hostWindow) hostWindow.close();
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setStartingRound(null);
    }
  };

  return (
    <div className="space-y-4 bg-slate-950/70 p-4 rounded-3xl border border-slate-800 shadow-none dark:bg-slate-950 dark:border-slate-800">
      {showGroupStageHeader && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">{title || "Group Stage"}</h2>
            </div>
          </div>

          {/* Add Group */}
          <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-4 dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
            <Input
              placeholder="Search groups..."
              value={activeGroupSearchQuery}
              onChange={(e) => setActiveGroupSearchQuery(e.target.value)}
              className="w-[200px] h-9"
            />

            <Select value={activeStageFilter} onValueChange={setActiveStageFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {availableStageOptions.map((stage) => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {categories && categories.length > 0 && (
              <Select value={activeCategoryFilter} onValueChange={setActiveCategoryFilter}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center gap-2 shrink-0 md:ml-auto">
              {competitionId && (
                <Link href={`/competition/${competitionId}/bracket`}>
                  <Button variant="outline" className="gap-1.5 h-9 shrink-0 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/20">
                    <Trophy className="h-4 w-4" />Bagan & Seeding</Button>
                </Link>
              )}

              <Button onClick={() => setIsAddGroupOpen(true)} variant="secondary" className="gap-1.5 h-9 shrink-0">
                <Plus className="h-4 w-4" />Add Group</Button>

              {onSave && (
                <div className="flex items-center gap-2 shrink-0">
                  {isDirty && !isSaving && (
                    <span className="text-xs text-amber-500 dark:text-amber-400 animate-pulse font-medium hidden sm:inline">
                      ● Unsaved changes
                    </span>
                  )}
                  <Button onClick={onSave} disabled={isSaving} className={`gap-1.5 h-9 px-4 shrink-0 transition-all relative ${isDirty && !isSaving ? 'ring-2 ring-amber-500/50 ring-offset-1 ring-offset-background' : ''}`}>
                    {isSaving ? (
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                    {isDirty && !isSaving && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showGroupStageHeader && (
        <>
          {/* Category Filter Tabs */}
          {categories && categories.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={activeCategoryFilter === "all" ? "default" : "outline"}
                className="cursor-pointer select-none text-xs px-3 py-1"
                onClick={() => setActiveCategoryFilter("all")}
              >All</Badge>
              {categories.map(cat => (
                <Badge
                  key={cat}
                  variant={activeCategoryFilter === cat ? "default" : "outline"}
                  className="cursor-pointer select-none text-xs px-3 py-1"
                  onClick={() => setActiveCategoryFilter(cat)}
                >
                  {cat}
                </Badge>
              ))}
              {/* Show uncategorized filter if there are groups without category */}
              {visibleGroups.some(g => !g.category) && (
                <Badge
                  variant={activeCategoryFilter === "uncategorized" ? "default" : "outline"}
                  className="cursor-pointer select-none text-xs px-3 py-1"
                  onClick={() => setActiveCategoryFilter("uncategorized")}
                >Uncategorized</Badge>
              )}
            </div>
          )}

          {/* Groups */}
          {filteredGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-100/80 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-slate-600 text-sm dark:text-slate-300">No groups match the filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredGroups
                .map((group) => {
                  const advancedCount = group.members.filter((m) => m.isAdvanced).length;
                  const sortedMembers = [...group.members].sort((a, b) => {
                    if (b.score !== a.score) return b.score - a.score;
                    return a.timeSeconds - b.timeSeconds;
                  });

                  return (
                    <div key={group.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col dark:bg-slate-950 dark:border-slate-800 dark:shadow-none">
                      {/* Group Header */}
                      <div className="flex items-center justify-between p-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer" onClick={() => setDetailDialog(group)}>
                          <h3 className="font-semibold text-sm truncate max-w-[150px] md:max-w-[200px]" title={group.name}>{group.name}</h3>
                          {group.stage && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 py-0 font-medium">
                              {group.stage}
                            </Badge>
                          )}
                          {group.category && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 py-0 font-normal">
                              {group.category}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          {/* More Menu Dropdown to hold actions instead of cluttering header */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-800">
                                <ChevronDownIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel className="text-xs">Group Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDetailDialog(group)}>
                                <Maximize2 className="h-3.5 w-3.5 mr-2" /> View Details
                              </DropdownMenuItem>
                              {group.stage !== "Champion" && (
                                <DropdownMenuItem onClick={() => openRoundsDialog(group)}>
                                  <BookOpen className="h-3.5 w-3.5 mr-2" /> Assign Quiz
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setAssignDialog(group)}>
                                <UserPlus className="h-3.5 w-3.5 mr-2" /> Assign Finalist
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setEditGroup(group);
                                setEditGroupName(group.name);
                                setEditGroupStage(group.stage || firstStageOption);
                                setEditGroupSources(group.sources || []);
                                setEditGroupCategory(group.category || "");
                              }}>
                                <Edit className="h-3.5 w-3.5 mr-2" /> Edit Group
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteGroup(group.id)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                disabled={deletingGroupId === group.id}
                              >
                                {deletingGroupId === group.id ? (
                                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                )}
                                Delete Group
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {/* Footer */}
                      <div className="px-3 py-2.5 border-t bg-slate-50/50 flex items-center justify-between text-[11px] text-muted-foreground dark:bg-slate-900/50">
                        <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5"/> {group.members.length}</span>
                        {group.rounds.length > 0 && (
                          <span className="flex items-center gap-1.5 font-medium text-primary cursor-pointer hover:underline" onClick={() => setDetailDialog(group)}><Trophy className="h-3.5 w-3.5"/> {group.rounds.length} Rounds</span>
                        )}
                        {advancedCount > 0 && (
                          <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-500"><ArrowUpRight className="h-3.5 w-3.5"/> {advancedCount} Adv</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}

      <Dialog open={!!detailDialog} onOpenChange={(open) => { if (!open) { setDetailDialog(null); setDetailSearch(""); } }}>
        <DialogContent className="sm:max-w-[750px]">
          {detailDialog && (() => {
            const group = detailDialog;
            const advancedCount = group.members.filter((m) => m.isAdvanced).length;
            return (
              <>
                <DialogHeader className="flex flex-row items-center justify-between pr-6 gap-4">
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <DialogTitle className="flex items-center gap-2 min-w-0">
                      <Trophy className="h-5 w-5 text-yellow-500 shrink-0" />
                      <span className="truncate" title={group.name}>{group.name}</span>
                      {group.stage && (
                        <Badge variant="outline" className="text-[10px] h-5 shrink-0 font-normal">
                          {group.stage}
                        </Badge>
                      )}
                    </DialogTitle>
                    {group.rounds.length > 0 && (() => {
                      const totalRounds = group.rounds.length;
                      return (
                        <div className="flex items-center gap-2 pl-7 flex-wrap">
                          <Popover>
                            <PopoverTrigger onClick={(e) => e.stopPropagation()}>
                              <Badge
                                variant="secondary"
                                className="text-[10px] cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 transition-colors px-2 py-0.5 gap-1.5"
                              >
                                <Trophy className="h-3 w-3" />
                                {totalRounds} {totalRounds === 1 ? ("Round") : ("Rounds")}
                              </Badge>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-[320px] p-0 shadow-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                              <div className="p-3 border-b bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                                <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                                  <Trophy className="h-4 w-4" />Assigned Rounds</h4>
                              </div>
                              <div className="max-h-[300px] overflow-y-auto p-2 space-y-2" onWheelCapture={(e) => e.stopPropagation()} onTouchMoveCapture={(e) => e.stopPropagation()}>
                                {group.rounds.map((roundConfig, i) => {
                                  const qId = roundConfig.quiz_id || "";
                                  const gId = roundConfig.game_id || "";
                                  const quiz = qId ? quizzes.find(q => q.id === qId) : null;
                                  const game = gId ? games.find(g => g.name === gId) : null;
                                  return (
                                    <div key={i} className="flex flex-col border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden group/round relative dark:bg-slate-950 dark:border-slate-800 dark:shadow-none">
                                      <div className="px-3 py-2 bg-slate-50 border-b flex justify-between items-center dark:border-slate-800 dark:bg-slate-900">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                          Round {roundConfig.round || i + 1}
                                        </span>
                                      </div>

                                      <div className="p-3 flex flex-col gap-2.5">
                                        {qId && (
                                          <div className="flex items-start gap-2.5 group/quiz-item">
                                            <div className="mt-0.5 w-6 h-6 rounded-md bg-blue-500/10 flex flex-col items-center justify-center shrink-0">
                                              <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                              <span className="text-sm font-medium leading-tight truncate" title={quiz?.title || qId}>{quiz?.title || qId}</span>
                                              {quiz && <span className="text-[10.5px] text-muted-foreground mt-0.5">{quiz.questionCount} questions</span>}
                                            </div>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-6 w-6 shrink-0 opacity-0 group-hover/quiz-item:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted"
                                              title="Remove quiz"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setRemoveConfirm({
                                                  type: "quiz",
                                                  groupId: group.id,
                                                  itemId: qId,
                                                  label: quiz?.title || qId,
                                                });
                                              }}
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        )}

                                        {gId && (
                                          <div className="flex items-center gap-2.5 group/game-item">
                                            <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
                                              <Gamepad2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                                            </div>
                                            <span className="text-sm font-medium leading-none truncate capitalize text-violet-700 dark:text-violet-300 flex-1" title={game?.name || gId}>
                                              {game?.name || gId}
                                            </span>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-6 w-6 shrink-0 opacity-0 group-hover/game-item:opacity-100 transition-opacity text-violet-400 hover:text-violet-600 hover:bg-violet-500/10"
                                              title="Remove game"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setRemoveConfirm({
                                                  type: "game",
                                                  groupId: group.id,
                                                  itemId: gId,
                                                  label: game?.name || gId,
                                                });
                                              }}
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        )}

                                        {!qId && !gId && (
                                          <div className="text-xs text-muted-foreground italic text-center py-2">Empty round</div>
                                        )}
                                      </div>

                                      {(qId || gId) && (
                                        <div className="px-2 py-1.5 bg-emerald-500/5 border-t border-emerald-500/10">
                                          <Button
                                            size="sm"
                                            className="w-full h-8 text-[11px] font-medium gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-none"
                                            disabled={startingRound === `${group.id}-${i}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleStartSession(group, i);
                                            }}
                                          >
                                            {startingRound === `${group.id}-${i}` ? (
                                              <RefreshCw className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <Play className="h-3 w-3 fill-current" />
                                            )}
                                            {startingRound === `${group.id}-${i}` ? ("Starting...") : ("Start")}
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="p-2 border-t bg-muted/10">
                                <Button size="sm" variant="ghost" className="w-full text-xs h-8" onClick={() => { setDetailDialog(null); setTimeout(() => openRoundsDialog(group), 150); }}>Manage Rounds<ArrowUpRight className="ml-1 h-3 w-3" />
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 mt-0">
                    <div className="w-56">
                      <SearchInput
                        placeholder="Search player..."
                        value={detailSearch}
                        onSearch={setDetailSearch}
                        className="w-full h-8 text-xs"
                      />
                    </div>
                  </div>
                </DialogHeader>
                <div className="mt-3 flex flex-col gap-3">
                  {group.members.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No members</p>
                  ) : (() => {
                    const visibleMembers = [...group.members]
                      .filter(m => m.playerName.toLowerCase().includes(detailSearch.toLowerCase()))
                      .sort((a, b) => {
                        if (b.score !== a.score) return b.score - a.score;
                        return a.timeSeconds - b.timeSeconds;
                      });

                    // Optimasi render: batasi item yang dirender untuk performa saat group besar.
                    // (UI tetap bisa ditingkatkan jadi virtualized list, tapi ini langkah cepat dan aman.)
                    const MAX_RENDER_MEMBERS = 200;
                    const renderedMembers = visibleMembers.slice(0, MAX_RENDER_MEMBERS);

                    const visibleNotAdvanced = visibleMembers.filter(m => !m.isAdvanced);
                    const allSelected = visibleMembers.length > 0 && visibleNotAdvanced.length === 0;


                    return (
                      <div className="border rounded-md overflow-hidden">
                        <div className={`grid ${group.stage === "Champion" ? "grid-cols-[32px_1fr_110px_80px_80px_40px_28px]" : "grid-cols-[28px_1fr_110px_80px_80px_40px_28px]"} gap-2 px-4 py-2 items-center text-[11px] font-medium text-muted-foreground border-b bg-muted/30`}>
                          {group.stage === "Champion" ? <span className="text-center">#</span> : (
                            <div className="flex items-center">
                              <Checkbox
                                checked={allSelected}
                                onCheckedChange={() => {
                                  const newGroups = groups.map((g) =>
                                    g.id === group.id
                                      ? {
                                        ...g,
                                        members: g.members.map((m) =>
                                          visibleMembers.find(v => v.playerId === m.playerId)
                                            ? { ...m, isAdvanced: !allSelected }
                                            : m
                                        ),
                                      }
                                      : g
                                  );
                                  onGroupsChange(newGroups);
                                  setDetailDialog(newGroups.find(g => g.id === group.id) || null);
                                }}
                                className="h-4 w-4 bg-background border-muted-foreground/40 mt-0.5"
                              />
                            </div>
                          )}
                          <span className="flex items-center gap-2">
                            Player
                            {advancedCount > 0 && (
                              <span className="text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                {advancedCount} Selected
                              </span>
                            )}
                          </span>
                          <span>Category</span>
                          <span className="text-center">Score</span>
                          <span className="text-center">Time</span>
                          <span />
                          <span />
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto w-full">
                          {renderedMembers
                            .map((member, idx) => {
                              const player = finalists.find(f => f.id === member.playerId);
                              const categoryText = player?.category;

                              return (
                                <div key={member.playerId}
                                  className={`grid ${group.stage === "Champion" ? "grid-cols-[32px_1fr_110px_80px_80px_40px_28px]" : "grid-cols-[28px_1fr_110px_80px_80px_40px_28px]"} gap-2 items-center px-4 py-2.5 text-sm border-b last:border-b-0 transition-colors ${member.isAdvanced ? "bg-emerald-500/5" : ""
                                    } ${group.stage !== "Champion" ? "cursor-pointer hover:bg-muted/40" : ""}`}
                                  onClick={() => {
                                    if (group.stage === "Champion") return;
                                    toggleAdvance(group.id, member.playerId);
                                  }}>
                                  {group.stage === "Champion" ? (
                                    <span className={`text-center text-xs font-bold ${idx === 0 ? "text-yellow-500" :
                                      idx === 1 ? "text-gray-400" :
                                        idx === 2 ? "text-orange-500" :
                                          "text-muted-foreground"
                                      }`}>#{idx + 1}</span>
                                  ) : (
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <Checkbox
                                        checked={member.isAdvanced}
                                        onCheckedChange={() => {
                                          toggleAdvance(group.id, member.playerId);
                                        }}
                                        className="h-4 w-4 bg-background border-muted-foreground/40"
                                      />
                                    </div>
                                  )}
                                  <div className="flex items-center gap-3 min-w-0 pr-1">
                                    <Avatar className="h-8 w-8">
                                      {player?.avatar && <AvatarImage src={player.avatar} alt={member.playerName} className="object-cover" />}
                                      <AvatarFallback className="text-[11px] font-medium">{member.playerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                      <div className={`flex items-center gap-1.5 min-w-0 ${member.isAdvanced ? "text-emerald-600" : ""}`}>
                                        <span className="font-semibold text-sm truncate" title={member.playerName}>
                                          {member.playerName}
                                        </span>
                                        {group.stage === "Final" && finalists.find(f => f.id === member.playerId)?.isPresent === false && (
                                          <Badge variant="destructive" className="text-[8px] h-4 px-1.5 py-0 uppercase leading-none font-bold shrink-0">Absent</Badge>
                                        )}
                                      </div>
                                      <span className="text-xs text-muted-foreground truncate" title={`@${member.playerName.toLowerCase().replace(/\s+/g, '')}`}>
                                        @{member.playerName.toLowerCase().replace(/\s+/g, '')}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    {categoryText ? (
                                      <Badge variant="outline" className="text-[10px] px-2 h-5 text-muted-foreground truncate border-muted-foreground/20 font-medium bg-muted/20">
                                        {categoryText}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground/50 text-xs">-</span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-center gap-1">
                                    <span className={`font-mono font-medium ${getScoreTextClass(member.score)}`}>{member.score}</span>
                                  </div>
                                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                                    <span className="font-mono">{formatTime(member.timeSeconds)}</span>
                                  </div>
                                  <div className="flex justify-center">
                                    {member.isAdvanced && (
                                      <span title="Advanced">
                                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
                                      title="Remove from group"
                                      onClick={() => {
                                        setRemoveConfirm({
                                          type: "member",
                                          groupId: group.id,
                                          itemId: member.playerId,
                                          label: member.playerName,
                                        });
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                      </div>
                    );
                  })()}
                </div>
                {group.stage === "Final" && (
                  <DialogFooter className="mt-4 border-t pt-3 sm:justify-between items-center w-full flex-row">
                    <p className="text-[11px] text-muted-foreground mr-auto flex-1">
                      Remove participants who have not checked in yet.
                    </p>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 gap-1.5 shadow-sm text-xs bg-red-500 hover:bg-red-600 text-white shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        const absentIds = group.members.filter((m) => {
                          const p = finalists.find((f) => f.id === m.playerId);
                          return p?.isPresent === false;
                        }).map(m => m.playerId);
                        if (absentIds.length === 0) {
                          toast.info("All participants have attended or group is empty!");
                          return;
                        }
                        const updatedMembers = group.members.filter(m => !absentIds.includes(m.playerId));
                        const newGroups = groups.map(g =>
                          g.id === group.id ? { ...g, members: updatedMembers } : g
                        );
                        onGroupsChange(newGroups);
                        setDetailDialog({ ...group, members: updatedMembers } as any);
                        toast.success(`Removed ${absentIds.length} absent participant(s).`);
                      }}>
                      <Trash2 className="h-3 w-3" />Cut Absent</Button>
                  </DialogFooter>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Assign Players Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={(open) => { if (!open) { setAssignDialog(null); setAssignSelected([]); setAssignSearch(""); } }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Assign Finalist — {assignDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <SearchInput
                placeholder="Search finalist..."
                value={assignSearch}
                onSearch={(val: string) => setAssignSearch(val)}
              />
            </div>
            <Button
              variant="outline"
              className="shrink-0 h-9 px-3 text-xs"
              onClick={() => {
                let availableRaw: DummyPlayer[] = [];
                if (assignDialog?.sources && assignDialog.sources.length > 0) {
                  const sourceGroups = groups.filter(g => assignDialog.sources!.includes(g.id));
                  const advancedPlayerIds = sourceGroups.flatMap(g => g.members.filter(m => m.isAdvanced).map(m => m.playerId));
                  const currentMemberIds = assignDialog.members.map(m => m.playerId);
                  availableRaw = finalists.filter(f => advancedPlayerIds.includes(f.id) && !currentMemberIds.includes(f.id));
                } else {
                  availableRaw = finalists.filter((f) => !allAssignedIds.includes(f.id));
                }

                const availableFiltered = availableRaw
                  .filter(f => f.name.toLowerCase().includes(assignSearch.toLowerCase()))
                  .sort((a, b) => {
                    const isChampion = assignDialog?.stage === "Champion" || assignDialog?.name.toLowerCase().includes("juara");
                    if (isChampion) {
                      const getStats = (pId: string) => {
                        for (let i = groups.length - 1; i >= 0; i--) {
                          const m = groups[i].members.find(x => x.playerId === pId);
                          if (m && m.score > 0) return { s: m.score, t: m.timeSeconds };
                        }
                        return { s: 0, t: 0 };
                      };
                      const sA = getStats(a.id);
                      const sB = getStats(b.id);
                      if (sB.s !== sA.s) return sB.s - sA.s;
                      return sA.t - sB.t;
                    }
                    return b.avgScore - a.avgScore;
                  });
                const assignableFiltered = availableFiltered; // Option 2: Allow all assignments
                const allSelected = assignableFiltered.length > 0 && assignableFiltered.every((f) => assignSelected.includes(f.id));

                if (allSelected) {
                  setAssignSelected([]);
                } else {
                  setAssignSelected(assignableFiltered.map((f) => f.id));
                }
              }}
            >
              {(() => {
                let availableRaw: DummyPlayer[] = [];
                if (assignDialog?.sources && assignDialog.sources.length > 0) {
                  const sourceGroups = groups.filter(g => assignDialog.sources!.includes(g.id));
                  const advancedPlayerIds = sourceGroups.flatMap(g => g.members.filter(m => m.isAdvanced).map(m => m.playerId));
                  const currentMemberIds = assignDialog.members.map(m => m.playerId);
                  availableRaw = finalists.filter(f => advancedPlayerIds.includes(f.id) && !currentMemberIds.includes(f.id));
                } else {
                  availableRaw = finalists.filter((f) => !allAssignedIds.includes(f.id));
                }

                const availableFiltered = availableRaw.filter(f => f.name.toLowerCase().includes(assignSearch.toLowerCase()));
                const assignableFiltered = availableFiltered; // Option 2
                const allSelected = assignableFiltered.length > 0 && assignableFiltered.every((f) => assignSelected.includes(f.id));
                return allSelected ? "Deselect all" : "Select all";
              })()}
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1 border rounded-md p-2">
            {(() => {
              let availableRaw: DummyPlayer[] = [];
              if (assignDialog?.sources && assignDialog.sources.length > 0) {
                const sourceGroups = groups.filter(g => assignDialog.sources!.includes(g.id));
                const advancedPlayerIds = sourceGroups.flatMap(g => g.members.filter(m => m.isAdvanced).map(m => m.playerId));
                const currentMemberIds = assignDialog.members.map(m => m.playerId);
                availableRaw = finalists.filter(f => advancedPlayerIds.includes(f.id) && !currentMemberIds.includes(f.id));
              } else {
                availableRaw = finalists.filter((f) => !allAssignedIds.includes(f.id));
              }

              const availableFiltered = availableRaw
                .filter(f => f.name.toLowerCase().includes(assignSearch.toLowerCase()))
                .sort((a, b) => {
                  const isChampion = assignDialog?.stage === "Champion" || assignDialog?.name.toLowerCase().includes("juara");
                  if (isChampion) {
                    const getStats = (pId: string) => {
                      for (let i = groups.length - 1; i >= 0; i--) {
                        const m = groups[i].members.find(x => x.playerId === pId);
                        if (m && m.score > 0) return { s: m.score, t: m.timeSeconds };
                      }
                      return { s: 0, t: 0 };
                    };
                    const sA = getStats(a.id);
                    const sB = getStats(b.id);
                    if (sB.s !== sA.s) return sB.s - sA.s;
                    return sA.t - sB.t;
                  }
                  return b.avgScore - a.avgScore;
                });

              if (availableFiltered.length === 0) {
                return <p className="text-sm text-muted-foreground text-center py-4">No players found</p>;
              }

              return (
                <>
                  {availableFiltered.map((player) => {
                    const isSel = assignSelected.includes(player.id);
                    const showAbsent = assignDialog?.stage === "Final" && player.isPresent === false;

                    return (
                      <div key={player.id}
                        onClick={() => {
                          setAssignSelected((p) => isSel ? p.filter((x) => x !== player.id) : [...p, player.id])
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setAssignSelected((p) => isSel ? p.filter((x) => x !== player.id) : [...p, player.id]);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors ${isSel ? "bg-primary/10 border border-primary/30 cursor-pointer" : "hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"}`}>
                        <input type="checkbox" checked={isSel} readOnly className="h-4 w-4 accent-primary" />
                        <Avatar className="h-7 w-7">
                          {player.avatar && <AvatarImage src={player.avatar} alt={player.name} />}
                          <AvatarFallback className="text-[10px]">{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex flex-col min-w-0 pr-2">
                          <span className="font-medium text-sm truncate flex items-center gap-1" title={player.name}>
                            {player.name}
                            {showAbsent && <Badge variant="destructive" className="text-[8px] h-4 px-1 py-0 ml-1">Absent</Badge>}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate leading-tight" title={`@${player.username || player.name.toLowerCase().replace(/\s+/g, '')}`}>
                            @{player.username || player.name.toLowerCase().replace(/\s+/g, '')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {player.category && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 h-4 font-normal tracking-wide bg-muted/50 border-muted-foreground/20 text-muted-foreground">
                              {player.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <span className="text-xs text-muted-foreground mr-auto">{assignSelected.length} selected</span>
            <Button variant="outline" onClick={() => { setAssignDialog(null); setAssignSelected([]); }}>Cancel</Button>
            <Button onClick={handleAssignPlayers} disabled={assignSelected.length === 0} className="gap-1.5">
              <UserPlus className="h-4 w-4" />Assign Action</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Rounds Dialog */}
      <Dialog open={!!roundsDialog} onOpenChange={(open) => { if (!open) setRoundsDialog(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 max-w-full overflow-hidden">
              <BookOpen className="h-5 w-5 shrink-0" />
              <span className="truncate">Assign Quiz & Game — {roundsDialog?.group.name}</span>
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Configure quizzes and games for each round</p>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 mt-2" onWheelCapture={(e) => e.stopPropagation()} onTouchMoveCapture={(e) => e.stopPropagation()}>
            {roundsDialog?.rounds.map((round, idx) => (
              <div key={idx} className="flex flex-col gap-3 p-4 border rounded-lg bg-card/50 relative dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Round {idx + 1}</span>
                  {roundsDialog.rounds.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:bg-destructive/10"
                      title="Remove round"
                      onClick={() => {
                        const newRounds = [...roundsDialog.rounds];
                        newRounds.splice(idx, 1);
                        setRoundsDialog({ ...roundsDialog, rounds: newRounds });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 min-w-0 flex flex-col">
                    <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" />Select Quiz</label>
                    <Combobox
                      tabs={[
                        { id: "public", label: "Public Quiz", icon: <BookOpen className="h-3 w-3" /> },
                        { id: "my", label: "My Quiz", icon: <Edit className="h-3 w-3" /> },
                      ]}
                      options={[{ value: "none", label: "None" }, ...quizzes
                        .filter(q => q.isPublic || q.creatorId === currentUserId)
                        .map(q => ({
                          value: q.id,
                          label: q.title,
                          group: q.creatorId === currentUserId ? "my" : "public",
                        }))
                      ]}
                      value={round.quizId || "none"}
                      onValueChange={(val: string) => {
                        const newRounds = [...roundsDialog.rounds];
                        const selectedQuizId = val === "none" ? "" : val;
                        newRounds[idx].quizId = selectedQuizId;

                        const selectedQuiz = getQuizById(selectedQuizId);
                        const currentSettings = newRounds[idx].settings || { durationMinutes: 10, questionCount: 10, sound: true, difficulty: "Easy" };
                        if (selectedQuiz) {
                          const maxCount = selectedQuiz.questionCount;
                          newRounds[idx].settings = {
                            ...currentSettings,
                            questionCount: Math.min(currentSettings.questionCount || 10, Math.max(1, maxCount)),
                          };
                        } else {
                          newRounds[idx].settings = currentSettings;
                        }

                        setRoundsDialog({ ...roundsDialog, rounds: newRounds });
                      }}
                      placeholder="Select quiz..."
                      searchPlaceholder="Search quiz..."
                      emptyText="No quizzes found."
                      className="w-full h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 min-w-0 flex flex-col">
                    <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                      <Gamepad2 className="h-3.5 w-3.5" />Select Game</label>
                    <Combobox
                      options={[{ value: "none", label: "None" }, ...games.map(g => ({ value: g.name, label: g.name }))]}
                      value={round.gameId || "none"}
                      onValueChange={(val: string) => {
                        const newRounds = [...roundsDialog.rounds];
                        newRounds[idx].gameId = val === "none" ? "" : val;
                        setRoundsDialog({ ...roundsDialog, rounds: newRounds });
                      }}
                      placeholder="Select game..."
                      searchPlaceholder="Search game..."
                      emptyText="No games found."
                      className="w-full h-10 text-sm capitalize"
                    />
                  </div>
                </div>

                {/* Game Settings */}
                {(round.quizId || round.gameId) && (
                  <div className="mt-3 bg-white border border-slate-200/80 shadow-sm shadow-slate-200/50 dark:bg-indigo-950/20 dark:border-indigo-900/50 dark:shadow-none rounded-2xl p-3 space-y-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-sky-100/80 bg-sky-50/80 px-3 py-2 text-[11px] text-slate-800 shadow-sm shadow-sky-200/50 dark:border-slate-700/80 dark:bg-slate-900/95 dark:text-slate-100 dark:shadow-none">
                      <Info className="h-3.5 w-3.5 text-sky-500 dark:text-sky-300" />
                      <span className="leading-tight font-medium">
                        {round.quizId ? (
                          `Soal tersedia: ${getQuizById(round.quizId)?.questionCount ?? 0}`
                        ) : (
                          "Pilih quiz untuk melihat jumlah soal tersedia."
                        )}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      {/* Duration */}
                      <div className="space-y-1 w-28">
                        <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Duration
                        </label>
                        <Select
                          value={String(round.settings?.durationMinutes ?? 10)}
                          onValueChange={(val: string) => {
                            const newRounds = [...roundsDialog.rounds];
                            const currentSettings = newRounds[idx].settings || { durationMinutes: 10, questionCount: 5, sound: true, difficulty: "Easy" };
                            newRounds[idx].settings = {
                              ...currentSettings,
                              durationMinutes: parseInt(val)
                            };
                            setRoundsDialog({ ...roundsDialog, rounds: newRounds });
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 10, 15, 20, 25, 30].map((num) => (
                              <SelectItem key={num} value={String(num)}>{num} Min</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Question Count */}
                      <div className="space-y-1 w-28">
                        <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> Limit
                        </label>
                        <Select
                          value={String(round.settings?.questionCount ?? 10)}
                          onValueChange={(val: string) => {
                            const newRounds = [...roundsDialog.rounds];
                            const currentSettings = newRounds[idx].settings || { durationMinutes: 10, questionCount: 10, sound: true, difficulty: "Easy" };
                            newRounds[idx].settings = {
                              ...currentSettings,
                              questionCount: parseInt(val)
                            };
                            setRoundsDialog({ ...roundsDialog, rounds: newRounds });
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Limit" />
                          </SelectTrigger>
                          <SelectContent>
                            {getQuestionLimitOptions(round.quizId).map((num) => (
                              <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Difficulty */}
                      <div className="space-y-1 w-28">
                        <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                          <Trophy className="h-3 w-3" /> Difficulty
                        </label>
                        <Select
                          value={round.settings?.difficulty ?? "Easy"}
                          onValueChange={(val: string) => {
                            const newRounds = [...roundsDialog.rounds];
                            const currentSettings = newRounds[idx].settings || { durationMinutes: 5, questionCount: 5, sound: true, difficulty: "Easy" };
                            newRounds[idx].settings = {
                              ...currentSettings,
                              difficulty: val
                            };
                            setRoundsDialog({ ...roundsDialog, rounds: newRounds });
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Easy">Easy</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed gap-2"
              onClick={() => {
                setRoundsDialog({
                  ...roundsDialog!,
                  rounds: [...roundsDialog!.rounds, {
                    quizId: "",
                    gameId: "",
                    settings: {
                      durationMinutes: 10,
                      questionCount: 10,
                      sound: true,
                      difficulty: "Easy"
                    }
                  }]
                });
              }}
            >
              <Plus className="h-4 w-4" /> Add Round ({roundsDialog?.rounds.length! + 1})
            </Button>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setRoundsDialog(null)}>Cancel</Button>
            <Button onClick={handleSaveRounds} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Save className="h-4 w-4" />Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        open={!!removeConfirm}
        onOpenChange={(open) => {
          if (!open) setRemoveConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove <span className="font-semibold text-foreground">{removeConfirm?.label}</span> from this group.
              {removeConfirm?.type === "member" && " You can assign them again later if needed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!removeConfirm) return;
                const groupId = removeConfirm.groupId;
                const group = groups.find((g) => g.id === groupId);
                if (!group) return;

                let newGroups = [...groups];

                if (removeConfirm.type === "member") {
                  const updatedMembers = group.members.filter((m) => m.playerId !== removeConfirm.itemId);
                  newGroups = groups.map((g) =>
                    g.id === groupId ? { ...g, members: updatedMembers } : g
                  );
                  if (detailDialog?.id === groupId) {
                    setDetailDialog({ ...group, members: updatedMembers } as any);
                  }
                  toast.success(`${removeConfirm.label} removed from group.`);
                } else if (removeConfirm.type === "quiz") {
                  const newRounds = group.rounds.map(r =>
                    r.quiz_id === removeConfirm.itemId ? { ...r, quiz_id: "" } : r
                  ).filter(r => r.quiz_id !== "" || r.game_id !== "").map((r, i) => ({ ...r, round: i + 1 }));
                  newGroups = groups.map((g) =>
                    g.id === groupId ? { ...g, rounds: newRounds } : g
                  );
                  if (detailDialog?.id === groupId) {
                    setDetailDialog({ ...group, rounds: newRounds } as any);
                  }
                  toast.success(`Quiz removed from group.`);
                } else if (removeConfirm.type === "game") {
                  const newRounds = group.rounds.map(r =>
                    r.game_id === removeConfirm.itemId ? { ...r, game_id: "" } : r
                  ).filter(r => r.quiz_id !== "" || r.game_id !== "").map((r, i) => ({ ...r, round: i + 1 }));
                  newGroups = groups.map((g) =>
                    g.id === groupId ? { ...g, rounds: newRounds } : g
                  );
                  if (detailDialog?.id === groupId) {
                    setDetailDialog({ ...group, rounds: newRounds } as any);
                  }
                  toast.success(`Game removed from group.`);
                }

                onGroupsChange(newGroups);
                setRemoveConfirm(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Group Dialog */}
      <Dialog open={!!editGroup} onOpenChange={(open) => { if (!open) setEditGroup(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Group Name</label>
              <Input
                placeholder="e.g. Group A"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpdateGroup()}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Stage</label>
              <Select value={editGroupStage} onValueChange={(val: string) => { setEditGroupStage(val); if (isFirstStage(val)) setEditGroupSources([]); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  {availableStageOptions.map((stage) => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!isFirstStage(editGroupStage) && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Source Groups</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal">
                      {editGroupSources.length > 0
                        ? `${editGroupSources.length} selected`
                        : "Select source"}
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[375px]" align="start">
                    <DropdownMenuLabel>Source Groups</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {groups
                      .filter((g) => g.id !== editGroup?.id)
                      .map((g) => {
                        const isSelected = editGroupSources.includes(g.id);
                        return (
                          <DropdownMenuCheckboxItem
                            key={g.id}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              setEditGroupSources((prev) =>
                                checked ? [...prev, g.id] : prev.filter((id) => id !== g.id)
                              );
                            }}
                          >
                            <span className="truncate max-w-[280px] inline-block mb-[-4px]" title={g.name}>
                              {g.name} <span className="text-muted-foreground">({g.stage || "Semifinal"})</span>
                            </span>
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    {groups.filter((g) => g.id !== editGroup?.id).length === 0 && (
                      <div className="px-2 py-4 text-xs text-muted-foreground text-center">No groups yet</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            {categories && categories.length > 0 && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={editGroupCategory || "none"} onValueChange={(val: string) => setEditGroupCategory(val === "none" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGroup(null)}>Cancel</Button>
            <Button onClick={handleUpdateGroup}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bracket Visualization */}
      {showBracket && groups.length > 0 && (() => {
        // Group by category only as requested
        const buckets: Record<string, LocalGroup[]> = {};
        
        filteredGroups.forEach(g => {
          const cat = g.category || "Uncategorized";
          const key = cat;
          if (!buckets[key]) buckets[key] = [];
          buckets[key].push(g);
        });
        
        const sortedKeys = Object.keys(buckets).sort();
        
        return (
          <div className="flex flex-col gap-6 mt-4">
            {/* Category filter specifically for Bracket view if showGroupStageHeader is false */}
            {!showGroupStageHeader && categories && categories.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center mb-2 w-full">
                <Badge
                  variant={activeCategoryFilter === "all" ? "default" : "outline"}
                  className="cursor-pointer select-none text-xs px-3 py-1"
                  onClick={() => setActiveCategoryFilter("all")}
                >All Categories</Badge>
                {categories.map(cat => (
                  <Badge
                    key={cat}
                    variant={activeCategoryFilter === cat ? "default" : "outline"}
                    className="cursor-pointer select-none text-xs px-3 py-1"
                    onClick={() => setActiveCategoryFilter(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            )}
            
            {sortedKeys.length === 0 && (
              <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed w-full max-w-4xl">
                <Trophy className="h-8 w-8 mx-auto opacity-30 mb-2" />
                <p className="text-sm">No bracket data found</p>
              </div>
            )}
            
            {sortedKeys.map(key => {
              const bgroups = buckets[key];
              
              const semifinal1 = bgroups.find(g => (g.stage === "Semifinal" || !g.stage || g.stage === "Group Stage") && g.name.includes("1"));
              const semifinal2 = bgroups.find(g => (g.stage === "Semifinal" || !g.stage || g.stage === "Group Stage") && g.name.includes("2"));
              const final = bgroups.find(g => g.stage === "Final");
              const champion = bgroups.find(g => g.stage === "Champion");
              
              const cardTitle = key;
              
              return (
                <div key={key} className="p-6 border rounded-xl bg-card shadow-sm overflow-x-auto w-full">
                  <div className="w-full flex justify-start min-w-[800px]">
                    <LiquipediaBracket
                      title={cardTitle !== "Uncategorized" ? cardTitle : undefined}
                      semifinal1={semifinal1}
                      semifinal2={semifinal2}
                      final={final}
                      champion={champion}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Add Group Dialog */}
      <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />Add Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-left">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Group Name</label>
              <Input
                placeholder="e.g. Group A"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddGroup();
                    setIsAddGroupOpen(false);
                  }
                }}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Stage</label>
              <Select value={newGroupStage} onValueChange={(val: string) => { setNewGroupStage(val); if (isFirstStage(val)) setNewGroupSources([]); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  {availableStageOptions.map((stage) => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {categories && categories.length > 0 && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={newGroupCategory || "none"} onValueChange={(val: string) => setNewGroupCategory(val === "none" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isFirstStage(newGroupStage) && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Stage Sources</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal">
                      <span className="truncate">
                        {newGroupSources.length === 0
                          ? "Stage Sources"
                          : `${newGroupSources.length} selected`}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[300px]">
                    <DropdownMenuLabel>Select Sources</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {groups.map((g) => (
                      <DropdownMenuCheckboxItem
                        key={g.id}
                        checked={newGroupSources.includes(g.id)}
                        onSelect={(e) => e.preventDefault()}
                        onCheckedChange={(checked) => {
                          setNewGroupSources(
                            checked
                              ? [...newGroupSources, g.id]
                              : newGroupSources.filter((id) => id !== g.id)
                          );
                        }}
                      >
                        <span className="truncate max-w-[240px] inline-block mb-[-4px]" title={g.name}>{g.name}</span>
                      </DropdownMenuCheckboxItem>
                    ))}
                    {groups.length === 0 && (
                      <div className="text-xs text-muted-foreground p-2 text-center">No groups available</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddGroupOpen(false)}>Cancel</Button>
            <Button onClick={() => { handleAddGroup(); setIsAddGroupOpen(false); }}>Add Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
