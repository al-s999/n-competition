import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

interface Participant {
  id: string;
  team_name?: string;
  participant_name?: string;
  seed?: number;
}

interface MatchParticipant {
  id: string;
  score: number;
}

interface MatchNodeProps {
  match: {
    id: string;
    participants?: MatchParticipant[];
    status: string;
    winner_id: string | null;
    title?: string;
    phase?: string;
    category?: string;
    subject?: string;
    group?: string;
  };
  participantsData?: Participant[];
  className?: string;
  href?: string;
  onClick?: (match: any) => void;
}

export function MatchNode({ match, participantsData = [], className, href, onClick }: MatchNodeProps) {
  const content = (
    <Card className={cn("w-full p-0 gap-0 min-w-[280px] max-w-[400px] min-h-[100px] bg-white dark:bg-[#0c141c] text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-800 flex flex-col overflow-hidden text-sm shadow-sm transition-colors rounded-xl", href && "hover:border-primary/50 hover:shadow-md cursor-pointer", className)}>
      {match.title && (
        <div className="relative bg-zinc-50 dark:bg-[#121c25] border-b border-zinc-200 dark:border-zinc-800/50 px-8 py-2.5 flex justify-center items-center min-h-[44px]">
          <div className="flex flex-col items-center justify-center gap-0.5">
            <span className="font-semibold text-xs text-zinc-900 dark:text-white line-clamp-1 leading-tight">
              {match.phase || match.category || match.title}
            </span>
            {(match.category || match.subject || match.group) && (
              <span className="text-[10px] text-zinc-500 font-medium line-clamp-1 leading-tight mt-0.5">
                {[match.category, match.subject, match.group ? `Group ${match.group}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            )}
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-end gap-1 text-zinc-400 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0">
            <Users className="w-3 h-3" />
            {match.participants?.length || 0}
          </div>
        </div>
      )}
      
      <div className="flex flex-col">
        {match.participants && match.participants.length > 0 ? (
          [...match.participants]
            .sort((a, b) => {
              if (match.status === 'Finished') {
                return (b.score || 0) - (a.score || 0);
              } else {
                const pDataA = participantsData.find(p => p.id === a.id);
                const pDataB = participantsData.find(p => p.id === b.id);
                const nameA = pDataA?.participant_name || pDataA?.team_name || a.id;
                const nameB = pDataB?.participant_name || pDataB?.team_name || b.id;
                return nameA.localeCompare(nameB);
              }
            })
            .map((mp, idx) => {
            const pData = participantsData.find(p => p.id === mp.id);
            const name = pData?.participant_name || pData?.team_name || (mp.id === 'Coming Soon' ? 'Coming Soon' : mp.id);
            const isWinner = match.winner_id === mp.id;
            
            return (
              <motion.div 
                key={idx}
                layoutId={`draw-card-${mp.id}`}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-300 dark:border-zinc-800/40 last:border-0 relative h-10 bg-white dark:bg-transparent z-10"
              >
                {isWinner && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />
                )}
                <div className="flex items-center gap-2 truncate pl-2">
                  <span className="text-[10px] text-zinc-500 font-mono w-4">{idx + 1}</span>
                  <span className={cn("font-medium truncate text-xs", isWinner ? "text-teal-400" : "text-zinc-700 dark:text-zinc-300")}>
                    {name}
                  </span>
                </div>
                <span className={cn("font-bold text-xs", isWinner ? "text-teal-400" : "text-zinc-500")}>
                  {mp.score}
                </span>
              </motion.div>
            );
          })
        ) : (
          <div className="h-20" /> // empty space for aesthetics
        )}
      </div>
    </Card>
  );

  if (onClick) {
    return (
      <div onClick={() => onClick(match)} className="block cursor-pointer">
        {content}
      </div>
    );
  }

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}
