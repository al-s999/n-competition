"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { flushSync } from "react-dom";

import { Maximize2, Minimize2, ZoomIn, ZoomOut, ChevronDown, Filter, Expand, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BracketTree } from "./bracket-tree";
import { BracketDrawModal } from "./bracket-draw-modal";
import { LayoutGroup, motion, AnimatePresence } from "framer-motion";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { CompetitionSidebar } from "@/components/competition-sidebar-display";

interface InteractiveBracketViewerProps {
  matches: any[];
  participants: any[];
  adminMode?: boolean;
  slug?: string;
  disableInnerSidebar?: boolean;
  onBracketInsert?: (matchId: string, participantIds: string[]) => Promise<void>;
  onBroadcastDrawComplete?: (matchId: string, participantIds: string[]) => void;
}

function getMatchCategoryOnly(m: any): string {
  if (m.category && m.category.trim()) {
    return m.category.trim();
  }
  const src = m.title || "";
  const patterns: [RegExp, string][] = [
    [/SD\/MI/i, "SD/MI"],
    [/SMA\/SMK\/MA/i, "SMA/SMK/MA"],
    [/SMP\/MTs/i, "SMP/MTs"],
    [/Mahasiswa/i, "Mahasiswa"],
    [/Umum/i, "Umum"],
    [/Santri/i, "Santri"],
    [/TK/i, "TK"],
  ];
  for (const [re, label] of patterns) {
    if (re.test(src)) {
      return label;
    }
  }
  return "Umum";
}

function getMatchSubjectOnly(m: any): string {
  return m.subject && m.subject.trim() ? m.subject.trim() : "";
}

export function InteractiveBracketViewer({ 
  matches, 
  participants, 
  adminMode = false, 
  slug, 
  disableInnerSidebar = false,
  onBracketInsert,
  onBroadcastDrawComplete
}: InteractiveBracketViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.1);
  const [zoomInput, setZoomInput] = useState("100");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubject, setActiveSubject] = useState<string>("");
  const [localMatches, setLocalMatches] = useState(matches);

  useEffect(() => {
    setLocalMatches(matches);
  }, [matches]);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [subDropdownOpen, setSubDropdownOpen] = useState(false);

  const [selectedMatchForDraw, setSelectedMatchForDraw] = useState<any>(null);
  const [animatingDraws, setAnimatingDraws] = useState<any[]>([]);

  const handleMatchClick = (match: any) => {
    if (adminMode && onBracketInsert) {
      setSelectedMatchForDraw(match);
    }
  };

  const executeDraw = async (matchId: string, pList: any[], isBroadcast = false) => {
    setAnimatingDraws(pList.map((p, idx) => ({ ...p, index: idx })));
    setSelectedMatchForDraw(null);
    
    const delay = pList.length === 1 ? 1200 : 800;
    setTimeout(() => {
      // Force synchronous DOM update to ensure layoutId transfers perfectly
      flushSync(() => {
        setLocalMatches(prev => prev.map(m => {
          if (m.id.toString() === matchId.toString()) {
            const newParticipants = pList.map(p => ({ id: p.id, score: 0 }));
            const existingIds = new Set((m.participants || []).map((mp: any) => mp.id));
            const uniqueNew = newParticipants.filter(np => !existingIds.has(np.id));
            return {
              ...m,
              participants: [...(m.participants || []), ...uniqueNew],
            };
          }
          return m;
        }));

        if (!isBroadcast) {
          if (onBracketInsert) onBracketInsert(matchId, pList.map(p => p.id));
        } else {
          if (onBroadcastDrawComplete) onBroadcastDrawComplete(matchId, pList.map(p => p.id));
        }
        setAnimatingDraws([]);
      });
    }, delay);
  };

  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const catDropdownRef = useRef<HTMLDivElement>(null);
  const subDropdownRef = useRef<HTMLDivElement>(null);

  // Sync zoomInput when zoom changes externally
  useEffect(() => {
    setZoomInput(Math.round(zoom * 100).toString());
  }, [zoom]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    localMatches.forEach(m => cats.add(getMatchCategoryOnly(m)));
    const arr = Array.from(cats).sort();
    return arr.length > 0 ? arr : ["All"];
  }, [localMatches]);
  
  // Set default category
  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // Extract unique subjects for the currently active category
  const subjects = useMemo(() => {
    if (!activeCategory) return [];
    const subs = new Set<string>();
    localMatches.forEach(m => {
      if (getMatchCategoryOnly(m) === activeCategory) {
        const sub = getMatchSubjectOnly(m);
        if (sub) subs.add(sub);
      }
    });
    return Array.from(subs).sort();
  }, [localMatches, activeCategory]);

  // Set default subject when category changes or subject is invalid
  useEffect(() => {
    if (subjects.length > 0) {
      if (!activeSubject || !subjects.includes(activeSubject)) {
        setActiveSubject(subjects[0]);
      }
    } else {
      setActiveSubject("");
    }
  }, [subjects, activeSubject]);

  // Filter matches based on BOTH category and subject
  const filteredMatches = useMemo(() => {
    if (!activeCategory) return localMatches;
    return localMatches.filter(m => {
      const isCatMatch = activeCategory === "All" || getMatchCategoryOnly(m) === activeCategory;
      const isSubMatch = !activeSubject || getMatchSubjectOnly(m) === activeSubject;
      return isCatMatch && isSubMatch;
    });
  }, [localMatches, activeCategory, activeSubject]);

  /** Calculate fit zoom */
  const calculateFitZoom = useCallback(() => {
    const canvas = canvasRef.current;
    const content = contentRef.current;
    if (!canvas || !content) return 0.1;

    content.style.transform = "scale(1)";
    const contentW = content.scrollWidth;
    const contentH = content.scrollHeight;
    const containerW = canvas.clientWidth;
    const containerH = canvas.clientHeight;

    const scaleX = containerW / contentW;
    const scaleY = containerH / contentH;
    return Math.max(Math.min(scaleX, scaleY, 1) * 0.92, 0.1); // 8% padding
  }, []);

  const fitToScreen = useCallback(() => {
    const fit = calculateFitZoom();
    setMinZoom(fit);
    setZoom(fit);
  }, [calculateFitZoom]);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setZoom(prev => Math.min(prev + 0.1, minZoom * 2));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setZoom(prev => Math.max(prev - 0.1, minZoom));
  };

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomInput(e.target.value);
  };

  const applyZoomInput = () => {
    let val = parseInt(zoomInput, 10);
    if (isNaN(val)) {
      setZoomInput(Math.round(zoom * 100).toString());
      return;
    }
    const minPct = Math.round(minZoom * 100);
    const maxPct = Math.round(minZoom * 2 * 100);
    
    if (val < minPct) val = minPct;
    if (val > maxPct) val = maxPct;
    
    setZoom(val / 100);
    setZoomInput(val.toString());
  };

  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyZoomInput();
      e.currentTarget.blur();
    }
  };

  const handleFit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fitToScreen();
  };

  const handleFullscreenToggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isFullscreen) {
      try {
        await containerRef.current?.requestFullscreen();
      } catch {
        document.body.classList.add("bracket-fullscreen");
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        document.body.classList.remove("bracket-fullscreen");
        setIsFullscreen(false);
        setZoom(1);
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    // Check initial state
    if (document.fullscreenElement) {
      setIsFullscreen(true);
      document.body.classList.add("bracket-fullscreen");
    }

    const onFsChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (isFull) {
        document.body.classList.add("bracket-fullscreen");
        setTimeout(() => fitToScreen(), 150);
      } else {
        document.body.classList.remove("bracket-fullscreen");
        setTimeout(() => fitToScreen(), 150);
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.body.classList.remove("bracket-fullscreen");
    };
  }, [fitToScreen]);

  useEffect(() => {
    setTimeout(() => {
      fitToScreen();
    }, 100);
  }, [isFullscreen, fitToScreen]); // Removed filteredMatches to prevent zoom glitch when matches update

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
      if (subDropdownRef.current && !subDropdownRef.current.contains(e.target as Node)) {
        setSubDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? "bg-zinc-50 dark:bg-[#0c141c] flex flex-col w-full h-screen overflow-hidden"
          : "relative w-full bg-zinc-50 dark:bg-[#0c141c] rounded-xl border border-zinc-300 dark:border-zinc-800 flex flex-col"
      }
      style={!isFullscreen ? { minHeight: '600px', height: 'auto' } : undefined}
    >
      <LayoutGroup>
      <SidebarProvider
        defaultOpen={false}
        style={{ width: "100%", height: "100%", "--sidebar-width": "16rem", "--sidebar-width-icon": "4rem" } as React.CSSProperties}
      >
        {isFullscreen && !adminMode && !disableInnerSidebar && slug && <CompetitionSidebar slug={slug} />}

        <SidebarInset className="bg-transparent h-full w-full relative flex-1 min-h-0 overflow-hidden">

          {selectedMatchForDraw && (
            <BracketDrawModal
              match={selectedMatchForDraw}
              participants={participants}
              matches={localMatches}
              onClose={() => setSelectedMatchForDraw(null)}
              onInsert={(pList) => executeDraw(selectedMatchForDraw.id, pList)}
            />
          )}
          <AnimatePresence>
            {animatingDraws.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-[100] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-sm"
              >
                <div className="relative w-full max-w-4xl h-full flex flex-wrap items-center justify-center gap-6 p-12">
                  {animatingDraws.map((draw) => (
                    <motion.div
                      key={`draw-center-${draw.id}`}
                      layoutId={`draw-card-${draw.id}`}
                      initial={{ scale: 0.5, opacity: 0, y: 50 }}
                      animate={{ 
                        scale: 1, opacity: 1, y: 0,
                        transition: { type: "spring", stiffness: 300, damping: 20, delay: draw.index * 0.1 }
                      }}
                      className="bg-zinc-900 border border-[#00e599]/50 shadow-[0_0_30px_-5px_rgba(0,229,153,0.3)] rounded-xl p-6 flex flex-col items-center justify-center min-w-[280px] max-w-[320px]"
                    >
                      <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-[#00e599] flex items-center justify-center mb-4 overflow-hidden">
                        <svg className="w-10 h-10 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <h3 className="text-white font-bold text-lg text-center mb-1">{draw.participant_name || draw.contact_email?.split('@')[0]}</h3>
                      <p className="text-zinc-400 text-sm text-center">{draw.school_name || '—'}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Toolbar ─── */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-1 bg-white/80 dark:bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-zinc-200 dark:border-white/10">

            {/* Category Dropdown */}
            {categories.length > 1 && (
              <div ref={catDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCatDropdownOpen(o => !o); setSubDropdownOpen(false); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 transition-colors"
                >
                  <Filter className="w-3 h-3" />
                  {activeCategory}
                  <ChevronDown className={`w-3 h-3 transition-transform ${catDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {catDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveCategory(cat);
                          setCatDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                          activeCategory === cat
                            ? "bg-teal-500/20 text-teal-500"
                            : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subject Dropdown */}
            {subjects.length > 1 && (
              <div ref={subDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSubDropdownOpen(o => !o); setCatDropdownOpen(false); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 transition-colors"
                >
                  <BookOpen className="w-3 h-3" />
                  {activeSubject}
                  <ChevronDown className={`w-3 h-3 transition-transform ${subDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {subDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    {subjects.map(sub => (
                      <button
                        key={sub}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveSubject(sub);
                          setSubDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                          activeSubject === sub
                            ? "bg-indigo-500/20 text-indigo-500"
                            : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10"
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(categories.length > 1 || subjects.length > 1) && (
              <div className="w-px h-4 bg-zinc-300 dark:bg-white/20 mx-0.5" />
            )}

            {/* Zoom controls */}
            <Button variant="ghost" size="icon" onClick={handleZoomOut} type="button" className="h-8 w-8 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/20">
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-0.5">
              <input
                type="text"
                value={zoomInput}
                onChange={handleZoomInputChange}
                onBlur={applyZoomInput}
                onKeyDown={handleZoomInputKeyDown}
                title={`Min: ${Math.round(minZoom * 100)}%, Max: ${Math.round(minZoom * 2 * 100)}%`}
                className="w-8 text-center bg-transparent border-b border-transparent hover:border-zinc-400 focus:border-[#00e599] focus:outline-none text-[10px] font-mono text-zinc-900 dark:text-white/70"
              />
              <span className="text-[10px] font-mono text-zinc-900 dark:text-white/70">%</span>
            </div>

            <Button variant="ghost" size="icon" onClick={handleZoomIn} type="button" className="h-8 w-8 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/20">
              <ZoomIn className="w-4 h-4" />
            </Button>

            {/* Fit to screen button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFit}
              type="button"
              title="Fit to screen"
              className="h-8 w-8 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/20"
            >
              <Expand className="w-4 h-4" />
            </Button>

            <div className="w-px h-4 bg-zinc-300 dark:bg-white/20 mx-0.5" />

            {/* Fullscreen toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreenToggle}
              type="button"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="h-8 w-8 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/20"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>

          {/* ─── Bracket Canvas ─── */}
          <div
            ref={canvasRef}
            className="bracket-scroll-area w-full overflow-auto"
            style={{ minHeight: isFullscreen ? '100%' : '550px' }}
          >
            <div
              style={{
                display: 'inline-block',
                minWidth: '100%',
                minHeight: '100%',
              }}
            >
              <div
                ref={contentRef}
                className="inline-block origin-top-left transition-transform duration-200 pt-16 pb-12 px-8"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
              >
                <BracketTree matches={filteredMatches} participants={participants} adminMode={adminMode} onMatchClick={handleMatchClick} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      </LayoutGroup>
    </div>
  );
}
