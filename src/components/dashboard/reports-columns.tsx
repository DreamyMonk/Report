
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Report, CaseStatus, User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { ReportTableActions } from "./reports-table-actions";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

export const getColumns = (statuses: CaseStatus[]): ColumnDef<Report>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title
        <CaretSortIcon className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => {
      const severity = row.getValue("severity") as string;
      const variant: "destructive" | "secondary" | "default" = 
        severity === "High" ? "destructive" : severity === "Medium" ? "secondary" : "default";
      const Icon = severity === "High" ? ShieldAlert : severity === "Medium" ? Shield : ShieldCheck;
      
      return <Badge variant={variant} className="capitalize gap-1.5"><Icon className="h-3 w-3" />{severity}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const statusLabel = row.getValue("status") as string;
      const status = statuses.find(s => s.label === statusLabel);
      if (status) {
         return <div className="capitalize rounded-full px-2 py-0.5 text-xs font-medium text-white text-center" style={{ backgroundColor: status.color }}>{statusLabel}</div>;
      }
      return <div className="capitalize">{statusLabel}</div>;
    },
  },
  {
    accessorKey: "assignees",
    header: "Assignees",
    cell: ({ row }) => {
      const assignees = row.getValue("assignees") as User[] | null;
      if (!assignees || assignees.length === 0) {
        return <span className="text-muted-foreground">Unassigned</span>;
      }
      return (
        <div className="flex -space-x-2">
            {assignees.map((assignee) => (
                <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                    <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                </Avatar>
            ))}
        </div>
      );
    },
  },
  {
    accessorKey: "submittedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Submitted
        <CaretSortIcon className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("submittedAt") as any;
      if (!date) return 'N/A';
      return <div>{format(date.toDate(), "MMM d, yyyy")}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ReportTableActions report={row.original} />,
  },
];
