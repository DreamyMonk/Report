"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitReport } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileUp, AlertTriangle } from "lucide-react";

const ReportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  category: z.enum(["Financial", "HR", "Safety", "Other"]),
  content: z.string().min(20, "Description must be at least 20 characters long."),
  isAnonymous: z.boolean().default(false),
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
  const initialState = { message: null, errors: {}, success: false };
  const [state, dispatch] = useFormState(submitReport, initialState);
  const { toast } = useToast();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(ReportSchema),
    defaultValues: {
      title: "",
      category: undefined,
      content: "",
      isAnonymous: false,
    },
  });

  useEffect(() => {
    if (state.success && state.message) {
      toast({
        title: "Submission Successful",
        description: state.message,
      });
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
    <Form {...form}>
      <form action={dispatch} className="space-y-6">
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
                  <SelectItem value="Financial">Financial Misconduct</SelectItem>
                  <SelectItem value="HR">HR & Harassment</SelectItem>
                  <SelectItem value="Safety">Health & Safety</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
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

        <FormField
          control={form.control}
          name="isAnonymous"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-background">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  name="isAnonymous"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Submit Anonymously</FormLabel>
                <p className="text-sm text-muted-foreground">
                  If checked, your identity will not be attached to this report.
                </p>
              </div>
            </FormItem>
          )}
        />

        <SubmitButton />
      </form>
    </Form>
  );
}
