
"use client";

import { useMemo, useState, useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileUp, Download } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useFirestore } from "@/firebase";
import { Category } from "@/lib/types";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { submitReport } from "@/lib/actions";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const initialState = {
  message: null,
  success: false,
  reportId: null,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? <Loader2 className="animate-spin" /> : "Submit Securely"}
        </Button>
    )
}

export function ReportSubmissionForm() {
  const { toast } = useToast();
  const [state, dispatch] = useActionState(submitReport, initialState);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const firestore = useFirestore();
  const [submissionType, setSubmissionType] = useState('confidential');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: "Success",
          description: state.message,
        });
        setGeneratedId(state.reportId);
        setShowSuccessDialog(true);
        const form = document.getElementById('report-submission-form') as HTMLFormElement;
        form?.reset();
        setSubmissionType('confidential');

      } else {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: state.message,
        });
      }
    }
  }, [state, toast]);

  useEffect(() => {
    if (!firestore) return;
    const categoriesCollection = collection(firestore, 'categories');
    const categoriesQuery = query(categoriesCollection, orderBy('label'));
    const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
        const cats = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as Category));
        setCategories(cats);
    },
    (error) => {
        console.error("Error fetching categories:", error);
        const permissionError = new FirestorePermissionError({
          path: categoriesCollection.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    return () => unsubscribe();
  }, [firestore]);


  const copyToClipboard = () => {
    if (generatedId) {
      navigator.clipboard.writeText(generatedId).then(() => {
        toast({
          title: "Copied!",
          description: "Your report ID has been copied to your clipboard.",
        });
      });
    }
  };
  
  const downloadAsTxt = () => {
    if (generatedId) {
      const blob = new Blob([`Your report ID is: ${generatedId}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report-id.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <>
    <form
      id="report-submission-form"
      action={dispatch}
      className="space-y-6"
    >
      <div className="space-y-3">
        <Label>Submission Type</Label>
        <RadioGroup
          name="submissionType"
          onValueChange={setSubmissionType}
          defaultValue={submissionType}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
              <Label className="cursor-pointer">
                <Card className={`hover:border-primary/50 transition-colors ${submissionType === 'confidential' ? 'ring-2 ring-primary border-primary' : 'border-border'}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                      <RadioGroupItem value="confidential" id="confidential" />
                      <div className="space-y-1">
                          <p className="font-medium">Submit Confidentially</p>
                          <p className="text-sm text-muted-foreground">Your identity is shared only with the assigned case officer. Email is required.</p>
                      </div>
                  </CardContent>
                </Card>
              </Label>
          </div>
          <div>
              <Label className="cursor-pointer">
              <Card className={`hover:border-primary/50 transition-colors ${submissionType === 'anonymous' ? 'ring-2 ring-primary border-primary' : 'border-border'}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                      <RadioGroupItem value="anonymous" id="anonymous" />
                      <div className="space-y-1">
                          <p className="font-medium">Submit Anonymously</p>
                          <p className="text-sm text-muted-foreground">Your identity is completely hidden. You can optionally provide an email for updates.</p>
                      </div>
                  </CardContent>
              </Card>
              </Label>
          </div>
        </RadioGroup>
      </div>
      
      {submissionType === 'confidential' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input name="name" id="name" placeholder="Your Name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input name="email" id="email" type="email" placeholder="your.email@example.com" required/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input name="phone" id="phone" placeholder="Your Phone Number" />
            </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Report Title</Label>
        <Input name="title" id="title" placeholder="e.g., Unsafe working conditions in warehouse" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select name="category" required>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((cat) => (
              <SelectItem key={cat.docId} value={cat.label}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Detailed Description</Label>
        <Textarea
          name="content"
          id="content"
          placeholder="Please provide as much detail as possible. Include dates, times, locations, and names of individuals involved if known."
          className="min-h-[150px]"
          required
        />
      </div>
      
      <div className="space-y-2">
          <Label>Attachments (Optional)</Label>
          <div className="flex items-center justify-center w-full">
              <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileUp className="w-8 h-8 mb-4 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PDF, PNG, JPG, or DOCX (MAX. 10MB)</p>
                  </div>
                  <Input id="dropzone-file" type="file" className="hidden" />
              </Label>
          </div>
      </div>

      <SubmitButton />
    </form>
    <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Thank you for your submission.</AlertDialogTitle>
          <AlertDialogDescription>
            We will take action on your report. Please save this unique ID to track the status of your case.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4 p-4 bg-secondary rounded-lg text-center font-mono text-lg font-semibold tracking-widest">
            {generatedId}
        </div>
        <AlertDialogFooter>
          <Button variant="outline" onClick={copyToClipboard}>Copy ID</Button>
          <Button variant="outline" onClick={downloadAsTxt}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
