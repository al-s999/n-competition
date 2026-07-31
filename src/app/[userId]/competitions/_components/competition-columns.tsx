import { Competition } from "@/features/competitions/data/types";
import { format } from "date-fns";
import { Users, MoreHorizontal, Image as ImageIcon, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig: Record<string, any> = {
  published: {
    labelKey: "Published",
    fallback: "Published",
    className:
      "bg-emerald-500/15 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800",
  },
  draft: {
    labelKey: "Draft",
    fallback: "Draft",
    className:
      "bg-gray-500/15 text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700",
  },
  completed: {
    labelKey: "Completed",
    fallback: "Completed",
    className:
      "bg-blue-500/15 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
  },
  coming_soon: {
    labelKey: "Coming Soon",
    fallback: "Coming Soon",
    className:
      "bg-orange-500/15 text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800",
  },
  finished: {
    labelKey: "Finished",
    fallback: "Finished",
    className:
      "bg-purple-500/15 text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800",
  },
};

export const getCompetitionColumns = (
  t: any,
  onPreviewPoster: (url: string, title: string) => void,
  onDeleteInitiate: (item: Competition) => void,
  isManager: boolean = false,
  readOnly: boolean = false
) => {
  const columns = [
    {
      key: "poster",
      label: "Poster",
      render: (value: unknown, row: Record<string, unknown>) => {
        const posterUrl = row.poster_url as string | null;
        const title = row.title as string;
        return (
          <div
            className={`h-10 w-14 rounded overflow-hidden bg-muted flex items-center justify-center border shrink-0 ${
              posterUrl ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (posterUrl) onPreviewPoster(posterUrl, title);
            }}
          >
            {posterUrl ? (
              <img src={posterUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
            )}
          </div>
        );
      },
    },
    {
      key: "title",
      label: "Title",
      render: (value: unknown) => (
        <span className="font-medium truncate block max-w-[250px]" title={value as string}>
          {value as string}
        </span>
      ),
    },
    {
      key: "categoryDisplay",
      label: "Category",
      render: (value: unknown) => {
        const cat = value as string;
        return cat ? (
          <span
            className="text-sm text-muted-foreground truncate block max-w-[150px]"
            title={cat}
          >
            {cat}
          </span>
        ) : (
          <span className="text-muted-foreground">&mdash;</span>
        );
      },
    },
    {
      key: "location",
      label: "Location",
      render: (value: unknown) => {
        const loc = value as string;
        return loc && loc !== "\u2014" ? (
          <span
            className="text-sm text-muted-foreground truncate block max-w-[150px]"
            title={loc}
          >
            {loc}
          </span>
        ) : (
          <span className="text-muted-foreground">&mdash;</span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value: unknown) => {
        const status = value as string;
        const cfg = statusConfig[status] || {
          labelKey: status,
          fallback: status,
          className: "bg-gray-500/15 text-gray-500 border-gray-200",
        };
        return (
          <Badge variant="outline" className={`capitalize border ${cfg.className}`}>
            {cfg.labelKey}
          </Badge>
        );
      },
    },
    {
      key: "schedule",
      label: "Schedule",
      render: (value: unknown) => (
        <span className="text-xs whitespace-nowrap">{value as string}</span>
      ),
    },
    {
      key: "participantCount",
      label: "Participants",
      render: (value: unknown) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{(value as number || 0).toLocaleString("id-ID")}</span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (value: unknown, row: Record<string, unknown>) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={isManager ? `/manager/competitions/${row.id}/edit` : `/competitions/${row.id}/edit`} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            {!isManager && (
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteInitiate(row as unknown as Competition);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (readOnly) {
    return columns.filter((col) => col.key !== "actions");
  }

  return columns;
};
