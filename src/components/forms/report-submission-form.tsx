
"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useCollection, useFirestore } from "@/firebase";
import { Category } from "@/lib/types";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { classifyReportSeverity } from "@/ai/flows/classify-report-severity";
import { summarizeReport } from "@/ai/flows/summarize-report-for-review";
import { suggestInvestigationSteps } from "@/ai/flows/suggest-investigation-steps";

function generateReportId() {
  const prefix = 'IB';
  const timestamp = Date.now().toString(36).slice(-4);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomPart}`.toUpperCase();
}


export function ReportSubmissionForm() {
  const { toast } = useToast();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const firestore = useFirestore();
  const [submissionType, setSubmissionType] = useState('anonymous');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoriesQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: categories } = useCollection<Category>(categoriesQuery);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Database not connected. Please try again later.",
      });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as string;
    const submissionType = formData.get('submissionType') as 'anonymous' | 'confidential';
    const name = formData.get('name') as string | null;
    const email = formData.get('email') as string | null;
    const phone = formData.get('phone') as string | null;
    
    if (!title || !content || !category) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Please fill out all required fields.",
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
        const reportId = generateReportId();

        const [severityResult, summaryResult] = await Promise.all([
            classifyReportSeverity({ reportText: content }),
            summarizeReport({ reportText: content })
        ]);

        const stepsResult = await suggestInvestigationSteps({
            reportContent: content,
            riskLevel: severityResult.severityLevel as 'low' | 'medium' | 'high'
        });

        const severityMap = {
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High'
        }

        const reportData = {
          id: reportId,
          title,
          content,
          category,
          submissionType,
          reporter: {
            name: name || null,
            email: email || null,
            phone: phone || null,
          },
          submittedAt: serverTimestamp(),
          status: 'New',
          severity: severityMap[severityResult.severityLevel] || 'Medium',
          assignees: [],
          aiSummary: summaryResult.summary,
          aiRiskAssessment: summaryResult.riskAssessment,
          aiSuggestedSteps: stepsResult.suggestedSteps,
          aiReasoning: severityResult.reasoning,
        };

        const reportRef = await addDoc(collection(firestore, 'reports'), reportData);

        await addDoc(collection(firestore, 'audit_logs'), {
            reportId: reportRef.id,
            actor: { id: 'system', name: 'System' },
            action: 'submitted a new report',
            timestamp: serverTimestamp()
        });

        setGeneratedId(reportId);
        setShowSuccessDialog(true);
        (event.target as HTMLFormElement).reset();
        setSubmissionType('anonymous');

    } catch (e: any) {
        console.error('Submission Error:', e);
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: e.message || 'An unexpected error occurred. Please try again later.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };


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
      onSubmit={handleSubmit}
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

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Loader2 className="animate-spin" /> : "Submit Securely"}
      </Button>
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

    