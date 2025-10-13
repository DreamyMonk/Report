
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

interface ViewSecretCodeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trackingId: string;
}


export function ViewSecretCodeDialog({ open, onOpenChange, trackingId }: ViewSecretCodeDialogProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    if (trackingId) {
      navigator.clipboard.writeText(trackingId).then(() => {
        toast({
          title: "Copied!",
          description: "Your tracking ID has been copied to your clipboard.",
        });
      });
    }
  };
  
  const downloadAsTxt = () => {
    if (trackingId) {
      const blob = new Blob([`Report tracking ID is: ${trackingId}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report-tracking-id.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Public Tracking ID</AlertDialogTitle>
          <AlertDialogDescription>
            This is the secret tracking ID that can be shared publicly for read-only status tracking.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4 p-4 bg-secondary rounded-lg text-center font-mono text-lg font-semibold tracking-widest">
            {trackingId}
        </div>
        <AlertDialogFooter>
          <Button variant="outline" onClick={copyToClipboard}>Copy ID</Button>
          <Button variant="outline" onClick={downloadAsTxt}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <AlertDialogAction onClick={() => onOpenChange(false)}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
