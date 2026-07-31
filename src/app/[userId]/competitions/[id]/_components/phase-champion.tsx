"use client";

import { useState } from "react";
import { Trophy, Medal, Crown, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalGroup } from "./phase-group-stage";
import { DummyPlayer } from "@/types/competition";

interface PhaseChampionProps {
  groups: LocalGroup[];
  finalists?: DummyPlayer[];
  categories?: string[];
}

export function PhaseChampion({ groups, finalists = [], categories = [] }: PhaseChampionProps) {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");

  const podiumConfig = [
    { icon: <Crown className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />, bg: "from-yellow-500/10 to-transparent border-yellow-500/30", label: "1st Place", textColor: "text-yellow-700 dark:text-yellow-500" },
    { icon: <Medal className="h-6 w-6 text-gray-500 dark:text-gray-400" />, bg: "from-gray-500/10 to-transparent border-gray-400/30", label: "2nd Place", textColor: "text-gray-700 dark:text-gray-400" },
    { icon: <Award className="h-6 w-6 text-orange-600 dark:text-orange-500" />, bg: "from-orange-500/10 to-transparent border-orange-500/30", label: "3rd Place", textColor: "text-orange-700 dark:text-orange-500" },
  ];

  let championGroups = groups.filter(g => g.stage === "Champion");
  let hasMembers = championGroups.some(g => g.members.length > 0);

  // If no real data, use dummy data if requested
  if (!hasMembers) {
    const defaultCategories = categories.length > 0 ? categories : ["SD/MI", "SMP/MTs", "SMA/SMK/MA"];
    championGroups = defaultCategories.map((cat, i) => ({
      id: `dummy-champ-${i}`,
      name: cat,
      stage: "Champion",
      category: cat,
      sources: [],
      rounds: [],
      members: [
        { playerId: `dummy-1-${i}`, playerName: "Budi Santoso", score: 95, timeSeconds: 120, isAdvanced: false },
        { playerId: `dummy-2-${i}`, playerName: "Siti Aminah", score: 88, timeSeconds: 145, isAdvanced: false },
        { playerId: `dummy-3-${i}`, playerName: "Andi Wijaya", score: 82, timeSeconds: 150, isAdvanced: false },
      ]
    }));
    hasMembers = true;
  }

  // To show an empty state, uncomment this block instead of showing dummy data
  // if (!hasMembers) {
  //   return (
  //     <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
  //       <Trophy className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
  //       <p className="text-muted-foreground text-sm font-medium">No results available yet</p>
  //     </div>
  //   );
  // }

  const filteredChampionGroups = activeCategoryFilter === "all" 
    ? championGroups 
    : championGroups.filter(g => g.category === activeCategoryFilter);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-semibold">Champion</h2>
      </div>

      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
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

      <div className="space-y-10">
        {filteredChampionGroups.map((group) => {
          if (group.members.length === 0) return null;

          // Rank members by score (desc), then time (asc)
          const ranked = [...group.members].sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.timeSeconds - b.timeSeconds;
          });

          const top3 = ranked.slice(0, 3);

          return (
            <Card key={group.id} className="overflow-hidden border-border/50">
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {top3.map((player, idx) => {
                    const cfg = podiumConfig[idx];
                    return (
                      <div
                        key={player.playerId}
                        className={`relative flex flex-col items-center justify-center rounded-xl border bg-linear-to-b p-6 text-center transition-all hover:shadow-md ${cfg.bg}`}
                      >
                        <div className="absolute top-4 left-4">
                          {cfg.icon}
                        </div>
                        
                        <Avatar className="h-20 w-20 mx-auto mb-4 border-4 border-background shadow-sm">
                          <AvatarImage src={finalists.find(f => f.id === player.playerId)?.avatar || ""} alt={player.playerName} className="object-cover" />
                          <AvatarFallback className="text-xl font-bold bg-muted text-muted-foreground">
                            {player.playerName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="space-y-1 w-full mt-2">
                          <h3 className={`font-bold text-lg ${cfg.textColor} truncate`} title={player.playerName}>
                            {player.playerName}
                          </h3>
                          <Badge variant="outline" className={`${cfg.textColor} border-current mt-1 px-3 py-0.5`}>
                            {cfg.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
