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
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Sidebar Skeleton */}
        <div className="w-64 border-r bg-sidebar hidden md:flex flex-col">
          <div className="p-4 border-b">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-4 space-y-4 flex-1">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="p-4 border-t">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
        
        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 border-b flex items-center px-4 justify-between bg-background">
            <Skeleton className="h-6 w-6 rounded-md md:hidden" /> {/* Mobile sidebar trigger */}
            <div className="flex items-center gap-4 ml-auto">
              <Skeleton className="h-8 w-8 rounded-full" /> {/* Theme toggle */}
              <Skeleton className="h-8 w-8 rounded-full" /> {/* User avatar */}
            </div>
          </header>
          <main className="flex-1 p-6 space-y-6 overflow-auto">
            <Skeleton className="h-8 w-48 mb-6" /> {/* Page Title */}
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-[300px] rounded-xl" />
              <Skeleton className="h-[300px] rounded-xl" />
            </div>
          </main>
        </div>
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
