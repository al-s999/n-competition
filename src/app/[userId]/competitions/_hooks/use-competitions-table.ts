import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CompetitionService } from "@/features/competitions/data/service";
import { Competition } from "@/features/competitions/data/types";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/features/auth/context";
import { MemberService } from "@/features/members/data/service";

export function useCompetitionsTable() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  
  const [previewPoster, setPreviewPoster] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  const [deleteTarget, setDeleteTarget] = useState<Competition | null>(null);
  const [deleteConfirmationPhrase, setDeleteConfirmationPhrase] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 150);
  const { user } = useAuth();

  useEffect(() => {
    setSearchQuery(debouncedSearch);
    setCurrentPage(1);
  }, [debouncedSearch]);

  const [allCompetitions, setAllCompetitions] = useState<Competition[]>([]);

  // Helper to safely extract categories as string array
  const extractCategories = (comp: Competition): string[] => {
    if (comp.categories && Array.isArray(comp.categories) && comp.categories.length > 0) {
      return comp.categories.map((c: any) => typeof c === 'string' ? c : (c.name || ''));
    }
    if (comp.category) {
      return comp.category.split(',').map(s => s.trim());
    }
    return [];
  };

  const fetchCompetitions = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      let fetchedComps: Competition[] = [];

      if (user.role?.toLowerCase() === "competition") {
        fetchedComps = await CompetitionService.getCompetitionsByOwner(user.id);
      } else {
        const members = await MemberService.getMembersByUser(user.id);
        const compIds = members
          .filter(m => m.role === "MANAGER" || m.role === "RECEPTIONIST" || m.role === "MC")
          .map(m => m.competition_id);
        
        // Remove duplicates if any
        const uniqueIds = Array.from(new Set(compIds));
        
        const comps = await Promise.all(uniqueIds.map(id => CompetitionService.getCompetitionById(id)));
        fetchedComps = comps.filter(Boolean) as Competition[];
      }
      
      // Extract available filters
      const categoriesSet = new Set<string>();
      const locationsSet = new Set<string>();
      fetchedComps.forEach(c => {
        extractCategories(c).forEach(cat => {
          if (cat) categoriesSet.add(cat);
        });
        if (c.location) locationsSet.add(c.location);
      });
      setAvailableCategories(Array.from(categoriesSet).sort());
      setAvailableLocations(Array.from(locationsSet).sort());

      setAllCompetitions(fetchedComps);
    } catch (error: any) {
      console.error("Error fetching competitions:", error);
      toast.error(error.message || "Failed to load competitions");
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Fetch exactly once on mount or user change
  useEffect(() => {
    fetchCompetitions();
  }, [user]);

  // 2. Filter instantly when dependencies change
  useEffect(() => {
    let filtered = allCompetitions;
    if (searchQuery) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter(c => {
        const cats = extractCategories(c);
        return cats.includes(categoryFilter);
      });
    }
    if (locationFilter !== "all") {
      filtered = filtered.filter(c => c.location === locationFilter);
    }
    
    setTotalPages(Math.ceil(filtered.length / itemsPerPage) || 1);
    
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    setCompetitions(paginated);
  }, [currentPage, searchQuery, statusFilter, categoryFilter, locationFilter, allCompetitions]);

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (val: string) => {
    setCategoryFilter(val);
    setCurrentPage(1);
  };

  const handleLocationFilterChange = (val: string) => {
    setLocationFilter(val);
    setCurrentPage(1);
  };

  const tableData = useMemo(() => {
    return competitions.map((comp) => {
      const scheduleStart = comp.created_at
        ? format(new Date(comp.created_at), "d MMM yyyy")
        : "\u2014";
      const scheduleEnd = comp.updated_at
        ? format(new Date(comp.updated_at), "d MMM yyyy")
        : "\u2014";

      let categoryText = "\u2014";
      if (comp.categories && Array.isArray(comp.categories) && comp.categories.length > 0) {
        categoryText = comp.categories.map((c: any) => typeof c === 'string' ? c : c.name).join(", ");
      } else if (comp.category) {
        categoryText = comp.category;
      }

      return {
        id: comp.id,
        poster_url: null,
        title: comp.name,
        categoryDisplay: categoryText,
        location: comp.location || "\u2014",
        status: comp.status,
        schedule: `${scheduleStart} \u2014 ${scheduleEnd}`,
        participantCount: 0,
      };
    });
  }, [competitions]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleDeleteCompetition = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await CompetitionService.deleteCompetition(deleteTarget.id);
      toast.success("Competition deleted successfully");
      setDeleteTarget(null);
      setDeleteConfirmationPhrase("");
      fetchCompetitions();
    } catch (err: any) {
      console.error("Delete competition error:", err);
      const errorMessage = 
        err?.message || 
        err?.statusText || 
        (typeof err === "string" ? err : "Failed to delete competition");
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    competitions,
    isLoading,
    searchInput,
    setSearchInput,
    handleSearch,
    handleKeyDown,
    statusFilter,
    handleStatusFilterChange,
    categoryFilter,
    handleCategoryFilterChange,
    availableCategories,
    locationFilter,
    handleLocationFilterChange,
    availableLocations,
    previewPoster,
    setPreviewPoster,
    currentPage,
    setCurrentPage,
    totalPages,
    tableData,
    deleteTarget,
    setDeleteTarget,
    deleteConfirmationPhrase,
    setDeleteConfirmationPhrase,
    isDeleting,
    handleDeleteCompetition,
  };
}
