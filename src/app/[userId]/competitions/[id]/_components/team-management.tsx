"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MemberService } from "@/features/members/data/service";
import { AuthService } from "@/features/auth/data/service";
import { CompetitionMember } from "@/features/members/data/types";
import { User } from "@/features/auth/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, Search, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useActiveContext } from "@/hooks/use-active-context";

interface EnrichedMember extends CompetitionMember {
  email?: string;
  name?: string;
  username?: string;
}

export function TeamManagement({ competitionId }: { competitionId: string }) {
  const [members, setMembers] = useState<EnrichedMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { activeRole } = useActiveContext();
  const isReadOnly = activeRole === "RECEPTIONIST";

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("manager");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const mems = await MemberService.getMembersByCompetition(competitionId);
        const enriched = await Promise.all(
          mems.map(async (m) => {
            const u = await AuthService.getCurrentUser(m.user_id);
            return { ...m, email: u?.email, name: u?.name, username: u?.username };
          })
        );
        setMembers(enriched);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [competitionId, refreshKey]);

  useEffect(() => {
    if (isAddModalOpen && allUsers.length === 0) {
      AuthService.getAllUsers().then(setAllUsers);
    }
    if (!isAddModalOpen) {
      setSearchQuery("");
      setPage(1);
    }
  }, [isAddModalOpen, allUsers.length]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const handleAddMember = async () => {
    if (isReadOnly) return;
    if (!selectedUserId || !selectedRole) {
      toast.error("Pilih user dan role!");
      return;
    }
    
    // check if user already exists
    if (members.find(m => m.user_id === selectedUserId)) {
      toast.error("User ini sudah ada dalam tim.");
      return;
    }

    setIsSubmitting(true);
    try {
      await MemberService.createMember({
        id: "", 
        competition_id: competitionId,
        user_id: selectedUserId,
        role: selectedRole as any,
        created_at: new Date().toISOString()
      });
      toast.success("Anggota tim berhasil ditambahkan!");
      setRefreshKey(k => k + 1);
      setIsAddModalOpen(false);
      setSelectedUserId("");
      setSelectedRole("manager");
    } catch (err) {
      console.error(err);
      toast.error("Gagal menambahkan anggota.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (isReadOnly) return;
    if (confirm("Yakin ingin menghapus anggota ini dari tim?")) {
      try {
        await MemberService.deleteMember(id);
        toast.success("Anggota berhasil dihapus.");
        setRefreshKey(k => k + 1);
      } catch (err) {
        console.error(err);
        toast.error("Gagal menghapus anggota.");
      }
    }
  };

  const filteredUsers = allUsers.filter(u => {
    const query = searchQuery.toLowerCase();
    return (u.name?.toLowerCase().includes(query) || 
            u.username?.toLowerCase().includes(query) || 
            u.email.toLowerCase().includes(query));
  });

  const totalPages = Math.ceil(filteredUsers.length / 5);
  const paginatedUsers = filteredUsers.slice((page - 1) * 5, page * 5);

  return (
    <div className="space-y-4 bg-slate-950/70 p-4 rounded-3xl border border-slate-800 shadow-none dark:bg-slate-950 dark:border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Kelola Tim Kompetisi</h2>
        </div>
        
        {!isReadOnly && (
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-9 shrink-0">
                <Plus className="h-4 w-4" />
                Tambah Anggota
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] flex flex-col gap-0 p-0">
              <DialogHeader className="p-6 pb-4">
                <DialogTitle>Tambah Anggota Tim</DialogTitle>
              </DialogHeader>
              
              <div className="px-6 pb-2 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="role">Peran</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue placeholder="Pilih peran..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="mc">MC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    autoFocus
                    placeholder="Cari pengguna berdasarkan nama, username, atau email..." 
                    className="pl-9" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="px-6 flex flex-col max-h-[350px]">
                <div className="border rounded-md flex-1 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            Tidak ada pengguna ditemukan.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedUsers.map((user) => (
                          <TableRow 
                            key={user.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedUserId(user.id)}
                          >
                            <TableCell className="p-4">
                              <div className="flex items-center justify-center">
                                 {selectedUserId === user.id ? (
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                 ) : (
                                    <div className="h-5 w-5 rounded-full border border-muted-foreground/30" />
                                 )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                 <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs shrink-0">
                                   {user.name ? user.name.substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase()}
                                 </div>
                                 <span className="font-medium text-sm">{user.username || "Tanpa Username"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button 
                     variant="outline" 
                     size="sm" 
                     onClick={() => setPage(p => Math.max(1, p - 1))}
                     disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Halaman {page} dari {totalPages || 1}
                  </div>
                  <Button 
                     variant="outline" 
                     size="sm" 
                     onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                     disabled={page === totalPages || totalPages === 0}
                  >
                    Next
                  </Button>
                </div>
              </div>

              <DialogFooter className="p-6 pt-2 border-t">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button onClick={handleAddMember} disabled={isSubmitting || !selectedUserId}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:bg-slate-950 dark:border-slate-800 dark:shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/20 text-xs text-muted-foreground">
              <TableHead className="px-4 py-3 font-medium">Users</TableHead>
              <TableHead className="px-4 py-3 font-medium">Peran</TableHead>
              {!isReadOnly && <TableHead className="px-4 py-3 text-right font-medium">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell className="px-4 py-3 text-right">
                      <Skeleton className="h-8 w-16 ml-auto rounded-md" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isReadOnly ? 2 : 3} className="text-center h-24 text-sm text-muted-foreground">Belum ada tim yang ditugaskan di kompetisi ini.</TableCell>
              </TableRow>
            ) : (
              members.map((m) => (
                <TableRow key={m.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <TableCell className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{m.name || "Tanpa Nama"}</span>
                      <span className="text-xs text-muted-foreground">{m.email || m.user_id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="outline" className="capitalize text-xs font-medium">{m.role}</Badge>
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteMember(m.id)} className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                        Delete
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

