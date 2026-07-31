"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/features/auth/context";
import { CompetitionService } from "@/features/competitions/data/service";
import { MemberService } from "@/features/members/data/service";
import { User } from "@/features/auth/data/types";

export type ActiveRole = "COMPETITION" | "MANAGER" | "RECEPTIONIST" | "MC" | "none";

export function useActiveContext() {
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const [activeRole, setActiveRole] = useState<ActiveRole>("none");
  const [isLoading, setIsLoading] = useState(true);

  const competitionId = typeof params?.id === "string" ? params.id : null;

  useEffect(() => {
    if (authLoading) return;

    const fetchRole = async () => {
      if (!user) {
        setActiveRole("none");
        setIsLoading(false);
        return;
      }

      if (user.role === "COMPETITION" || user.role === "competition") {
        setActiveRole("COMPETITION");
        setIsLoading(false);
        return;
      }

      if (!competitionId) {
        setIsLoading(false);
        return;
      }

      const member = await MemberService.getMember(competitionId, user.id);
      if (member) {
        setActiveRole(member.role as ActiveRole);
      } else {
        setActiveRole("none");
      }
      setIsLoading(false);
    };

    fetchRole();
  }, [user, competitionId, authLoading]);

  return { activeRole, isLoading, competitionId, user };
}
