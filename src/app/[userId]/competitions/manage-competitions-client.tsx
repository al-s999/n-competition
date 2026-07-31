"use client";

import { useRouter, useParams } from "next/navigation";
import { Plus, Search, ChevronsDownUp, ChevronsUpDown, SlidersHorizontal, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/shared/data-table";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCompetitionsTable } from "./_hooks/use-competitions-table";
import { getCompetitionColumns } from "./_components/competition-columns";
import { CompetitionDialogs } from "./_components/competition-dialogs";
import { useAuth } from "@/features/auth/context";

const MOBILE_COLLAPSED_KEYS = ["poster", "title", "categoryDisplay"];

export function ManageCompetitionsClient() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const [mobileCollapsed, setMobileCollapsed] = useState(true);
  const { user } = useAuth();

  const {
    isLoading,
    searchInput,
    setSearchInput,
    handleSearch,
    handleKeyDown,
    previewPoster,
    setPreviewPoster,
    currentPage,
    setCurrentPage,
    totalPages,
    tableData,
    statusFilter,
    handleStatusFilterChange,
    categoryFilter,
    handleCategoryFilterChange,
    availableCategories,
    locationFilter,
    handleLocationFilterChange,
    availableLocations,
    deleteTarget,
    setDeleteTarget,
    deleteConfirmationPhrase,
    setDeleteConfirmationPhrase,
    isDeleting,
    handleDeleteCompetition,
  } = useCompetitionsTable();

  const compColumns = getCompetitionColumns(
    (key: string) => key,
    (url, title) => setPreviewPoster({ url, title }),
    (item) => {
      setDeleteTarget(item);
      setDeleteConfirmationPhrase("");
    },
    false, // isManager
    user?.role === "mc" // readOnly
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Competitions
        </h1>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Input
              placeholder="Search by title..."
              className="pr-10 w-full sm:w-64 bg-background border-border"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[160px] shrink-0 bg-background border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap truncate">
                <SlidersHorizontal className="h-3.5 w-3.5 hidden sm:block" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="coming_soon">Coming Soon</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
            <SelectTrigger className="w-[160px] shrink-0 bg-background border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap truncate">
                <SlidersHorizontal className="h-3.5 w-3.5 hidden sm:block" />
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {availableCategories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={handleLocationFilterChange}>
            <SelectTrigger className="w-[160px] shrink-0 bg-background border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap truncate">
                <SlidersHorizontal className="h-3.5 w-3.5 hidden sm:block" />
                <SelectValue placeholder="Location" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {availableLocations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Collapse/Expand toggle — mobile only */}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden h-9 w-9 shrink-0"
            onClick={() => setMobileCollapsed((prev) => !prev)}
            title={mobileCollapsed ? "Expand All" : "Collapse All"}
          >
            {mobileCollapsed ? (
              <ChevronsUpDown className="h-4 w-4" />
            ) : (
              <ChevronsDownUp className="h-4 w-4" />
            )}
          </Button>
          {user?.role === "competition" && (
            <Button className="gap-1.5 shrink-0" onClick={() => router.push(`/${params?.userId}/competitions/create`)}>
              <Plus className="h-4 w-4 hidden sm:block" />
              <span className="hidden sm:inline">Add</span>
              <span className="sm:hidden text-lg leading-none">+</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <DataTableSkeleton />
      ) : (
        <DataTable
          columns={compColumns}
          data={tableData as Record<string, unknown>[]}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page: number) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onRowClick={(row) => router.push(`/${params?.userId}/competitions/${row.id}`)}
          mobileCollapsedKeys={MOBILE_COLLAPSED_KEYS}
          mobileCollapsed={mobileCollapsed}
          onToggleMobileCollapsed={() => setMobileCollapsed((prev) => !prev)}
        />
      )}

      {/* Dialogs */}
      <CompetitionDialogs
        t={(key: string) => key}
        previewPoster={previewPoster}
        setPreviewPoster={setPreviewPoster}
        deleteTarget={deleteTarget as any}
        setDeleteTarget={setDeleteTarget as any}
        deleteConfirmationPhrase={deleteConfirmationPhrase}
        setDeleteConfirmationPhrase={setDeleteConfirmationPhrase}
        isDeleting={isDeleting}
        handleDeleteCompetition={handleDeleteCompetition}
      />
    </div>
  );
}
