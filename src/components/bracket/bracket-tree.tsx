import { MatchNode } from "./match-node";


interface MatchParticipant { id: string; score: number; }
interface Match {
  id: string;
  round: number;
  match_order: number;
  participants?: MatchParticipant[];
  winner_id: string | null;
  status: string;
  title?: string;
  phase?: string;
  category?: string;
  subject?: string;
  group?: string;
}
interface Participant { id: string; team_name?: string; participant_name?: string; seed?: number; }
interface BracketTreeProps { matches: Match[]; participants: Participant[]; adminMode?: boolean; onMatchClick?: (match: any) => void; }

// Canonical phase order for BRACKET display (Qualification is excluded — it's schedule only)
const PHASE_ORDER = ["Semifinal", "Final", "Grand Final"];
const BRACKET_EXCLUDED_PHASES = ["Qualification"];

function normalizePhase(phase?: string): string {
  if (!phase) return "Qualification";
  const lower = phase.toLowerCase();
  if (lower.includes("grand")) return "Grand Final";
  if (lower.includes("semi")) return "Semifinal";   // ← must come before "final" check
  if (lower.includes("final")) return "Final";
  if (lower.includes("qualif")) return "Qualification";
  return "Qualification";
}

function extractCategory(m: Match): string {
  let cat = "General";
  if (m.category && m.category.trim()) {
    cat = m.category.trim();
  } else {
    const src = m.title || "";
    const patterns: [RegExp, string][] = [
      [/SD\/MI/i, "Elementary"],
      [/SMA\/SMK\/MA/i, "High School"],
      [/SMP\/MTs/i, "Middle School"],
      [/Mahasiswa/i, "University"],
      [/Umum/i, "General"],
      [/Guru/i, "Guru"],
      [/Santri/i, "Santri"],
      [/TK/i, "Kindergarten"],
    ];
    for (const [re, label] of patterns) {
      if (re.test(src)) {
        cat = label;
        break;
      }
    }
  }

  const sub = m.subject && m.subject.trim() ? m.subject.trim() : "";
  return sub ? `${cat} - ${sub}` : cat;
}

const MATCH_W = 300;
const MATCH_H = 160;
const V_GAP = 40;
const H_GAP = 340;

function SingleCategoryBracket({
  matches,
  participants,
  adminMode,
  phases,
  onMatchClick,
}: {
  matches: Match[];
  participants: Participant[];
  adminMode?: boolean;
  phases: string[]; // all phases in the bracket (for column alignment)
  onMatchClick?: (match: any) => void;
}) {
  // Group matches by normalized phase
  const phaseMap = new Map<string, Match[]>();
  matches.forEach((m) => {
    const p = normalizePhase(m.phase);
    if (!phaseMap.has(p)) phaseMap.set(p, []);
    phaseMap.get(p)!.push(m);
  });

  // Build rounds array respecting the global phase order
  const rounds: Match[][] = phases.map((ph) => {
    const ms = phaseMap.get(ph) || [];
    return ms.sort((a, b) => {
      const ro = a.round - b.round;
      if (ro !== 0) return ro;
      return a.match_order - b.match_order;
    });
  });

  // Dynamic height computation based on max participants
  const maxParticipants = Math.max(2, ...matches.map(m => m.participants?.length || 0));
  const dynamicMatchH = 50 + (maxParticipants * 44);
  const dynamicVGap = 60; // slightly larger gap for breathing room

  // Compute y positions
  const layout: { match: Match; x: number; y: number }[][] = [];

  for (let r = 0; r < rounds.length; r++) {
    const roundMatches = rounds[r];
    const roundLayout: { match: Match; x: number; y: number }[] = [];
    const x = r * (MATCH_W + H_GAP);

    for (let i = 0; i < roundMatches.length; i++) {
      let y = 0;
      if (r === 0 || layout[r - 1].length === 0) {
        // First meaningful round — stack vertically
        y = i * (dynamicMatchH + dynamicVGap) + dynamicMatchH / 2;
      } else {
        const prevRound = layout[r - 1];
        if (prevRound.length === 0) {
          // Previous phase was empty (no matches), fall back to even spacing
          y = i * (dynamicMatchH + dynamicVGap) + dynamicMatchH / 2;
        } else if (prevRound.length === roundMatches.length * 2) {
          // Classic 2-to-1 pairing
          const p1 = prevRound[i * 2];
          const p2 = prevRound[i * 2 + 1];
          y = p2 ? (p1.y + p2.y) / 2 : p1.y;
        } else if (prevRound.length >= roundMatches.length) {
          // Group multiple prev matches into one next match
          const ratio = prevRound.length / roundMatches.length;
          const start = Math.floor(i * ratio);
          const end = Math.min(Math.floor((i + 1) * ratio) - 1, prevRound.length - 1);
          y = (prevRound[start].y + prevRound[end].y) / 2;
        } else {
          // Fewer prev than current (shouldn't happen in normal bracket)
          y = i * (dynamicMatchH + dynamicVGap) + dynamicMatchH / 2;
        }
      }
      roundLayout.push({ match: roundMatches[i], x, y });
    }
    layout.push(roundLayout);
  }

  // Container size
  const totalW = phases.length * MATCH_W + (phases.length > 1 ? (phases.length - 1) * H_GAP : 0);
  let maxY = 0;
  layout.forEach((rnd) => rnd.forEach((n) => { if (n.y > maxY) maxY = n.y; }));
  const totalH = Math.max(maxY + dynamicMatchH, dynamicMatchH * 2);

  // SVG connector paths
  const paths: React.ReactNode[] = [];
  for (let r = 1; r < layout.length; r++) {
    const cur = layout[r];
    const prev = layout[r - 1];
    if (prev.length === 0 || cur.length === 0) continue;

    if (prev.length === cur.length * 2) {
      for (let i = 0; i < cur.length; i++) {
        const dest = cur[i];
        const s1 = prev[i * 2];
        const s2 = prev[i * 2 + 1];
        const startX = s1.x + MATCH_W;
        const midX = startX + H_GAP / 2;
        paths.push(
          <path key={`p-${r}-${i}-1`} d={`M ${startX} ${s1.y} H ${midX} V ${dest.y} H ${dest.x}`} fill="none" stroke="rgba(13,148,136,0.4)" strokeWidth="2" />
        );
        if (s2) {
          paths.push(
            <path key={`p-${r}-${i}-2`} d={`M ${s2.x + MATCH_W} ${s2.y} H ${midX} V ${dest.y} H ${dest.x}`} fill="none" stroke="rgba(13,148,136,0.4)" strokeWidth="2" />
          );
        }
      }
    } else if (prev.length >= cur.length && cur.length > 0) {
      const ratio = prev.length / cur.length;
      for (let i = 0; i < cur.length; i++) {
        const dest = cur[i];
        const start = Math.floor(i * ratio);
        const end = Math.min(Math.floor((i + 1) * ratio) - 1, prev.length - 1);
        const midX = prev[start].x + MATCH_W + H_GAP / 2;
        for (let j = start; j <= end; j++) {
          const s = prev[j];
          paths.push(
            <path key={`p-${r}-${i}-${j}`} d={`M ${s.x + MATCH_W} ${s.y} H ${midX} V ${dest.y} H ${dest.x}`} fill="none" stroke="rgba(13,148,136,0.4)" strokeWidth="2" />
          );
        }
      }
    } else {
      // 1:1
      for (let i = 0; i < Math.min(prev.length, cur.length); i++) {
        const s = prev[i];
        const dest = cur[i];
        paths.push(
          <path key={`p-${r}-${i}`} d={`M ${s.x + MATCH_W} ${s.y} H ${dest.x}`} fill="none" stroke="rgba(13,148,136,0.4)" strokeWidth="2" />
        );
      }
    }
  }

  return (
    <div className="relative" style={{ width: totalW, height: totalH }}>
      <svg className="absolute top-0 left-0 pointer-events-none" width={totalW} height={totalH}>
        {paths}
      </svg>
      {layout.map((round) =>
        round.map((node) => (
          <div
            key={node.match.id}
            className="absolute"
            style={{ top: node.y, left: node.x, width: MATCH_W, transform: "translateY(-50%)" }}
          >
            <MatchNode
              match={node.match}
              participantsData={participants}
              href={adminMode && !onMatchClick ? `/admin/match/${node.match.id}` : undefined}
              onClick={onMatchClick}
              className="w-full"
            />
          </div>
        ))
      )}
    </div>
  );
}

export function BracketTree({ matches, participants, adminMode = false, onMatchClick }: BracketTreeProps) {
  
  // Exclude qualification-only matches from bracket view
  const bracketMatches = matches.filter(m => !BRACKET_EXCLUDED_PHASES.includes(normalizePhase(m.phase)));

  // Determine all phases present across bracket matches, in canonical order
  const phasesPresent = new Set<string>();
  bracketMatches.forEach((m) => phasesPresent.add(normalizePhase(m.phase)));
  const phases = PHASE_ORDER.filter((p) => phasesPresent.has(p));

  // Group matches by category
  const categoriesMap = new Map<string, Match[]>();
  bracketMatches.forEach((m) => {
    const cat = extractCategory(m);
    if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
    categoriesMap.get(cat)!.push(m);
  });

  const CATEGORY_ORDER = ["Elementary", "Middle School", "High School", "University", "General"];
  const categories = Array.from(categoriesMap.keys()).sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-col items-start gap-8 pb-10 pr-10 pt-4">
      {/* Column Headers (phase labels) */}
      <div className="flex mb-[-16px]">
        {phases.map((ph, idx) => (
          <div
            key={ph}
            className="text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-widest uppercase"
            style={{ width: MATCH_W, marginRight: idx < phases.length - 1 ? H_GAP : 0 }}
          >
            {ph}
          </div>
        ))}
      </div>

      {categories.map((cat) => (
        <div key={cat} className="mt-4">
          {/* Category label */}
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3 pl-1">
            {cat}
          </div>
          <SingleCategoryBracket
            matches={categoriesMap.get(cat)!}
            participants={participants}
            adminMode={adminMode}
            phases={phases}
          />
        </div>
      ))}
    </div>
  );
}
