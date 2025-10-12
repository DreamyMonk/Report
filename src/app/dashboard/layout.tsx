
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/icons/logo";
import { Home, FileText, Settings, Search, Users, History } from "lucide-react";
import { UserNav } from "@/components/layout/user-nav";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { FirebaseErrorListener } from "@/components/firebase-error-listener";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Logo className="h-6 w-6 text-primary" />
              <span className="font-headline text-lg font-bold text-primary break-words">Whistleblower</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard">
                    <Home />
                    <span className="break-words">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/reports">
                    <FileText />
                    <span className="break-words">All Reports</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/users">
                    <Users />
                    <span className="break-words">Users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/audit-log">
                    <History />
                    <span className="break-words">Audit Log</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/settings">
                    <Settings />
                    <span className="break-words">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <div className={cn(
          "flex flex-1 flex-col transition-[margin-left] duration-200 ease-linear md:ml-[--sidebar-width]",
          "group-data-[[data-state=collapsed][data-collapsible=icon]]/sidebar-wrapper:md:ml-[--sidebar-width-icon]"
        )}>
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-2">
               <SidebarTrigger className="md:hidden" />
               <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search reports..." className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px]" />
               </div>
            </div>
            <UserNav />
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
      <FirebaseErrorListener />
    </SidebarProvider>
  );
}
