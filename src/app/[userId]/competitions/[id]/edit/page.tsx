"use client";

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { useTheme } from "next-themes";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

import { RichTextEditor } from "@/components/ui/rich-text-editor";

import { useRouter, useParams } from "next/navigation";
import { CompetitionService } from "@/features/competitions/data/service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertModal } from "@/components/ui/alert-modal";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  Upload,
  CalendarDays,
  Tags,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  X,
  Plus,
  Trash2,
  Edit,
  Sparkles,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import Link from "next/link";
import { LiquipediaBracket as StaticLiquipediaBracket } from "@/components/bracket/liquipedia-bracket";
import { LocationInput } from "@/components/location-input";


function ScheduleRowTimerControls({ match, onUpdateDuration }: { match: any, onUpdateDuration: (d: number) => void }) {
  const initialSeconds = match.countdown_duration
    ? (match.countdown_duration <= 300 ? match.countdown_duration * 60 : match.countdown_duration)
    : 1800;

  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  const [inputH, setInputH] = useState(Math.floor(initialSeconds / 3600).toString());
  const [inputM, setInputM] = useState(Math.floor((initialSeconds % 3600) / 60).toString());
  const [inputS, setInputS] = useState((initialSeconds % 60).toString());

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleTimer = () => {
    const newRunningState = !isRunning;
    setIsRunning(newRunningState);
    if (newRunningState) {
      const targetTime = Date.now() + (timeLeft * 1000);
      localStorage.setItem("mock_timer_target", targetTime.toString());
      localStorage.setItem("mock_timer_status", "running");
    } else {
      localStorage.setItem("mock_timer_status", "stopped");
    }
    window.dispatchEvent(new Event("storage"));
  };

  const resetTimer = () => {
    setIsRunning(false);
    const totalSecs = (parseInt(inputH) || 0) * 3600 + (parseInt(inputM) || 0) * 60 + (parseInt(inputS) || 0);
    setTimeLeft(totalSecs > 0 ? totalSecs : 1800);
    localStorage.setItem("mock_timer_status", "stopped");
    localStorage.removeItem("mock_timer_target");
    window.dispatchEvent(new Event("storage"));
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (h: string, m: string, s: string) => {
    setInputH(h); setInputM(m); setInputS(s);
    const totalSecs = (parseInt(h) || 0) * 3600 + (parseInt(m) || 0) * 60 + (parseInt(s) || 0);
    if (totalSecs > 0) {
      onUpdateDuration(totalSecs);
      if (!isRunning) setTimeLeft(totalSecs);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Timer Display */}
      <span className="text-sm font-mono min-w-[50px] text-center font-bold text-zinc-900 dark:text-white">
        {formatTime(timeLeft)}
      </span>

      {/* Controls */}
      <div className="flex items-center gap-0.5 border border-zinc-200 dark:border-white/10 rounded-md p-0.5 bg-white dark:bg-[#0a0a0a]">
        <button type="button" onClick={toggleTimer} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/10 rounded transition-colors text-[#00e599]">
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>
        <button type="button" onClick={resetTimer} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/10 rounded transition-colors text-zinc-500">
          <RotateCcw className="w-3 h-3" />
        </button>

        <div className="w-px h-3.5 bg-zinc-200 dark:bg-white/10 mx-0.5" />

        <Dialog>
          <DialogTrigger className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/10 rounded transition-colors text-zinc-500">
            <Edit className="w-3 h-3" />
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121212]">
            <DialogHeader>
              <DialogTitle>Set Timer Duration</DialogTitle>
            </DialogHeader>
            <div className="py-6 flex items-center justify-center gap-3">
              <div className="space-y-2 text-center">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Hours</label>
                <Input
                  type="number" min="0" value={inputH}
                  onChange={(e) => handleInputChange(e.target.value, inputM, inputS)}
                  className="w-20 h-16 text-center text-3xl font-bold bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                />
              </div>
              <span className="text-3xl font-bold text-zinc-500 pt-6">:</span>
              <div className="space-y-2 text-center">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Minutes</label>
                <Input
                  type="number" min="0" max="59" value={inputM}
                  onChange={(e) => handleInputChange(inputH, e.target.value, inputS)}
                  className="w-20 h-16 text-center text-3xl font-bold bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                />
              </div>
              <span className="text-3xl font-bold text-zinc-500 pt-6">:</span>
              <div className="space-y-2 text-center">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Seconds</label>
                <Input
                  type="number" min="0" max="59" value={inputS}
                  onChange={(e) => handleInputChange(inputH, inputM, e.target.value)}
                  className="w-20 h-16 text-center text-3xl font-bold bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function EditCompetitionPage() {
  const router = useRouter();
  const params = useParams();
  const compId = params.id as string;

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");

  const [isFabVisible, setIsFabVisible] = useState(false);

  useEffect(() => {
    let lastScrollY = 0;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      let currentScrollY = 0;
      let maxScroll = 0;

      if (target === document) {
        currentScrollY = window.scrollY;
        maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      } else {
        const el = target as HTMLElement;
        if (el.scrollTop === undefined) return;
        currentScrollY = el.scrollTop;
        maxScroll = el.scrollHeight - el.clientHeight;
      }

      // Ignore scroll events from small internal scrollable elements
      if (maxScroll < 200) return;

      if (currentScrollY < 100) {
        setIsFabVisible(false);
      } else {
        setIsFabVisible(currentScrollY < lastScrollY);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  const [alertData, setAlertData] = useState<{ isOpen: boolean; title?: string; message: string; type: "error" | "info" | "success" }>({ isOpen: false, message: "", type: "error" });
  const showAlert = (message: string, type: "error" | "info" | "success" = "error") => {
    setAlertData({ isOpen: true, message, type });
  };

  // State for the requested inputs
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [status, setStatus] = useState("draft");
  const [registrationLink, setRegistrationLink] = useState("");
  const [isLimit, setIsLimit] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState<number | null>(null);
  const [toSemifinal, setToSemifinal] = useState<number>(4);
  const [toFinal, setToFinal] = useState<number>(2);
  const [categories, setCategories] = useState<string[]>([]);
  const SUBJECT_SUGGESTIONS = [
    "Mathematics", "Physics", "Biology", "Chemistry", "English",
    "Indonesian", "Komputer & Informatika", "History", "Geography",
    "Economics", "Seni Budaya", "Olahraga", "Religion Education", "Robotik", "Kesenian"
  ];
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [isSubjectFocused, setIsSubjectFocused] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const PRIZE_WEIGHTS: Record<string, number> = {
    ["University"]: 5,
    ["General"]: 5,
    ["High School"]: 4,
    ["Middle School"]: 3,
    ["Elementary"]: 2,
    ["Kindergarten"]: 1
  };
  const [isSplitBySubject, setIsSplitBySubject] = useState(false);
  const [allocationPrizes, setAllocationPrizes] = useState<Record<string, { rank1: string, rank2: string, rank3: string }>>({});
  const [fee, setFee] = useState<string>("");
  const [totalPrize, setTotalPrize] = useState<string>("");
  const [isAutoCalculating, setIsAutoCalculating] = useState(false);

  const extractPrizeValue = (val: string) => {
    const match = val.match(/\d([0-9.,]*\d)?/);
    if (match) {
      return parseInt(match[0].replace(/\D/g, '')) || 0;
    }
    return 0;
  };

  const getAllocationKeys = () => {
    if (categories.length === 0) return [];
    if (isSplitBySubject && subjects.length > 0) {
      return categories.flatMap(c => subjects.map(s => `${c} - ${s}`));
    }
    return categories;
  };

  const handleAutoDistribute = (manualTotal?: number) => {
    const rawTotal = manualTotal !== undefined ? manualTotal : parseInt(totalPrize.replace(/\D/g, ''));
    if (!rawTotal || isNaN(rawTotal)) {
      if (manualTotal === undefined) showAlert("Please enter the Total Prize amount first.");
      return;
    }

    const keys = getAllocationKeys();
    if (keys.length === 0) {
      if (manualTotal === undefined) showAlert("Select at least one category first.");
      return;
    }

    const total = rawTotal;
    const selectedWeights = keys.map(k => PRIZE_WEIGHTS[k.split(" - ")[0]] || 1);
    const totalWeight = selectedWeights.reduce((a, b) => a + b, 0);

    const newPrizes: Record<string, { rank1: string, rank2: string, rank3: string }> = {};
    let currentSum = 0;

    keys.forEach((key, idx) => {
      const weight = selectedWeights[idx];
      let portion = Math.round((total * (weight / totalWeight)) / 1000) * 1000;

      // Ensure the sum perfectly matches the total by dumping the rounding remainder to the last item
      if (idx === keys.length - 1) {
        portion = total - currentSum;
      }

      let rank1 = Math.round((portion * 0.5) / 1000) * 1000;
      const rank2 = Math.round((portion * 0.3) / 1000) * 1000;
      let rank3 = portion - rank1 - rank2;

      // In case of any weird negative values from remainder dumping
      if (rank3 < 0) {
        rank1 += rank3;
        rank3 = 0;
      }

      newPrizes[key] = {
        rank1: rank1.toLocaleString('id-ID'),
        rank2: rank2.toLocaleString('id-ID'),
        rank3: rank3.toLocaleString('id-ID')
      };
      currentSum += portion;
    });

    setIsAutoCalculating(true);
    setAllocationPrizes(newPrizes);
    setTimeout(() => setIsAutoCalculating(false), 50);
  };

  useEffect(() => {
    if (totalPrize && !isAutoCalculating) {
      handleAutoDistribute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSplitBySubject, categories, subjects]);

  const handleAllocationChange = (key: string, rank: 'rank1' | 'rank2' | 'rank3', value: string) => {
    const current = allocationPrizes[key] || { rank1: "", rank2: "", rank3: "" };
    const updated = {
      ...allocationPrizes,
      [key]: { ...current, [rank]: value }
    };
    setAllocationPrizes(updated);

    if (!isAutoCalculating) {
      let sum = 0;
      Object.values(updated).forEach(p => {
        sum += extractPrizeValue(p.rank1) + extractPrizeValue(p.rank2) + extractPrizeValue(p.rank3);
      });
      setTotalPrize(sum.toLocaleString('id-ID'));
    }
  };

  const [scheduleData, setScheduleData] = useState<{
    registrationStart: string; registrationEnd: string;
    qualificationStart: string; qualificationEnd: string;
    grandfinalStart: string; grandfinalEnd: string;
  }>({
    registrationStart: "", registrationEnd: "",
    qualificationStart: "", qualificationEnd: "",
    grandfinalStart: "", grandfinalEnd: ""
  });

  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Schedule CRUD State
  const [matches, setMatches] = useState<any[]>([]);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isEditMatchModalOpen, setIsEditMatchModalOpen] = useState(false);
  const [isMatchUseSubject, setIsMatchUseSubject] = useState(false);
  const [newMatch, setNewMatch] = useState({ round: "", time: "", category: "", phase: "", subject: "", countdown_duration: 1800 });
  const [editingMatch, setEditingMatch] = useState<any>(null);

  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterPhase, setFilterPhase] = useState<string>("All");

  const handleAutoSchedule = () => {
    if (!scheduleData.qualificationStart || !scheduleData.grandfinalEnd) {
      showAlert("Please set the Qualification and Grand Final dates in the Schedule section first.");
      return;
    }
    if (categories.length === 0) {
      showAlert("Please add at least one category first.");
      return;
    }

    const start = new Date(scheduleData.qualificationStart);
    const end = new Date(scheduleData.grandfinalEnd);
    if (start > end) {
      showAlert("Qualification start date cannot be after Grand Final end date.");
      return;
    }

    // Default phases for bracket
    let phases: string[] = ["Qualification", "Semifinal", "Final"];

    const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const daysPerPhase = Math.max(1, Math.floor(totalDays / phases.length));

    const newMatches: any[] = [];
    let idCounter = Date.now();

    const targetCategories = categories;
    const targetSubjects = isSplitBySubject && subjects.length > 0 ? subjects : [""];

    targetCategories.forEach(cat => {
      targetSubjects.forEach(sub => {
        phases.forEach((phase, index) => {
          const matchDate = new Date(start.getTime() + (index * daysPerPhase * 24 * 60 * 60 * 1000));
          // Format date to datetime-local string (YYYY-MM-DDThh:mm)
          const isoString = new Date(matchDate.getTime() - (matchDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

          let numGroups = 1;
          if (phase === "Semifinal") numGroups = 2; // Hardcoded to 2 for Liquipedia static view

          for (let g = 1; g <= numGroups; g++) {
            newMatches.push({
              id: (idCounter++).toString(),
              category: cat,
              subject: sub,
              phase: phase,
              round: g.toString(),
              time: isoString,
              status: "Scheduled"
            });
          }
        });
      });
    });

    setMatches(prev => [...prev, ...newMatches]);
  };

  const getPhaseOrder = (phase: string) => {
    const phases = ["Qualification", "Semifinal", "Final"];
    const idx = phases.indexOf(phase);
    return idx !== -1 ? idx + 1 : 99;
  };

  const filteredAndSortedMatches = [...matches]
    .filter(m => filterCategory === "All" || m.category === filterCategory)
    .filter(m => filterPhase === "All" || m.phase === filterPhase)
    .sort((a, b) => {
      // 1. Sort by phase order
      const phaseA = getPhaseOrder(a.phase);
      const phaseB = getPhaseOrder(b.phase);
      if (phaseA !== phaseB) return phaseA - phaseB;

      // 2. Sort by group
      const groupA = parseInt(a.round) || 1;
      const groupB = parseInt(b.round) || 1;
      if (groupA !== groupB) return groupA - groupB;

      // 3. Sort by category (alphabetical)
      if (a.category !== b.category) return a.category.localeCompare(b.category);

      // 4. Sort by time (earliest first)
      const timeA = new Date(a.time).getTime();
      const timeB = new Date(b.time).getTime();
      return timeA - timeB;
    });

  const CATEGORIES = ["Kindergarten", "Elementary", "Middle School", "High School", "University", "General"];

  const toggleCategory = (cat: string) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const processImage = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const webpDataUrl = canvas.toDataURL('image/webp', 0.8);
          setPosterPreview(webpDataUrl);
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };



  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadComp = async () => {
      try {
        const comp = await CompetitionService.getCompetitionById(compId);
        if (mounted && comp) {
          setTitle(comp.name);
          setDescription(comp.description || "");
          setRules(comp.rules ? (Array.isArray(comp.rules) ? comp.rules.join('\\n') : String(comp.rules)) : "");
          setStatus(comp.status || "draft");
          setRegistrationLink(comp.registration_link || "");
          if (comp.max_participants) {
            setIsLimit(true);
            setMaxParticipants(comp.max_participants);
          }
          if (comp.categories) {
            setCategories(comp.categories.map((c: any) => typeof c === 'object' && c !== null ? c.name : c));
          }
          if (comp.subjects) {
            setSubjects(comp.subjects.map((s: any) => typeof s === 'object' && s !== null ? s.name : s));
          }
          if (comp.is_split_by_subject) setIsSplitBySubject(comp.is_split_by_subject);

          if (comp.entry_fee !== undefined) {
            setFee(comp.entry_fee.toString());
          }
          if (comp.total_prize !== undefined) {
            setTotalPrize(comp.total_prize.toString());
          }
          if (comp.prize_allocation) {
            setAllocationPrizes(comp.prize_allocation);
          }

          setScheduleData({
            registrationStart: comp.registration_start ? new Date(comp.registration_start).toISOString().slice(0, 16) : "",
            registrationEnd: comp.registration_end ? new Date(comp.registration_end).toISOString().slice(0, 16) : "",
            qualificationStart: comp.qualification_start ? new Date(comp.qualification_start).toISOString().slice(0, 16) : "",
            qualificationEnd: comp.qualification_end ? new Date(comp.qualification_end).toISOString().slice(0, 16) : "",
            grandfinalStart: comp.grandfinal_start ? new Date(comp.grandfinal_start).toISOString().slice(0, 16) : "",
            grandfinalEnd: comp.grandfinal_end ? new Date(comp.grandfinal_end).toISOString().slice(0, 16) : ""
          });

          if (comp.banner_url) {
            setPosterPreview(comp.banner_url);
          }

          if (comp.progression_details) {
            setToSemifinal(comp.progression_details.toSemifinal || 4);
            setToFinal(comp.progression_details.toFinal || 2);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    if (compId) loadComp();
    return () => { mounted = false; };
  }, [compId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      showAlert("Title is required");
      return;
    }

    const updateData: any = {
      name: title,
      description: description,
      rules: rules,
      category: categories[0] || 'General',
      is_limit: isLimit,
      max_participants: isLimit ? maxParticipants : null,
      progression_details: {
        toSemifinal,
        toFinal
      },
      categories: categories,
      subjects: subjects,
      is_split_by_subject: isSplitBySubject,
      registration_start: scheduleData.registrationStart ? new Date(scheduleData.registrationStart).toISOString() : null,
      registration_end: scheduleData.registrationEnd ? new Date(scheduleData.registrationEnd).toISOString() : null,
      qualification_start: scheduleData.qualificationStart ? new Date(scheduleData.qualificationStart).toISOString() : null,
      qualification_end: scheduleData.qualificationEnd ? new Date(scheduleData.qualificationEnd).toISOString() : null,
      grandfinal_start: scheduleData.grandfinalStart ? new Date(scheduleData.grandfinalStart).toISOString() : null,
      grandfinal_end: scheduleData.grandfinalEnd ? new Date(scheduleData.grandfinalEnd).toISOString() : null,
      status: status,
      banner_url: posterPreview,
      registration_link: registrationLink,
      entry_fee: Number(fee.replace(/\D/g, '') || 0),
      total_prize: Number(totalPrize.replace(/\D/g, '') || 0),
      prize_allocation: allocationPrizes,
      registration_fees: []
    };

    try {
      await CompetitionService.updateCompetition(compId, updateData);
      console.log("Competition updated:", updateData);

      showAlert("Success: Competition updated");
      setTimeout(() => {
        router.push(`/competitions/${compId}`);
      }, 1000);
    } catch (err) {
      console.error(err);
      showAlert("Error: Failed to update competition");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full pb-12 relative">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-20 rounded-md" />
        </div>
        <div className="space-y-8 bg-zinc-900/40 border border-zinc-800 p-8 rounded-xl shadow-xl">
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-12 relative">
      <AnimatePresence>
        {isFabVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <Button type="button" onClick={handleSubmit} className="bg-[#00e599] hover:bg-[#00c987] text-zinc-900 font-bold px-8 py-6 rounded-full shadow-2xl flex items-center gap-2 text-lg">
              Save
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center text-sm text-zinc-400 mb-1">
            <Link href="/competitions" className="hover:text-zinc-900 dark:text-white transition-colors">Competitions</Link>
            <ChevronRight className="w-4 h-4 mx-1" />
            <span className="text-zinc-900 dark:text-white">Edit</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Edit</h1>
        </div>
        <Button onClick={handleSubmit} className="bg-[#00e599] hover:bg-[#00c987] text-zinc-900 font-semibold px-6 rounded-md">Save</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-zinc-900/40 border border-zinc-800 p-8 rounded-xl text-zinc-900 dark:text-white shadow-xl">

        {/* Title */}
        <div className="space-y-2">
          <Label className="text-zinc-400 text-xs font-semibold">Title<span className="text-red-500">*</span></Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g. Online Quiz - Science"
            className="bg-zinc-50 dark:bg-[#121212] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-600 focus-visible:ring-[#00e599]"
            required
          />
        </div>

        {/* Location */}
        <div className="space-y-2 z-50">
          <Label className="text-zinc-400 text-xs font-semibold">Location<span className="text-red-500">*</span></Label>
          <LocationInput
            value={location}
            onChange={setLocation}
            className="bg-zinc-50 dark:bg-[#121212] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-600 focus-visible:ring-[#00e599]"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-zinc-400 text-xs font-semibold">Description</Label>
          <RichTextEditor
            content={description}
            onChange={setDescription}
            placeholder="Ketik deskripsi kompetisi di sini..."
          />
        </div>

        {/* Rules (with rich text toolbar) */}
        <div className="space-y-2">
          <Label className="text-zinc-400 text-xs font-semibold">Rules</Label>
          <RichTextEditor
            content={rules}
            onChange={setRules}
            placeholder="Tuliskan aturan kompetisi di sini..."
          />
        </div>

        {/* Grid Layout (Row-based to ensure perfect horizontal alignment) */}
        <div className="space-y-6 pt-4 border-t border-zinc-200 dark:border-white/5">

          {/* Row 1: Poster (Left) & Schedule + Category (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            {/* Left */}
            <div className="flex flex-col space-y-2">
              <Label className="text-zinc-400 text-xs font-semibold">Poster</Label>
              {posterPreview ? (
                <div className="relative border border-zinc-300 dark:border-white/20 rounded-xl flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#121212] overflow-hidden h-[400px]">
                  <img src={posterPreview} alt="Poster preview" className="max-w-full max-h-full object-contain drop-shadow-md py-4" />
                  <button
                    type="button"
                    onClick={() => setPosterPreview(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/90 hover:bg-red-500 text-zinc-900 dark:text-white shadow-md transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  className={`border border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden h-[400px] ${isDragging ? 'border-[#00e599] bg-[#00e599]/10' : 'border-zinc-300 dark:border-white/20 bg-zinc-50 dark:bg-[#121212] hover:bg-white/5'}`}
                >
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                  <Upload className={`w-6 h-6 mb-2 transition-colors ${isDragging ? 'text-[#00e599]' : 'text-zinc-500 hover:text-zinc-400'}`} />
                  <span className={`text-sm font-medium ${isDragging ? 'text-[#00e599]' : 'text-zinc-400'}`}>Click or drag to upload poster</span>
                  <span className="text-xs text-zinc-600 mt-1">Up to 5MB</span>
                </div>
              )}
            </div>

            {/* Right */}
            <div className="space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <Label className="text-zinc-400 text-xs font-semibold">Schedule<span className="text-red-500">*</span></Label>
                <div className="p-4 bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-white/10 rounded-xl shadow-sm space-y-4">
                  {/* REGISTRATION */}
                  <div className="space-y-2">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider flex items-center">Registration<span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={scheduleData.registrationStart}
                        onChange={(e) => setScheduleData({ ...scheduleData, registrationStart: e.target.value })}
                        className="bg-white dark:bg-[#1a1a1a] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus-visible:ring-[#00e599]"
                      />
                      <span className="text-zinc-500">-</span>
                      <Input
                        type="date"
                        value={scheduleData.registrationEnd}
                        onChange={(e) => setScheduleData({ ...scheduleData, registrationEnd: e.target.value })}
                        className="bg-white dark:bg-[#1a1a1a] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus-visible:ring-[#00e599]"
                      />
                    </div>
                  </div>

                  {/* QUALIFICATION */}
                  <div className="space-y-2">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider flex items-center">Qualification<span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={scheduleData.qualificationStart}
                        onChange={(e) => setScheduleData({ ...scheduleData, qualificationStart: e.target.value })}
                        className="bg-white dark:bg-[#1a1a1a] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus-visible:ring-[#00e599]"
                      />
                      <span className="text-zinc-500">-</span>
                      <Input
                        type="date"
                        value={scheduleData.qualificationEnd}
                        onChange={(e) => setScheduleData({ ...scheduleData, qualificationEnd: e.target.value })}
                        className="bg-white dark:bg-[#1a1a1a] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus-visible:ring-[#00e599]"
                      />
                    </div>
                  </div>

                  {/* FINAL */}
                  <div className="space-y-2">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider flex items-center">Final<span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={scheduleData.grandfinalStart}
                        onChange={(e) => setScheduleData({ ...scheduleData, grandfinalStart: e.target.value })}
                        className="bg-white dark:bg-[#1a1a1a] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus-visible:ring-[#00e599]"
                      />
                      <span className="text-zinc-500">-</span>
                      <Input
                        type="date"
                        value={scheduleData.grandfinalEnd}
                        onChange={(e) => setScheduleData({ ...scheduleData, grandfinalEnd: e.target.value })}
                        className="bg-white dark:bg-[#1a1a1a] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus-visible:ring-[#00e599]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs font-semibold">Category</Label>
                <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
                  <DialogTrigger className="flex items-center gap-3 p-3 w-full bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-white/10 rounded-md cursor-pointer hover:border-purple-500/50 transition-colors text-left">
                    <Tags className="w-5 h-5 text-purple-500 shrink-0" />
                    <span className="text-sm text-zinc-400">
                      {categories.length > 0 ? categories.join(", ") : "Click to set categories..."}
                    </span>
                  </DialogTrigger>
                  <DialogContent className="bg-white dark:bg-[#1a1a1a] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-lg">
                        <Tags className="w-5 h-5 text-purple-500" />Category</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 py-4">
                      {CATEGORIES.map(cat => (
                        <div
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-sm font-medium transition-all duration-200 border ${categories.includes(cat) ? 'bg-[#00e599]/10 text-[#00e599] border-[#00e599]/50' : 'bg-zinc-50 dark:bg-[#121212] text-zinc-400 border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:border-white/20 hover:bg-white/5'}`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${categories.includes(cat) ? 'bg-[#00e599] border-[#00e599] text-zinc-900' : 'border-zinc-600'}`}>
                            {categories.includes(cat) && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          {cat}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button type="button" onClick={() => setIsCategoryOpen(false)} className="bg-[#00e599] hover:bg-[#00c987] text-zinc-900">Completed</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Row 2: Status (Left) & Subjects (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div className="flex gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs font-semibold">Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val || "draft")}>
                  <SelectTrigger className="w-32 bg-zinc-50 dark:bg-[#121212] border-zinc-200 dark:border-white/10 focus:ring-[#00e599]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1a1a1a] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="publish">Publish</SelectItem>
                  </SelectContent>
                </Select>
              </div>


            </div>

            <div className="space-y-2 relative">
              <Label className="text-zinc-400 text-xs font-semibold">Subject</Label>
              <div
                className="flex flex-wrap gap-2 p-2 bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-white/10 rounded-md focus-within:ring-1 focus-within:border-[#00e599] transition-all cursor-text min-h-[42px]"
                onClick={() => document.getElementById("subject-input")?.focus()}
              >
                {subjects.map((sub, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-[#00e599]/10 text-[#00e599] hover:bg-[#00e599]/20 flex items-center gap-1 border-none font-normal text-xs py-1">
                    {sub}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSubjects(subjects.filter(s => s !== sub)); }}
                      className="hover:text-zinc-900 dark:text-white rounded-full p-0.5 ml-1 transition-colors focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  id="subject-input"
                  type="text"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onFocus={() => setIsSubjectFocused(true)}
                  onBlur={() => setTimeout(() => setIsSubjectFocused(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (subjectInput.trim() && !subjects.includes(subjectInput.trim())) {
                        setSubjects([...subjects, subjectInput.trim()]);
                        setSubjectInput("");
                      }
                    } else if (e.key === 'Backspace' && !subjectInput && subjects.length > 0) {
                      setSubjects(subjects.slice(0, -1));
                    }
                  }}
                  className="flex-1 bg-transparent border-none text-zinc-900 dark:text-white text-sm focus:outline-none min-w-[120px] placeholder:text-zinc-600"
                  placeholder={subjects.length === 0 ? "Type and press Enter..." : ""}
                />
              </div>

              {isSubjectFocused && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/10 rounded-md shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                  {SUBJECT_SUGGESTIONS
                    .filter(s => s.toLowerCase().includes(subjectInput.toLowerCase()) && !subjects.includes(s))
                    .length > 0 ? (
                    SUBJECT_SUGGESTIONS
                      .filter(s => s.toLowerCase().includes(subjectInput.toLowerCase()) && !subjects.includes(s))
                      .map((suggestion) => (
                        <div
                          key={suggestion}
                          onClick={() => {
                            if (!subjects.includes(suggestion)) {
                              setSubjects([...subjects, suggestion]);
                              setSubjectInput("");
                            }
                          }}
                          className="px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-900 dark:text-white cursor-pointer transition-colors"
                        >
                          {suggestion}
                        </div>
                      ))
                  ) : subjectInput.trim() ? (
                    <div
                      onClick={() => {
                        if (!subjects.includes(subjectInput.trim())) {
                          setSubjects([...subjects, subjectInput.trim()]);
                          setSubjectInput("");
                        }
                      }}
                      className="px-3 py-2 text-sm text-[#00e599] hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      {"Update"} "{subjectInput.trim()}"
                    </div>
                  ) : (
                    <div className="px-3 py-2 text-sm text-zinc-500 italic">Ketik untuk mencari...</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Registration Link (Left) & Fee + Total Prize (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs font-semibold">Registration Link</Label>
              <Input
                placeholder="https://..."
                className="bg-zinc-50 dark:bg-[#121212] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-600 focus-visible:ring-[#00e599]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs font-semibold">Total Prize</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Total Overall"
                    value={totalPrize}
                    onChange={(e) => {
                      const numericString = e.target.value.replace(/\D/g, "");
                      if (!numericString) {
                        setTotalPrize("");
                        setAllocationPrizes({}); // Reset allocation if total is empty
                      } else {
                        const val = parseInt(numericString, 10);
                        setTotalPrize(val.toLocaleString('id-ID'));
                        handleAutoDistribute(val); // Auto distribute seamlessly as user types
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAutoDistribute();
                      }
                    }}
                    className="bg-zinc-50 dark:bg-[#121212] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-600 focus-visible:ring-[#00e599]"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {categories.length > 0 && (
          <div className="space-y-4 mt-6 border-t border-zinc-200 dark:border-white/5 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Label className="text-zinc-300 text-sm font-semibold">Prize Allocation</Label>
              {subjects.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="split-subject"
                    checked={isSplitBySubject}
                    onCheckedChange={(c) => setIsSplitBySubject(c as boolean)}
                    className="border-zinc-300 dark:border-white/20 data-[state=checked]:bg-[#00e599] data-[state=checked]:text-zinc-900 w-4 h-4"
                  />
                  <Label htmlFor="split-subject" className="text-zinc-400 text-xs font-semibold cursor-pointer">Separate by Subject</Label>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {getAllocationKeys().map(key => (
                <div key={key} className="space-y-4 bg-white dark:bg-[#1a1a1a] p-5 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm">
                  <Label className="text-[#00e599] text-sm uppercase font-bold tracking-wider block border-b border-zinc-200 dark:border-white/5 pb-2 mb-3">{key}</Label>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border-none w-20 py-1.5 justify-center text-xs font-bold shadow-sm">1st Place</Badge>
                      <Input
                        type="text"
                        placeholder="Rp / Prize"
                        value={allocationPrizes[key]?.rank1 || ""}
                        onChange={(e) => handleAllocationChange(key, 'rank1', e.target.value)}
                        className="bg-zinc-50 dark:bg-[#121212] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-600 focus-visible:ring-yellow-500 h-10 text-sm shadow-inner"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-zinc-300/20 text-zinc-300 hover:bg-zinc-300/30 border-none w-20 py-1.5 justify-center text-xs font-bold shadow-sm">2nd Place</Badge>
                      <Input
                        type="text"
                        placeholder="Rp / Prize"
                        value={allocationPrizes[key]?.rank2 || ""}
                        onChange={(e) => handleAllocationChange(key, 'rank2', e.target.value)}
                        className="bg-zinc-50 dark:bg-[#121212] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-600 focus-visible:ring-zinc-400 h-10 text-sm shadow-inner"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-orange-700/20 text-orange-500 hover:bg-orange-700/30 border-none w-20 py-1.5 justify-center text-xs font-bold shadow-sm">3rd Place</Badge>
                      <Input
                        type="text"
                        placeholder="Rp / Prize"
                        value={allocationPrizes[key]?.rank3 || ""}
                        onChange={(e) => handleAllocationChange(key, 'rank3', e.target.value)}
                        className="bg-zinc-50 dark:bg-[#121212] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-600 focus-visible:ring-orange-500 h-10 text-sm shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Registration Fee Section */}
        <div className="space-y-2 mt-6 border-t border-zinc-200 dark:border-white/5 pt-6">
          <Label className="text-zinc-400 text-xs font-semibold">Registration Fee</Label>
          <Input
            type="text"
            placeholder="Rp 0 (Free)"
            value={fee}
            onChange={(e) => {
              const numericString = e.target.value.replace(/\D/g, "");
              if (!numericString) {
                setFee("");
              } else {
                const val = parseInt(numericString, 10);
                setFee(val.toLocaleString('id-ID'));
              }
            }}
            className="w-full bg-zinc-50 dark:bg-[#121212] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-600 focus-visible:ring-[#00e599]"
          />
        </div>


        {/* Configuration Section Requested by User */}
        <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-white/5">
          <h3 className="text-lg font-semibold mb-6 text-zinc-900 dark:text-white tracking-tight">Tournament Configuration</h3>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">



              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    id="limit"
                    checked={isLimit}
                    onCheckedChange={(c) => setIsLimit(c as boolean)}
                    className="border-zinc-300 dark:border-white/20 data-[state=checked]:bg-[#00e599] data-[state=checked]:text-zinc-900"
                  />
                  <Label htmlFor="limit" className="text-zinc-400 text-xs font-semibold cursor-pointer">Set Participant Limit</Label>
                </div>
                <Input
                  type="number"
                  placeholder={!isLimit ? "Unlimited Participants" : "e.g. 64"}
                  disabled={!isLimit}
                  value={maxParticipants || ""}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value) || null)}
                  className="bg-zinc-50 dark:bg-[#121212] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-600 focus-visible:ring-[#00e599] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-zinc-400 text-xs font-semibold">Ke Semifinal</Label>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={toSemifinal}
                  onChange={(e) => setToSemifinal(parseInt(e.target.value) || 0)}
                  className="bg-zinc-50 dark:bg-[#121212] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus-visible:ring-[#00e599]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-zinc-400 text-xs font-semibold">Ke Final</Label>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={toFinal}
                  onChange={(e) => setToFinal(parseInt(e.target.value) || 0)}
                  className="bg-zinc-50 dark:bg-[#121212] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus-visible:ring-[#00e599]"
                />
              </div>

            </div>


          </div>
        </div>

        {/* Functional Bracket Preview */}
        <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-white/5">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">Bracket</h3>
          </div>
          <div className="border border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-[#121212] overflow-hidden min-h-[300px] flex items-center justify-center p-8">
            <StaticLiquipediaBracket />
          </div>
        </div>
      </form>

      <AlertModal
        isOpen={alertData.isOpen}
        onClose={() => setAlertData({ ...alertData, isOpen: false })}
        title={alertData.title}
        message={alertData.message}
        type={alertData.type}
      />
    </div>
  );
}
