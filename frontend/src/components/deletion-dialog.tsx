import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { Trash } from "lucide-react";

type DeletionDialogProps = {
  triggerLabel: string;
  title: string;
  description?: string;
  onConfirm: () => void;
  confirmLabel?: string;
  showIcon?: boolean;
};

export default function DeletionDialog({
  triggerLabel,
  title,
  description,
  onConfirm,
  confirmLabel = "Delete",
  showIcon = true
}: DeletionDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-red-500">
          {showIcon && <Trash className="h-4 w-4" color="red" />}
          {triggerLabel !== "" && triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
