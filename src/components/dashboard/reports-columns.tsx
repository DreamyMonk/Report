"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Report, CaseStatus } from "@/lib/types";
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
    accessorKey: "assignee",
    header: "Assignee",
    cell: ({ row }) => {
      const assignee = row.getValue("assignee") as Report["assignee"];
      if (!assignee) {
        return <span className="text-muted-foreground">Unassigned</span>;
      }
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
            <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{assignee.name}</span>
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
