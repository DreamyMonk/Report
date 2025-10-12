'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCollection, useFirestore } from "@/firebase";
import { CaseStatus } from "@/lib/types";
import { collection, query, orderBy, addDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Paintbrush } from "lucide-react";

export default function SettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#aabbcc');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const statusesQuery = query(collection(firestore!, 'statuses'), orderBy('label'));
  const { data: statuses } = useCollection<CaseStatus>(statusesQuery, { listen: !!firestore });

  const handleAddStatus = async () => {
    if (!newStatusLabel.trim() || !firestore) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'statuses'), {
        label: newStatusLabel,
        color: newStatusColor
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Case Status Management</CardTitle>
          <CardDescription>
            Add, edit, or remove custom case statuses for your workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-4">Current Statuses</h3>
            <div className="flex flex-wrap gap-2">
              {statuses?.map(status => (
                <div key={status.docId} className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm" style={{ backgroundColor: status.color, color: '#fff' }}>
                  {status.label}
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
                <Button onClick={handleAddStatus} disabled={isSubmitting || !newStatusLabel.trim()}>
                  {isSubmitting ? 'Adding...' : 'Add Status'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>
            This is a placeholder for future settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Future features like user management roles and notification settings will be configured here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
