
"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitReport } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileUp, Info } from "lucide-react";
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
import { Alert, AlertDescription } from "../ui/alert";
import { useCollection, useFirestore } from "@/firebase";
import { Category } from "@/lib/types";
import { collection } from "firebase/firestore";

const ReportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  category: z.string({ required_error: "Please select a category." }),
  content: z.string().min(20, "Description must be at least 20 characters long."),
  submissionType: z.enum(["anonymous", "confidential"]),
  name: z.string().optional(),
  email: z.string().optional(),
}).refine(data => {
  if (data.submissionType === 'confidential') {
    return !!data.email && z.string().email().safeParse(data.email).success;
  }
  return true;
}, {
  message: "A valid email is required for confidential submissions.",
  path: ["email"],
}).refine(data => {
  if (data.submissionType === 'anonymous' && data.email) {
     return z.string().email().safeParse(data.email).success;
  }
  return true;
},
{
  message: "Please enter a valid email address.",
  path: ["email"],
});


type ReportFormValues = z.infer<typeof ReportSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="animate-spin" /> : "Submit Securely"}
    </Button>
  );
}

export function ReportSubmissionForm() {
  const initialState = { message: null, errors: {}, success: false, reportId: null };
  const [state, dispatch] = useActionState(submitReport, initialState);
  const { toast } = useToast();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const firestore = useFirestore();

  const categoriesQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: categories } = useCollection<Category>(categoriesQuery);


  const form = useForm<ReportFormValues>({
    resolver: zodResolver(ReportSchema),
    defaultValues: {
      title: "",
      category: undefined,
      content: "",
      submissionType: "anonymous",
      name: "",
      email: "",
    },
  });

  const submissionType = form.watch("submissionType");

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

  useEffect(() => {
    if (state.success && state.message && state.reportId) {
      setGeneratedId(state.reportId);
      setShowSuccessDialog(true);
      form.reset();
    } else if (!state.success && state.message) {
       toast({
        variant: "destructive",
        title: "Submission Failed",
        description: state.message,
      });
    }
  }, [state, toast, form]);

  return (
    <>
    <Form {...form}>
      <form
        action={(formData) => {
          const valid = form.trigger();
          if (valid) {
            dispatch(formData);
          }
        }}
        className="space-y-6"
      >

        <Alert variant="default" className="border-blue-500/50 text-blue-900 dark:text-blue-200 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400">
            <Info className="h-4 w-4" />
            <AlertDescription>
                We do not track your IP address. If you choose "Confidential", your details will only be visible to the assigned case officer.
            </AlertDescription>
        </Alert>

        <FormField
          control={form.control}
          name="submissionType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Submission Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <FormItem>
                     <Label className="cursor-pointer">
                      <Card className={`hover:border-primary/50 transition-colors ${field.value === 'anonymous' ? 'ring-2 ring-primary border-primary' : 'border-border'}`}>
                          <CardContent className="p-4 flex items-center gap-4">
                              <RadioGroupItem value="anonymous" id="anonymous" />
                              <div className="space-y-1">
                                  <p className="font-medium">Submit Anonymously</p>
                                  <p className="text-sm text-muted-foreground">Your identity is completely hidden. You can optionally provide an email for updates.</p>
                              </div>
                          </CardContent>
                      </Card>
                     </Label>
                  </FormItem>
                  <FormItem>
                     <Label className="cursor-pointer">
                        <Card className={`hover:border-primary/50 transition-colors ${field.value === 'confidential' ? 'ring-2 ring-primary border-primary' : 'border-border'}`}>
                          <CardContent className="p-4 flex items-center gap-4">
                              <RadioGroupItem value="confidential" id="confidential" />
                              <div className="space-y-1">
                                  <p className="font-medium">Submit Confidentially</p>
                                  <p className="text-sm text-muted-foreground">Your identity is shared only with the assigned case officer. Email is required.</p>
                              </div>
                          </CardContent>
                        </Card>
                     </Label>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {submissionType === 'confidential' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Required)</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
           </div>
        )}
        
         {submissionType === 'anonymous' && (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email for Updates (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="your.email@example.com" {...field} />
                  </FormControl>
                   <p className="text-xs text-muted-foreground">Provide an email if you want to receive notifications about your case.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
        )}


        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Unsafe working conditions in warehouse" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories?.map(cat => (
                    <SelectItem key={cat.docId} value={cat.label}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detailed Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please provide as much detail as possible. Include dates, times, locations, and names of individuals involved if known."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
    </Form>
    <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Submission Successful!</AlertDialogTitle>
          <AlertDialogDescription>
            Thank you for your courage and integrity. Your report has been submitted. Please save this unique ID to track the status of your report.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4 p-4 bg-secondary rounded-lg text-center font-mono text-lg font-semibold tracking-widest">
            {generatedId}
        </div>
        <AlertDialogFooter>
          <Button variant="outline" onClick={copyToClipboard}>Copy ID</Button>
          <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
