'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection } from "@/firebase";
import { User } from "@/lib/types";
import { collection, query } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function UsersPage() {
  const { data: users, firestore } = useCollection<User>(
    firestore ? query(collection(firestore, 'users')) : null
  );

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">User Management</h1>
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
                        <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <Badge variant="outline" className="capitalize mt-1">{user.role || 'User'}</Badge>
                    </div>
                </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
