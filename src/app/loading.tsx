import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-10 w-48 rounded-md" />
        <Skeleton className="h-4 w-32 rounded-md" />
      </div>
    </div>
  );
}
