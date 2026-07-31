"use client";

import { getScoreTextClass } from "@/lib/utils";
import { DummyPlayer } from "@/types/competition";
import { CreditCard, Gamepad2, Trophy, Search, CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { TimezoneDisplay } from "@/components/shared/timezone-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";

interface PhasePaymentProps {
  competition?: any;
  players: DummyPlayer[];
  refreshData?: () => void;
  dbTotalPaid?: number;
}

export function PhasePayment({
  competition,
  players,
  refreshData,
  dbTotalPaid,
}: PhasePaymentProps) {
  const [paymentToggleDialog, setPaymentToggleDialog] = useState<DummyPlayer | null>(null);
  const [selectedPlayerForSessions, setSelectedPlayerForSessions] = useState<DummyPlayer | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const isSeparate = competition?.is_split_by_subject === true;
  const availableCategories = Array.from(new Set(players.map(p => p.category).filter(Boolean))) as string[];
  const availableSubjects = Array.from(new Set(players.map(p => p.subject).filter(Boolean))) as string[];

  const categoryOrder = ["tk", "sd/mi", "smp/mts", "sma/smk/ma", "mahasiswa"];
  const getCategoryRank = (cat?: string) => {
    if (!cat) return 999;
    const idx = categoryOrder.indexOf(cat.toLowerCase());
    return idx === -1 ? 999 : idx;
  };

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.username && p.username.toLowerCase().includes(search.toLowerCase())) ||
      (p.schoolName && p.schoolName.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = categoryFilter === "all" || p.category === categoryFilter;
    const matchesSub = !isSeparate || subjectFilter === "all" || p.subject === subjectFilter;

    return matchesSearch && matchesCat && matchesSub;
  });

  filteredPlayers.sort((a, b) => {
    const rankA = getCategoryRank(a.category);
    const rankB = getCategoryRank(b.category);
    if (rankA !== rankB) return rankA - rankB;
    return a.name.localeCompare(b.name);
  });

  const totalCount = filteredPlayers.length;
  const sorted = filteredPlayers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalRegistered = players.length;
  const totalPaid = dbTotalPaid ?? players.filter(p => p.paid).length;

  const onPageChange = (page: number) => setCurrentPage(page);
  const onPageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };
  const onSearch = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const onTogglePayment = async (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    try {
      const { ParticipantService } = await import("@/features/participants/data/service");
      await ParticipantService.updatePayment(playerId, !player.paid);
      if (refreshData) refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const fromIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toIndex = Math.min(currentPage * pageSize, totalCount);
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Payment ({totalRegistered})</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            placeholder="Search player"
            value={search}
            onSearch={onSearch}
            className="w-full sm:w-56 h-9"
          />
          {availableCategories.length > 0 && (
            <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px] h-9 shrink-0 bg-background border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap truncate">
                  <SlidersHorizontal className="h-3.5 w-3.5 hidden sm:block" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {isSeparate && availableSubjects.length > 0 && (
            <Select value={subjectFilter} onValueChange={(val) => { setSubjectFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px] h-9 shrink-0 bg-background border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap truncate">
                  <SlidersHorizontal className="h-3.5 w-3.5 hidden sm:block" />
                  <SelectValue placeholder="Subject" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {availableSubjects.map(sub => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="rounded-md border bg-card hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center">#</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>School</TableHead>
              <TableHead className="text-center">Play</TableHead>
              <TableHead className="text-center">Avg</TableHead>
              <TableHead className="text-center">Payment Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">No players found</TableCell>
              </TableRow>
            ) : (
              sorted.map((player, idx) => {
                const absoluteIdx = (currentPage - 1) * pageSize + idx + 1;
                return (
                  <TableRow key={player.id} className={!player.paid ? "opacity-60" : ""}>
                    <TableCell className="text-center text-sm text-muted-foreground">{absoluteIdx}</TableCell>
                    <TableCell>
                      <Link href={`/users/${player.userId || player.id}`} target="_blank" className="flex items-center gap-2 group p-1.5 -ml-1.5 rounded-md hover:bg-muted/50 transition-colors w-fit">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={player.avatar || ""} alt={player.name} className="object-cover" />
                          <AvatarFallback className="text-[10px]">
                            {player.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm truncate group-hover:text-primary transition-colors" title={player.name}>{player.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate" title={`@${player.username || player.name}`}>
                            @{player.username || player.name.toLowerCase().replace(/\s+/g, '')}
                          </span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {player.category ? (
                        <Badge variant="outline" className="text-[10px] font-medium bg-muted/20">
                          {player.category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs font-medium px-2">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {player.schoolName ? (
                        <span className="text-sm text-foreground/80 font-medium">
                          {player.schoolName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => setSelectedPlayerForSessions(player)}
                        className="flex items-center justify-center gap-1 w-full hover:bg-muted/50 p-1.5 rounded-md cursor-pointer transition-colors"
                        title="Game Sessions"
                      >
                        <Gamepad2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-primary hover:underline">{player.gamesPlayed}</span>
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => setSelectedPlayerForSessions(player)}
                        className="flex items-center justify-center gap-1 w-full hover:bg-muted/50 p-1.5 rounded-md cursor-pointer transition-colors"
                        title="Game Sessions"
                      >
                        <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                        <span className={`font-medium ${getScoreTextClass(player.avgScore)} hover:underline`}>{player.avgScore.toFixed(1)}</span>
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => setPaymentToggleDialog(player)}
                        className="cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-none p-0 outline-none"
                      >
                        {player.paid ? (
                          <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-600 border-emerald-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px] bg-red-500/10 text-red-500 border-red-300">Unpaid</Badge>
                        )}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-2">
        {sorted.length === 0 ? (
          <div className="rounded-md border bg-card text-center py-8 text-muted-foreground">No players found</div>
        ) : (
          sorted.map((player, idx) => {
            const absoluteIdx = (currentPage - 1) * pageSize + idx + 1;
            return (
              <div key={player.id} className={`rounded-lg border bg-card p-3 space-y-2 ${!player.paid ? "opacity-60" : ""}`}>
                {/* Player header */}
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground shrink-0">{absoluteIdx}</span>
                  <Link href={`/users/${player.userId || player.id}`} target="_blank" className="flex items-center gap-2 group min-w-0 flex-1">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={player.avatar || ""} alt={player.name} className="object-cover" />
                      <AvatarFallback className="text-[10px]">
                        {player.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">{player.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">@{player.username || player.name.toLowerCase().replace(/\s+/g, '')}</span>
                      {player.schoolName && (
                        <span className="text-[10px] text-primary/80 font-medium truncate mt-0.5">
                          {player.schoolName}
                        </span>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={() => setPaymentToggleDialog(player)}
                    className="cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-none p-0 outline-none shrink-0"
                  >
                    {player.paid ? (
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-300 gap-0.5">
                        <CheckCircle2 className="h-3 w-3" />Paid</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-500 border-red-300">Unpaid</Badge>
                    )}
                  </button>
                </div>
                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/50">
                  {player.category && (
                    <Badge variant="outline" className="text-[9px] font-medium bg-muted/20">
                      {player.category}
                    </Badge>
                  )}
                  <button onClick={() => setSelectedPlayerForSessions(player)} className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors">
                    <Gamepad2 className="h-3 w-3" />
                    <span className="text-primary font-medium">{player.gamesPlayed}</span>
                  </button>
                  <button onClick={() => setSelectedPlayerForSessions(player)} className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors">
                    <Trophy className="h-3 w-3 text-yellow-500" />
                    <span className={`font-medium ${getScoreTextClass(player.avgScore)}`}>{player.avgScore.toFixed(1)}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Premium Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50">
          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">Show :</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-border bg-card text-xs font-semibold px-2 py-1 outline-none focus:ring-1 focus:ring-primary hover:bg-muted/50 transition-colors"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-center">

            {/* Pagination Navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md bg-card border border-border hover:bg-muted hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md bg-card border border-border hover:bg-muted hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Render numbered pages (max 5 around current page) */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
                .map((p, index, arr) => {
                  const isCurrent = p === currentPage;
                  const showEllipsis = index > 0 && p - arr[index - 1] > 1;

                  return (
                    <div key={p} className="flex items-center gap-1">
                      {showEllipsis && <span className="text-xs text-muted-foreground px-1">...</span>}
                      <Button
                        variant={isCurrent ? "default" : "outline"}
                        size="icon"
                        className={`h-8 w-8 text-xs font-semibold rounded-md transition-all cursor-pointer ${isCurrent
                          ? "bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm scale-105"
                          : "bg-card border border-border hover:bg-muted hover:text-foreground"
                          }`}
                        onClick={() => onPageChange(p)}
                      >
                        {p}
                      </Button>
                    </div>
                  );
                })}

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md bg-card border border-border hover:bg-muted hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md bg-card border border-border hover:bg-muted hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmActionDialog
        open={!!paymentToggleDialog}
        onOpenChange={(open: boolean) => !open && setPaymentToggleDialog(null)}
        title="Ubah Status Pembayaran"
        description={`$"Apakah Anda yakin ingin mengubah status pembayaran untuk" ${paymentToggleDialog?.name} $"menjadi" ${!paymentToggleDialog?.paid ? ("Paid") : ("Belum Lunas")}?`}
        onConfirm={() => {
          if (paymentToggleDialog) {
            onTogglePayment(paymentToggleDialog.id);
            setPaymentToggleDialog(null);
          }
        }}
        confirmText="Ubah"
        cancelText="Cancel"
      />

      <Dialog open={!!selectedPlayerForSessions} onOpenChange={(open: boolean) => !open && setSelectedPlayerForSessions(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              <span>Sessions for<span className="text-primary">{selectedPlayerForSessions?.name}</span>
              </span>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[400px] mt-4 pr-4">
            {(!selectedPlayerForSessions?.sessions || selectedPlayerForSessions.sessions.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p>msg.no_data</p>
                <p className="text-xs text-muted-foreground/70 mt-1">("Only finished sessions played after registration count")</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedPlayerForSessions.sessions.map((sess, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-3 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">#{idx + 1}</span>
                        <span className="font-medium text-sm truncate max-w-[220px]" title={sess.quizTitle || sess.application || "Unknown Quiz"}>
                          {sess.quizTitle || sess.application || "Unknown Quiz"}
                        </span>
                        {sess.application && sess.quizTitle && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold border text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted/10">
                            {sess.application}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        <TimezoneDisplay date={sess.createdAt} sourceTimezone={(selectedPlayerForSessions as any)?.timezone} compact showBadge />
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm mt-1">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="font-semibold text-foreground">{sess.score}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span>⏱️</span>
                        <span>{sess.timeSeconds >= 60 ? `${Math.floor(sess.timeSeconds / 60)}m ${sess.timeSeconds % 60}s` : `${sess.timeSeconds}s`}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
