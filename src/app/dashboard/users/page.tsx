
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirestore } from "@/firebase";
import { User } from "@/lib/types";
import { collection, query } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { InviteUserDialog } from "@/components/dashboard/invite-user-dialog";

export default function UsersPage() {
  const firestore = useFirestore();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);
  const { data: users } = useCollection<User>(usersQuery);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-bold tracking-tight">User Management</h1>
        <Button onClick={() => setIsInviteDialogOpen(true)}>
          <PlusCircle className="mr-2" />
          Add User
        </Button>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Case Officers & Admins</CardTitle>
          <CardDescription>Manage users who can investigate and manage reports.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users?.map(user => (
            <Card key={user.docId}>
                <CardContent className="p-4 flex items-center gap-4">
                     <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex gap-2 items-center">
                            <Badge variant="outline" className="capitalize">{user.role || 'User'}</Badge>
                        </div>
                        {user.designation && <p className="text-xs text-muted-foreground">{user.designation}, {user.department}</p>}
                    </div>
                </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
      <InviteUserDialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen} />
    </div>
  )
}
