
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFirestore } from "@/firebase";
import { CaseStatus } from "@/lib/types";
import { collection, query, orderBy, addDoc, doc, deleteDoc, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Category } from "@/lib/types";
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
import { Lock, X } from "lucide-react";
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";

export default function SettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#aabbcc');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; label: string; type: 'status' | 'category' } | null>(null);

  const [statuses, setStatuses] = useState<CaseStatus[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const statusesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'statuses'), orderBy('label'));
  }, [firestore]);
  
  const categoriesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'), orderBy('label'));
  }, [firestore]);

  useEffect(() => {
    if (!statusesQuery) return;
    const unsubscribe = onSnapshot(statusesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as CaseStatus));
      setStatuses(data);
    }, (error) => {
      console.error("Error fetching statuses:", error);
      const permissionError = new FirestorePermissionError({ path: 'statuses', operation: 'list' });
      errorEmitter.emit('permission-error', permissionError);
    });
    return () => unsubscribe();
  }, [statusesQuery]);

  useEffect(() => {
    if (!categoriesQuery) return;
    const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as Category));
      setCategories(data);
    }, (error) => {
      console.error("Error fetching categories:", error);
      const permissionError = new FirestorePermissionError({ path: 'categories', operation: 'list' });
      errorEmitter.emit('permission-error', permissionError);
    });
    return () => unsubscribe();
  }, [categoriesQuery]);


  const handleAddStatus = async () => {
    if (!newStatusLabel.trim() || !firestore) return;
    setIsSubmittingStatus(true);
    try {
      await addDoc(collection(firestore, 'statuses'), {
        label: newStatusLabel,
        color: newStatusColor,
        isDefault: false
      });
      toast({
        title: "Status Added",
        description: `The status "${newStatusLabel}" has been created.`,
      });
      setNewStatusLabel('');
      setNewStatusColor('#aabbcc');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add new status.",
      });
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryLabel.trim() || !firestore) return;
    setIsSubmittingCategory(true);
    try {
      await addDoc(collection(firestore, 'categories'), {
        label: newCategoryLabel
      });
      toast({
        title: "Category Added",
        description: `The category "${newCategoryLabel}" has been created.`,
      });
      setNewCategoryLabel('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add new category.",
      });
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete || !firestore) return;

    const collectionName = itemToDelete.type === 'status' ? 'statuses' : 'categories';
    
    try {
      await deleteDoc(doc(firestore, collectionName, itemToDelete.id));
      toast({
        title: `${itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1)} Removed`,
        description: `The ${itemToDelete.type} "${itemToDelete.label}" has been deleted.`,
      });
    } catch (error: any) {
        toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to remove ${itemToDelete.type}.`,
      });
    } finally {
      setItemToDelete(null);
    }
  };


  return (
    <>
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            Customize the look and feel of your portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div>
            <h3 className="font-medium mb-4">Portal Logo</h3>
            <div className="flex items-center gap-4">
              <div className="space-y-2 flex-grow">
                <Label htmlFor="logo-upload">Upload Logo</Label>
                <Input 
                  id="logo-upload" 
                  type="file"
                />
              </div>
              <div className="self-end">
                 <Button disabled>Upload</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Case Status Management</CardTitle>
          <CardDescription>
            Add or remove custom case statuses for your workflow. Default statuses cannot be removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-4">Current Statuses</h3>
            <div className="flex flex-wrap gap-2">
              {statuses?.filter(s => s.isDefault === true).map(status => (
                <div key={status.docId} className="flex items-center gap-2 rounded-full border pl-3 pr-1 py-1 text-sm text-white" style={{ backgroundColor: status.color }}>
                  <Lock className="h-3 w-3" />
                  <span>{status.label}</span>
                </div>
              ))}
              {statuses?.filter(s => s.isDefault === false).map(status => (
                <div key={status.docId} className="flex items-center gap-2 rounded-full border pl-3 pr-1 py-1 text-sm text-white" style={{ backgroundColor: status.color }}>
                  <span>{status.label}</span>
                  <button onClick={() => setItemToDelete({ id: status.docId!, label: status.label, type: 'status' })} className="h-4 w-4 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/40">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />

          <div>
            <h3 className="font-medium mb-4">Add New Status</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="space-y-2 flex-grow">
                <Label htmlFor="status-label">Status Label</Label>
                <Input 
                  id="status-label" 
                  placeholder="e.g., 'Awaiting Evidence'"
                  value={newStatusLabel}
                  onChange={(e) => setNewStatusLabel(e.target.value)}
                />
              </div>
               <div className="space-y-2">
                  <Label>Status Color</Label>
                  <div className="flex items-center gap-2">
                     <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: newStatusColor }}></div>
                            <span>{newStatusColor}</span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <HexColorPicker color={newStatusColor} onChange={setNewStatusColor} />
                      </PopoverContent>
                    </Popover>
                  </div>
              </div>
              <div className="self-end">
                <Button onClick={handleAddStatus} disabled={isSubmittingStatus || !newStatusLabel.trim()}>
                  {isSubmittingStatus ? 'Adding...' : 'Add Status'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Management</CardTitle>
          <CardDescription>
            Add or remove report categories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div>
            <h3 className="font-medium mb-4">Current Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories?.map(category => (
                <div key={category.docId} className="flex items-center gap-2 rounded-full border pl-3 pr-1 py-1 text-sm bg-secondary">
                  <span>{category.label}</span>
                  <button onClick={() => setItemToDelete({ id: category.docId!, label: category.label, type: 'category' })} className="h-4 w-4 rounded-full flex items-center justify-center bg-muted-foreground/20 hover:bg-muted-foreground/40 text-secondary-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />

          <div>
            <h3 className="font-medium mb-4">Add New Category</h3>
            <div className="flex items-center gap-4">
              <div className="space-y-2 flex-grow">
                <Label htmlFor="category-label">Category Label</Label>
                <Input 
                  id="category-label" 
                  placeholder="e.g., 'Cybersecurity'"
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                />
              </div>
              <div className="self-end">
                 <Button onClick={handleAddCategory} disabled={isSubmittingCategory || !newCategoryLabel.trim()}>
                  {isSubmittingCategory ? 'Adding...' : 'Add Category'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {itemToDelete?.type} "{itemToDelete?.label}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
