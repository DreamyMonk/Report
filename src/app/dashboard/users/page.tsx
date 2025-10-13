
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirestore } from "@/firebase";
import { User } from "@/lib/types";
import { collection, query, onSnapshot } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical, PlusCircle, UserX, Edit } from "lucide-react";
import { InviteUserDialog } from "@/components/dashboard/invite-user-dialog";
import { useAuth } from "@/firebase/auth-provider";
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RemoveUserDialog } from "@/components/dashboard/remove-user-dialog";

export default function UsersPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useAuth();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);

  useEffect(() => {
    if (!usersQuery) return;
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ docId: doc.id, id: doc.data().id, ...doc.data() } as User));
        setUsers(usersData);
    }, (error) => {
        console.error("Error fetching users:", error);
        const permissionError = new FirestorePermissionError({ path: 'users', operation: 'list' });
        errorEmitter.emit('permission-error', permissionError);
    });
    return () => unsubscribe();
  }, [usersQuery]);

  const handleOpenDialog = (user: User | null, type: 'invite' | 'remove' | 'edit') => {
    setSelectedUser(user);
    if (type === 'invite' || type === 'edit') {
      setIsInviteDialogOpen(true);
    } else if (type === 'remove') {
      setIsRemoveDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-bold tracking-tight">User Management</h1>
        <Button onClick={() => handleOpenDialog(null, 'invite')}>
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
          {users?.map(user => {
            const isCurrentUser = currentUser?.uid === user.id;
            return (
              <Card key={user.docId} className="relative">
                  <CardContent className="p-4 flex items-center gap-4">
                      {isCurrentUser && <Badge variant="destructive" className="absolute -top-2 -right-2">Logged In</Badge>}
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
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenDialog(user, 'edit')}>
                                    <Edit className="mr-2"/>
                                    Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleOpenDialog(user, 'remove')} 
                                  disabled={isCurrentUser}
                                  className="text-destructive focus:text-destructive"
                                >
                                    <UserX className="mr-2"/>
                                    Remove User
                                </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </CardContent>
              </Card>
            )
          })}
        </CardContent>
      </Card>
      <InviteUserDialog 
        key={selectedUser?.docId || 'new'}
        open={isInviteDialogOpen} 
        onOpenChange={setIsInviteDialogOpen}
        userToEdit={selectedUser}
      />
      {selectedUser && (
         <RemoveUserDialog
            open={isRemoveDialogOpen}
            onOpenChange={setIsRemoveDialogOpen}
            user={selectedUser}
        />
      )}
    </div>
  )
}
