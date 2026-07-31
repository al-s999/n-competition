"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  CalendarDays, 
  GitMerge, 
  PanelLeft,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader,
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  useSidebar
} from "@/components/ui/sidebar";

interface CompetitionSidebarProps {
  slug: string;
}

export function CompetitionSidebar({ slug }: CompetitionSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile, state, toggleSidebar } = useSidebar();

  const links = [
    { name: "Schedule", href: `/admin/schedule/${slug}/fullscreen`, icon: CalendarDays, reqFs: true },
    { name: "Bracket", href: `/competition/${slug}/bracket/display`, icon: GitMerge, reqFs: true },
  ];

  return (
    <Sidebar collapsible="icon" className="bg-white dark:bg-[#0a0a0a] border-r-zinc-200 dark:border-r-white/5 text-zinc-600 dark:text-zinc-300">
      <SidebarHeader className={cn("h-16 flex items-center transition-all border-b border-zinc-200 dark:border-white/10", state === "collapsed" ? "justify-center px-0 flex-row" : "justify-between px-4 flex-row")}>
        {state !== "collapsed" && (
          <Link href="/" className="flex items-center overflow-hidden" onClick={() => setOpenMobile(false)}>
            <img src="/gameforsmartlogo.webp" loading="lazy" alt="GameForSmart Logo" width="180" height="40" decoding="async" data-nimg="1" className="object-contain shrink-0" style={{color:"transparent"}} />
          </Link>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className={cn("text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hidden md:flex shrink-0 transition-all", state === "collapsed" && "!w-12 !h-12")}
        >
           <PanelLeft className={cn("transition-all", state === "collapsed" ? "w-6 h-6" : "w-5 h-5")} />
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-zinc-500 font-bold uppercase tracking-wider mb-2">
            Competition Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {links.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                
                const handleClick = async (e: React.MouseEvent) => {
                  if (link.reqFs) {
                    e.preventDefault();
                    try {
                      if (!document.fullscreenElement) {
                        await document.documentElement.requestFullscreen();
                      }
                    } catch (err) {
                      console.error("Fullscreen request failed", err);
                    }
                    router.push(link.href);
                  }
                  setOpenMobile(false);
                };

                return (
                  <SidebarMenuItem key={link.name}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive}
                      tooltip={link.name}
                      className={cn(
                        "transition-all !h-12 rounded-lg group-data-[collapsible=icon]:!w-12 group-data-[collapsible=icon]:!h-12 group-data-[collapsible=icon]:!p-3",
                        isActive ? "bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-white dark:hover:bg-white/15" : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-white"
                      )}
                    >
                      <Link href={link.href} onClick={handleClick}>
                        <Icon className={cn("!w-5 !h-5", isActive ? "text-primary" : "text-zinc-400")} />
                        <span className="text-sm font-medium ml-1">{link.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={async (e) => {
                    e.preventDefault();
                    if (document.fullscreenElement) {
                      try {
                        await document.exitFullscreen();
                      } catch (err) {
                        console.error("Exit fullscreen failed", err);
                      }
                    }
                    router.push(`/admin/competitions/${slug}`);
                    setOpenMobile(false);
                  }}
                  tooltip="Exit to Dashboard"
                  className="transition-all !h-12 rounded-lg group-data-[collapsible=icon]:!w-12 group-data-[collapsible=icon]:!h-12 group-data-[collapsible=icon]:!p-3 text-red-600 dark:text-red-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10 dark:hover:text-red-300 mt-4"
                >
                  <LogOut className="!w-5 !h-5" />
                  <span className="text-sm font-medium ml-1">Exit to Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
