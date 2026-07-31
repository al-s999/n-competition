"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleShell, NavItem } from "@/components/shared/role-shell";
import { LayoutDashboard, Users, GitMerge, Shield } from "lucide-react";
import { MemberService } from "@/features/members/data/service";

export default function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const resolvedParams = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isOnlyMC, setIsOnlyMC] = useState(false);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== "COMPETITION") {
      MemberService.getMembersByUser(user.id).then((members) => {
        if (members.length > 0 && members.every((m) => m.role === "MC")) {
          setIsOnlyMC(true);
        }
        setIsRoleLoading(false);
      });
    } else {
      setIsRoleLoading(false);
    }
  }, [user]);

  const isLoading = authLoading || isRoleLoading;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.id !== resolvedParams.userId) {
        router.replace("/forbidden");
      }
    }
  }, [isLoading, user, resolvedParams.userId, router]);

  if (isLoading || !user || user.id !== resolvedParams.userId) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <Skeleton className="h-10 w-48 rounded-md" />
      </div>
    );
  }

  const title = user.role === "COMPETITION" ? "Organizer" : (isOnlyMC ? "MC" : "Dashboard");

  const navItems: NavItem[] = [
    ...(!isOnlyMC
      ? [
          {
            title: "Dashboard",
            href: `/${resolvedParams.userId}/dashboard`,
            icon: <LayoutDashboard />,
          },
        ]
      : []),
    {
      title: "Competitions",
      href: `/${resolvedParams.userId}/competitions`,
      icon: <GitMerge />,
    },
  ];

  return (
    <RoleShell
      title={title}
      navItems={navItems}
    >
      {children}
    </RoleShell>
  );
}
