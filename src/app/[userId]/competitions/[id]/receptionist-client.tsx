"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  CheckCircle2,
  UserCheck,
  Users,
  X,
  QrCode,
  Camera,
  ScanLine,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CompetitionService } from "@/features/competitions/data/service";
import { ParticipantService } from "@/features/participants/data/service";

// Define our types from the dummy services
import { Competition } from "@/features/competitions/data/types";
import { Participant as ServiceParticipant } from "@/features/participants/data/types";

interface Participant {
  id: string;
  userId: string;
  fullname: string;
  username: string;
  avatar_url: string | null;
  attended: boolean;
  category: string;
  schoolName?: string;
}

export default function ReceptionistClient({ compId: propCompId }: { compId: string }) {
  const params = useParams<{ userId: string }>();
  const compId = propCompId;

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [participantQuery, setParticipantQuery] = useState("");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [scanResult, setScanResult] = useState<{ status: 'success' | 'error' | 'info', message: string } | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const scannerRef = useRef<any>(null);
  const lastScanRef = useRef<{ text: string; time: number } | null>(null);

  const handleParticipantSearch = (val: string) => setParticipantQuery(val);

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [comp, rawParticipants] = await Promise.all([
        CompetitionService.getCompetitionById(compId),
        ParticipantService.getParticipantsByCompetition(compId)
      ]);
      if (comp) setCompetition(comp);

      const allParticipants: Participant[] = rawParticipants.map((p, i) => {
        return {
          id: p.id,
          userId: p.user_id || `user-${i}`,
          fullname: p.name,
          username: p.username || p.name.toLowerCase().replace(/\s/g, ''),
          avatar_url: p.avatar || null,
          attended: p.is_present || false,
          category: p.category || "General",
          schoolName: p.school_name || "Unknown School",
        };
      });

      // Extract unique categories
      const uniqueCats = Array.from(new Set(allParticipants.map(p => p.category)));
      const categoryOrder = ["Kindergarten", "SD/MI", "SMP/MTs", "SMA/SMK/MA", "University"];
      uniqueCats.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      });
      setCategories(uniqueCats);
      setParticipants(allParticipants);
      setIsLoading(false);
    }
    fetchData();
  }, [compId, refreshTrigger]);

  const participantsRef = useRef(participants);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  // QR Scanner lifecycle
  useEffect(() => {
    if (!qrDialogOpen) {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => { });
        } catch (e) { /* ignore */ }
        scannerRef.current = null;
      }
      setScanResult(null);
      return;
    }

    let mounted = true;
    const initScanner = async () => {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
      if (!mounted) return;
      await new Promise((r) => setTimeout(r, 400));
      const el = document.getElementById("qr-reader");
      if (!el) return;
      const scanner = new Html5Qrcode("qr-reader", {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        verbose: false,
      });
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            const now = Date.now();
            if (lastScanRef.current && lastScanRef.current.text === decodedText && now - lastScanRef.current.time < 3000) {
              return;
            }
            lastScanRef.current = { text: decodedText, time: now };

            let scannedUserId = decodedText.trim();
            const matchedParticipant = participantsRef.current.find(p => p.userId === scannedUserId);

            if (!matchedParticipant) {
              setScanResult({ status: 'error', message: `Participant not found for ID: ${scannedUserId}` });
              return;
            }

            if (matchedParticipant.attended) {
              setScanResult({ status: 'info', message: `${matchedParticipant.fullname} is already checked in.` });
              return;
            }

            try {
              await ParticipantService.toggleAttendance(matchedParticipant.id, true);
              setRefreshTrigger(prev => prev + 1);
              setScanResult({ status: 'success', message: `${matchedParticipant.fullname} successfully checked in!` });
            } catch (err: any) {
              setScanResult({ status: 'error', message: err.message });
            }
          },
          () => { }
        );
      } catch (err) {
        console.warn("Failed to start QR scanner", err);
      }
    };
    initScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        try { scannerRef.current.stop().catch(() => { }); } catch (e) { /* ignore */ }
      }
    };
  }, [qrDialogOpen]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 pb-20 w-full min-h-screen">
        <Skeleton className="h-4 w-48" /> {/* Breadcrumb */}
        
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-10 w-3/4 max-w-md" /> {/* Title */}
            <Skeleton className="h-6 w-full max-w-sm" /> {/* Stats */}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Skeleton className="h-10 w-10 rounded-md" /> {/* Refresh Btn */}
            <Skeleton className="h-10 w-24 rounded-md" /> {/* Scan Btn */}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl border shadow-sm p-5 space-y-5">
            <Skeleton className="h-6 w-32" /> {/* Categories title */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Competition Not Found</h2>
        <Button onClick={() => window.history.back()}>Back</Button>
      </div>
    );
  }

  const attendedCount = participants.filter(p => p.attended).length;
  const totalCount = participants.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 pb-20 w-full min-h-screen">
      <nav className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Link href={`/${params?.userId}/competitions`} className="hover:text-primary transition-colors">
          Competitions
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Receptionist</span>
      </nav>

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground line-clamp-1">
              {competition.name}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span className="text-foreground">{totalCount}</span> Participants
            </div>
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-foreground">{attendedCount}</span> Checked In
            </div>
            {totalCount > 0 && (
              <div className="flex items-center gap-1.5 min-w-[100px]">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((attendedCount / totalCount) * 100)}%` }}
                  />
                </div>
                <span className="text-xs">{Math.round((attendedCount / totalCount) * 100)}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            title="Refresh Data"
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setQrDialogOpen(true)} className="gap-2 flex-1 md:flex-initial shadow-sm">
            <QrCode className="h-4 w-4" />
            Scan
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-card rounded-xl border shadow-sm p-5 space-y-5">
          <div className="flex items-center gap-2 font-semibold">
            <Users className="h-5 w-5 text-primary" />
            Categories
          </div>

          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No categories available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
              {categories.map((category) => {
                const categoryMembers = participants.filter(p => p.category === category);
                const categoryAttended = categoryMembers.filter(p => p.attended).length;
                const isCollapsed = collapsedCategories[category];

                return (
                  <div key={category} className="border rounded-lg overflow-hidden flex flex-col">
                    <div
                      className="bg-muted/40 p-3 flex items-center justify-between cursor-pointer hover:bg-muted/60 transition-colors select-none"
                      onClick={() => toggleCategoryCollapse(category)}
                    >
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{category}</div>
                        <div className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-emerald-600 font-medium">{categoryAttended}/{categoryMembers.length} in</span>
                        </div>
                      </div>
                      {isCollapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                    </div>

                    {!isCollapsed && (
                      <div className="p-2 space-y-1 bg-card border-t">
                        {categoryMembers.length === 0 ? (
                          <div className="text-xs text-muted-foreground p-2 text-center">No members found.</div>
                        ) : (
                          categoryMembers.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 text-sm">
                              <span className={p.attended ? "" : "text-muted-foreground"}>{p.fullname}</span>
                              {p.attended ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <div className="h-1.5 w-1.5 rounded-full bg-secondary shrink-0" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {qrDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border">
            <div className="p-4 border-b flex justify-between items-center bg-muted/30">
              <div className="font-semibold flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-primary" />
                Scan QR Ticket
              </div>
              <Button variant="ghost" size="icon" onClick={() => setQrDialogOpen(false)} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="w-full aspect-square max-w-[280px] bg-black rounded-xl overflow-hidden relative shadow-inner mb-6 border">
                <div id="qr-reader" className="w-full h-full object-cover"></div>
                <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none rounded-xl" style={{ clipPath: 'polygon(0 0, 20% 0, 20% 5%, 5% 5%, 5% 20%, 0 20%, 0 0, 80% 0, 100% 0, 100% 20%, 95% 20%, 95% 5%, 80% 5%, 80% 0, 100% 80%, 100% 100%, 80% 100%, 80% 95%, 95% 95%, 95% 80%, 100% 80%, 0 80%, 0 100%, 20% 100%, 20% 95%, 5% 95%, 5% 80%, 0 80%)' }}></div>
              </div>

              {scanResult ? (
                <div className={`w-full p-4 rounded-xl flex items-start gap-3 border ${scanResult.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                  scanResult.status === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400' :
                    'bg-destructive/10 border-destructive/20 text-destructive'
                  }`}>
                  {scanResult.status === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" /> :
                    scanResult.status === 'info' ? <UserCheck className="h-5 w-5 shrink-0 mt-0.5" /> :
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />}
                  <div className="text-sm font-medium leading-tight">{scanResult.message}</div>
                </div>
              ) : (
                <div className="text-center space-y-1">
                  <p className="font-medium text-foreground">Arahkan kamera ke QR Code peserta</p>
                  <p className="text-xs text-muted-foreground">Peserta akan otomatis tercatat hadir</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
