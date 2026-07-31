"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ActiveRole, useActiveContext } from "./use-active-context";

export function useRoleGuard(allowedRoles: ActiveRole[]) {
  const { activeRole, isLoading, user, competitionId } = useActiveContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (!allowedRoles.includes(activeRole)) {
        router.replace("/forbidden");
      }
    }
  }, [isLoading, activeRole, user, router, allowedRoles]);

  return { activeRole, isLoading, user, competitionId };
}
