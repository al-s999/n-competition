import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: "error" | "info" | "success";
}

export function AlertModal({ isOpen, onClose, title, message, type = "error" }: AlertModalProps) {
  const Icon = type === "error" ? AlertTriangle : type === "success" ? CheckCircle : Info;
  const iconColor = type === "error" ? "text-red-500" : type === "success" ? "text-[#00e599]" : "text-blue-500";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#121212] border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${iconColor}`} />
            {title || (type === "error" ? "Error" : type === "success" ? "Success" : "Information")}
          </DialogTitle>
          <DialogDescription className="pt-2 text-zinc-600 dark:text-zinc-400">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
