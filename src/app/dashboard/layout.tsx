
'use client';
import { Logo } from "@/components/icons/logo";
import { UserNav } from "@/components/layout/user-nav";
import { Input } from "@/components/ui/input";
import { FirebaseErrorListener } from "@/components/firebase-error-listener";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Home,
  FileText,
  Settings,
  Search,
  Users,
  History,
  ChevronLeft,
  Archive,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/firebase/auth-provider";
import { ForcePasswordChangeDialog } from "@/components/dashboard/force-password-change-dialog";

const navItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/dashboard/reports", icon: FileText, label: "All Reports" },
    { href: "/dashboard/users", icon: Users, label: "Users" },
    { href: "/dashboard/audit-log", icon: History, label: "Audit Log" },
    { href: "/dashboard/archive", icon: Archive, label: "Archive" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const { userData, user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (userData?.requiresPasswordChange) {
      setIsPasswordDialogOpen(true);
    }
  }, [userData]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const visibleNavItems = navItems.filter(item => {
    if ((item.href === '/dashboard/archive' || item.href === '/dashboard/audit-log') && userData?.role !== 'admin') {
      return false;
    }
    return true;
  });

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-10 hidden h-full flex-col border-r bg-card transition-all duration-300 ease-in-out md:flex",
            isCollapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex h-16 items-center border-b px-4 lg:px-6 shrink-0">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <Logo className="h-6 w-6" />
              <span
                className={cn(
                  "transition-opacity whitespace-nowrap",
                  isCollapsed ? "opacity-0 w-0" : "opacity-100"
                )}
              >
                Whistleblower
              </span>
            </Link>
          </div>
          <nav className="flex-1 space-y-2 p-2 lg:p-4">
            {visibleNavItems.map((item) => (
              <Tooltip key={item.label} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground",
                      pathname === item.href &&
                        "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span
                      className={cn(
                        "transition-opacity break-words",
                        isCollapsed ? "sr-only" : ""
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </nav>
          <div className="mt-auto p-4">
             <Button
                variant="outline"
                size="icon"
                className={cn(
                  "absolute -right-5 top-14 hidden rounded-full md:flex",
                   isCollapsed && "rotate-180"
                )}
                onClick={toggleSidebar}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
          </div>
        </aside>
        <div
          className={cn(
            "flex flex-1 flex-col transition-all duration-300 ease-in-out",
            isCollapsed ? "md:ml-16" : "md:ml-64"
          )}
        >
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
            <div className="flex items-center gap-4 md:ml-auto">
              <UserNav />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
      <FirebaseErrorListener />
      {user && (
        <ForcePasswordChangeDialog 
            open={isPasswordDialogOpen}
            onOpenChange={setIsPasswordDialogOpen}
            uid={user.uid}
        />
      )}
    </TooltipProvider>
  );
}
