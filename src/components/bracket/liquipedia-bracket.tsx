import React from 'react';
import { Card } from "@/components/ui/card";

export interface MatchParticipantProps {
  name: string;
  score?: number;
  winner?: boolean;
}

const MatchParticipant = ({ name, score, winner }: MatchParticipantProps) => (
  <div className={`flex justify-between items-center px-3 py-1.5 text-xs min-h-[28px] ${winner ? 'font-bold bg-white/5 dark:bg-white/10 text-[#00e599]' : 'text-zinc-600 dark:text-zinc-300'}`}>
    <span className="truncate mr-2" title={name}>{name || '\u00A0'}</span>
    {score !== undefined && <span className="w-5 text-center shrink-0">{score}</span>}
  </div>
);

const MatchNode = ({ title, participants, onClick, isClickable }: { title?: string, participants?: MatchParticipantProps[], onClick?: () => void, isClickable?: boolean }) => (
  <div className="flex flex-col w-[280px] flex-shrink-0 z-10">
    {title && <div className="text-[10px] uppercase font-semibold text-zinc-500 mb-1 px-1">{title}</div>}
    <Card
      onClick={isClickable ? onClick : undefined}
      className={`flex flex-col border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#1a1a1a] overflow-hidden min-h-[56px] ${isClickable ? 'cursor-pointer hover:border-[#00e599]/50 transition-colors' : ''}`}
    >
      {participants && participants.length > 0 ? (
        participants.map((p, idx) => (
          <MatchParticipant key={idx} {...p} />
        ))
      ) : (
        <>
          <MatchParticipant name="" />
          <MatchParticipant name="" />
        </>
      )}
    </Card>
  </div>
);

export interface LiquipediaBracketProps {
  title?: string;
  semifinal1?: any;
  semifinal2?: any;
  final?: any;
  champion?: any;
  onMatchClick?: (match: any) => void;
}

export function LiquipediaBracket({ title, semifinal1, semifinal2, final, champion, onMatchClick }: LiquipediaBracketProps) {

  // Helper to extract all participants from a group
  const extractParticipants = (group: any): MatchParticipantProps[] => {
    if (!group || !group.members || group.members.length === 0) return [{ name: '' }, { name: '' }];

    // Sort by score
    const sorted = [...group.members].sort((a, b) => b.score - a.score);
    return sorted.map((m: any) => ({
      name: m.playerName || '',
      score: m.score,
      winner: m.isAdvanced
    }));
  };

  const champParticipant = champion?.members && champion.members.length > 0
    ? [...champion.members].sort((a: any, b: any) => b.score - a.score)[0]?.playerName
    : '';

  return (
    <div className="flex flex-col gap-4">
      {title && <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 pl-2 border-l-2 border-[#00e599]">{title}</h4>}
      <div className="flex items-center py-4 px-2 overflow-x-auto min-w-max">

        {/* Semifinals */}
        <div className="flex flex-col gap-8 justify-center relative">
          <div className="relative">
            <MatchNode
              title="Semifinal 1"
              participants={semifinal1 ? extractParticipants(semifinal1) : undefined}
              isClickable={!!semifinal1 && !!onMatchClick}
              onClick={() => semifinal1 && onMatchClick && onMatchClick(semifinal1)}
            />
            {/* Draw half connector down (shifted down by 9px to account for title height) */}
            <div className="absolute right-[-80px] top-[calc(50%+9px)] bottom-[-48px] w-20 border-r border-t border-zinc-300 dark:border-zinc-700 rounded-tr-lg z-0"></div>
          </div>

          <div className="relative">
            {/* Draw half connector up (shifted down by 9px to account for title height) */}
            <div className="absolute right-[-80px] top-[-48px] bottom-[calc(50%-9px)] w-20 border-r border-b border-zinc-300 dark:border-zinc-700 rounded-br-lg z-0"></div>
            <MatchNode
              title="Semifinal 2"
              participants={semifinal2 ? extractParticipants(semifinal2) : undefined}
              isClickable={!!semifinal2 && !!onMatchClick}
              onClick={() => semifinal2 && onMatchClick && onMatchClick(semifinal2)}
            />
          </div>

          {/* Center line connecting to Final */}
          <div className="absolute right-[-160px] top-[calc(50%+9px)] w-20 h-[1px] bg-zinc-300 dark:bg-zinc-700 z-0"></div>
        </div>

        {/* Final */}
        <div className="flex flex-col justify-center ml-40 z-10">
          <MatchNode
            title="Final"
            participants={final ? extractParticipants(final) : undefined}
            isClickable={!!final && !!onMatchClick}
            onClick={() => final && onMatchClick && onMatchClick(final)}
          />
        </div>

        {/* Connector to Champion */}
        <div className="flex items-center w-40 relative z-0 -ml-1">
          <div className="w-[164px] h-[1px] bg-zinc-300 dark:bg-zinc-700 translate-y-[9px]"></div>
        </div>

        {/* Champion */}
        <div className="flex flex-col justify-center z-10">
          <div className="flex flex-col w-[280px] flex-shrink-0">
            <div className="text-[10px] uppercase font-bold text-yellow-500 mb-1 px-1 flex items-center gap-1">🏆 Champion</div>
            <Card
              onClick={() => champion && onMatchClick && onMatchClick(champion)}
              className={`flex border-2 border-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/20 overflow-hidden items-center justify-center p-3 font-bold text-yellow-600 dark:text-yellow-400 min-h-[48px] ${!!champion && !!onMatchClick ? 'cursor-pointer hover:bg-yellow-500/30 transition-colors' : ''}`}
            >
              <span className="truncate" title={champParticipant}>{champParticipant || '\u00A0'}</span>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
