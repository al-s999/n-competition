import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-500 hover:bg-gray-600" },
  registration: { label: "Registration", color: "bg-blue-500 hover:bg-blue-600" },
  ongoing: { label: "Berjalan", color: "bg-yellow-500 hover:bg-yellow-600 text-black" },
  finished: { label: "Completed", color: "bg-green-500 hover:bg-green-600" },
  registered: { label: "Registered", color: "bg-gray-400 hover:bg-gray-500" },
  confirmed: { label: "Dikonfirmasi", color: "bg-blue-400 hover:bg-blue-500" },
  paid: { label: "Paid", color: "bg-green-400 hover:bg-green-500 text-black" },
  qualified: { label: "Lolos", color: "bg-purple-500 hover:bg-purple-600" },
  final: { label: "Final", color: "bg-indigo-500 hover:bg-indigo-600" },
  pending: { label: "Pending", color: "bg-yellow-500 hover:bg-yellow-600 text-black" },
  verified: { label: "Verified", color: "bg-green-500 hover:bg-green-600" },
  rejected: { label: "Ditolak", color: "bg-red-500 hover:bg-red-600" },
  present: { label: "Hadir", color: "bg-green-500 hover:bg-green-600" },
  absent: { label: "Tidak Hadir", color: "bg-red-500 hover:bg-red-600" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = statusConfig[status] || { label: status, color: "bg-gray-500" };
  return (
    <Badge className={cn("transition-colors font-medium border-transparent shadow-sm", config.color, className)}>
      {config.label}
    </Badge>
  );
}
