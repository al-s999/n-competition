import React, { useState, useMemo } from "react";
import { X, Search, Check, Users, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface BracketDrawModalProps {
  match: any;
  participants: any[];
  matches: any[];
  onClose: () => void;
  onInsert: (participants: any[]) => void;
}

export function BracketDrawModal({ match, participants, matches, onClose, onInsert }: BracketDrawModalProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  // Filter out participants already in the bracket for the SAME phase,
  // and enforce previous phase participation if applicable.
  const availableParticipants = useMemo(() => {
    const alreadyInPhase = new Set<string>();
    const prevPhaseParticipants = new Set<string>();
    
    const currentPhaseRaw = match.phase?.toLowerCase() || '';
    const getBasePhase = (p: string) => {
      if (p.includes('grand') && p.includes('final')) return 'grandfinal';
      if (p.includes('semi') && p.includes('final')) return 'semifinal';
      if (p.includes('final')) return 'final';
      return p;
    };

    const currentPhase = getBasePhase(currentPhaseRaw);
    const targetPrevPhase = currentPhase === 'grandfinal' ? 'final' : 
                            currentPhase === 'final' ? 'semifinal' : null;

    matches.forEach(m => {
      const pPhase = getBasePhase(m.phase?.toLowerCase() || '');
      if (pPhase === currentPhase) {
        m.match_participants?.forEach((mp: any) => {
          alreadyInPhase.add(mp.participant_id);
        });
      }
      if (targetPrevPhase && pPhase === targetPrevPhase) {
        if (match.category && m.category && m.category !== match.category) return;
        if (match.subject && m.subject && m.subject !== match.subject) return;
        
        m.match_participants?.forEach((mp: any) => {
          prevPhaseParticipants.add(mp.participant_id);
        });
      }
    });

    let filtered = participants.filter(p => {
      if (!p.is_finalist) return false;
      if (alreadyInPhase.has(p.id)) return false;
      if (targetPrevPhase && !prevPhaseParticipants.has(p.id)) return false;
      return true;
    });
    
    // Filter by category and subject of the match if applicable
    if (match.category) {
      filtered = filtered.filter(p => (p.category || 'General') === match.category);
    }
    if (match.subject) {
      filtered = filtered.filter(p => (p.subject || 'General') === match.subject);
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p => {
        const name = (p.participant_name || p.contact_email?.split('@')[0] || '').toLowerCase();
        const school = (p.school_name || '').toLowerCase();
        return name.includes(q) || school.includes(q);
      });
    }
    
    return filtered.sort((a, b) => {
      const nameA = a.participant_name || a.contact_email || '';
      const nameB = b.participant_name || b.contact_email || '';
      return nameA.localeCompare(nameB);
    });
  }, [participants, matches, match, search]);

  const paginated = availableParticipants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(availableParticipants.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleAutoDraw = () => {
    // Randomly pick remaining slots
    const currentSlots = match.match_participants?.length || 0;
    const maxSlots = 8; // Assuming 8 slots max, or could be dynamic
    let needed = maxSlots - currentSlots;
    if (needed <= 0) needed = 4; // Fallback
    
    const shuffled = [...availableParticipants].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, needed);
    if (selected.length > 0) {
      onInsert(selected);
    }
  };

  const handleInsertSelected = () => {
    const selected = availableParticipants.filter(p => selectedIds.includes(p.id));
    if (selected.length > 0) {
      onInsert(selected);
    }
  };

  const handleSingleInsert = (p: any) => {
    onInsert([p]);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0e12] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-full flex flex-col shadow-2xl overflow-hidden pointer-events-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00e599]/10 border border-[#00e599]/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#00e599]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Add to {match.title || match.phase}</h2>
              <p className="text-xs text-zinc-400">
                {match.category || 'General'} {match.subject ? `• ${match.subject}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-800/50 bg-zinc-900/20">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search finalists..." 
              className="pl-9 bg-black border-zinc-800 h-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button size="sm" variant="outline" className="h-9 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 flex-1 sm:flex-none" onClick={handleAutoDraw} disabled={availableParticipants.length === 0}>
              <Users className="w-4 h-4 mr-2" /> Auto Draw
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto min-h-[300px] p-2">
          {availableParticipants.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-sm">No available finalists found for this category.</p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2 border-b border-zinc-800/50 mb-2">
                <Checkbox 
                  checked={selectedIds.length > 0 && selectedIds.length === availableParticipants.length}
                  onCheckedChange={handleSelectAll}
                  className="border-zinc-600 data-[state=checked]:bg-[#00e599] data-[state=checked]:border-[#00e599]"
                />
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Select All ({availableParticipants.length})</span>
              </div>
              
              {paginated.map(p => {
                const name = p.participant_name || p.contact_email?.split('@')[0] || 'Unknown';
                const isSelected = selectedIds.includes(p.id);
                return (
                  <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isSelected ? 'bg-[#00e599]/5 border-[#00e599]/30' : 'bg-transparent border-transparent hover:bg-zinc-900/50'}`}>
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={(c) => {
                        setSelectedIds(prev => c ? [...prev, p.id] : prev.filter(id => id !== p.id));
                      }}
                      className="border-zinc-600 data-[state=checked]:bg-[#00e599] data-[state=checked]:border-[#00e599]"
                    />
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                      {name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-zinc-200 truncate">{name}</div>
                      <div className="text-xs text-zinc-500 truncate">{p.school_name || '—'}</div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleSingleInsert(p)}
                      className="h-7 px-2 text-[#00e599] hover:text-[#00e599] hover:bg-[#00e599]/10"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/60 bg-zinc-900/30 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 px-2 border-zinc-700 bg-zinc-900">Prev</Button>
            <span className="text-xs text-zinc-500 px-2">Page {page} of {Math.ceil(availableParticipants.length / PAGE_SIZE) || 1}</span>
            <Button size="sm" variant="outline" disabled={page * PAGE_SIZE >= availableParticipants.length} onClick={() => setPage(p => p + 1)} className="h-8 px-2 border-zinc-700 bg-zinc-900">Next</Button>
          </div>
          <Button
            onClick={handleInsertSelected}
            disabled={selectedIds.length === 0}
            className="bg-[#00e599] text-zinc-950 hover:bg-[#00c987] font-medium h-9"
          >
            Insert Selected ({selectedIds.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
