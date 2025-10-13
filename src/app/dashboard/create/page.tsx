
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { Category } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { createInternalCase } from '@/lib/actions';
import { useAuth } from '@/firebase/auth-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const initialState = {
  message: null,
  success: false,
  reportId: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create Case
    </Button>
  );
}

export default function CreateCasePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, dispatch] = useActionState(createInternalCase, initialState);
  const { user } = useAuth();
  const firestore = useFirestore();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Case Created',
          description: state.message,
        });
        router.push(`/dashboard/reports/${state.reportId}`);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      }
    }
  }, [state, toast, router]);
  
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


  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Create Internal Case</h1>
      </div>
      <Card className="max-w-2xl mx-auto">
        <form action={dispatch}>
           <input type="hidden" name="creatorId" value={user?.uid} />
          <CardHeader>
            <CardTitle>New Case Details</CardTitle>
            <CardDescription>Create a case internally. You will be automatically assigned as the creator and lead investigator.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="title">Case Title</Label>
                <Input name="title" id="title" placeholder="e.g., Consolidated investigation into Q3 financial anomalies" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="severity">Severity</Label>
                    <Select name="severity" defaultValue="Medium" required>
                        <SelectTrigger id="severity">
                            <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="Critical">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-red-500" />
                                    Critical
                                </div>
                            </SelectItem>
                            <SelectItem value="High">
                                <div className="flex items-center gap-2">
                                    <ShieldX className="h-4 w-4 text-orange-500" />
                                    High
                                </div>
                            </SelectItem>
                            <SelectItem value="Medium">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-yellow-500" />
                                    Medium
                                </div>
                            </SelectItem>
                            <SelectItem value="Low">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-green-500" />
                                    Low
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="content">Detailed Description</Label>
                <Textarea
                name="content"
                id="content"
                placeholder="Provide a summary of the issue, why this case is being created, and any initial findings or context."
                className="min-h-[150px]"
                required
                />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
