
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteReport } from "@/lib/actions";
import { Report } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

interface DeleteReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    report: Report;
}

const initialState = {
  message: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <AlertDialogAction type="submit" disabled={pending} className="bg-destructive hover:bg-destructive/90">
      {pending ? <Loader2 className="animate-spin" /> : "Delete"}
    </AlertDialogAction>
  );
}

export function DeleteReportDialog({ open, onOpenChange, report }: DeleteReportDialogProps) {
  const [state, dispatch] = useActionState(deleteReport, initialState);
  const { toast } = useToast();

   useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Success',
          description: state.message,
        });
        onOpenChange(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      }
    }
  }, [state, toast, onOpenChange]);


  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
        <form action={dispatch}>
            <input type="hidden" name="reportId" value={report.docId} />
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the report titled "<span className="font-semibold">{report.title}</span>" and all of its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <SubmitButton />
          </AlertDialogFooter>
        </form>
        </AlertDialogContent>
      </AlertDialog>
  )
}
