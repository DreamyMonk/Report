
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Copy, Check } from "lucide-react";
import { nanoid } from "nanoid";

interface ShareReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
}

export function ShareReportDialog({ open, onOpenChange, reportId }: ShareReportDialogProps) {
  const firestore = useFirestore();
  const [expiry, setExpiry] = useState('1d');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();
  
  const handleShare = async () => {
    if (!firestore) return;
    setIsLoading(true);

    try {
      const shareId = nanoid(16);
      let expiresAt: Date = new Date();
      if (expiry === '1d') expiresAt.setDate(expiresAt.getDate() + 1);
      if (expiry === '7d') expiresAt.setDate(expiresAt.getDate() + 7);
      if (expiry === '30d') expiresAt.setDate(expiresAt.getDate() + 30);
      
      await addDoc(collection(firestore, 'shared_reports'), {
        id: shareId,
        reportId: reportId,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
      });

      const shareableLink = `${window.location.origin}/share/${shareId}`;
      setGeneratedLink(shareableLink);

    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Sharing Failed",
        description: error.message || "Could not generate shareable link.",
      });
    } finally {
        setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
     toast({
        title: "Copied!",
        description: "Shareable link copied to clipboard.",
    });
  }

  const resetState = () => {
    setGeneratedLink('');
    setIsLoading(false);
    setExpiry('1d');
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        setTimeout(resetState, 300);
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Report</DialogTitle>
          <DialogDescription>
            Generate a secure, time-limited link to share this report. Confidential reporter information will not be included.
          </DialogDescription>
        </DialogHeader>
        
        {generatedLink ? (
          <div className="py-4 space-y-4">
             <p className="text-sm text-muted-foreground">Your shareable link has been generated. It will expire based on your selection.</p>
            <div className="flex items-center space-x-2">
                <Input value={generatedLink} readOnly />
                <Button size="icon" onClick={copyToClipboard}>
                    {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
          </div>
        ) : (
            <div className="py-4 space-y-4">
                <p className="font-medium text-sm">Link Expiration</p>
                <RadioGroup defaultValue="1d" onValueChange={setExpiry} value={expiry}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1d" id="1d" />
                        <Label htmlFor="1d">1 Day</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="7d" id="7d" />
                        <Label htmlFor="7d">7 Days</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="30d" id="30d" />
                        <Label htmlFor="30d">30 Days</Label>
                    </div>
                </RadioGroup>
            </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
           {!generatedLink && (
             <Button onClick={handleShare} disabled={isLoading}>
                {isLoading ? "Generating..." : "Generate Link"}
             </Button>
           )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
