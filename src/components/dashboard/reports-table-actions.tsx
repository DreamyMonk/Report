
"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Report } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";
import { AssignCaseDialog } from "./assign-case-dialog";
import { DeleteReportDialog } from "./delete-report-dialog";
import { useAuth } from "@/firebase/auth-provider";

export function ReportTableActions({ report }: { report: Report }) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assignMode, setAssignMode] = useState<'assign' | 'transfer' | 'add'>('assign');
  const { userData } = useAuth();

  const openDialog = (mode: 'assign' | 'transfer' | 'add') => {
    setAssignMode(mode);
    setIsAssignDialogOpen(true);
  }
  
  const hasAssignees = report.assignees && report.assignees.length > 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/reports/${report.docId}`}>View Details</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {hasAssignees ? (
            <>
              <DropdownMenuItem onClick={() => openDialog('transfer')}>Transfer Case</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDialog('add')}>Add Assignee</DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={() => openDialog('assign')}>Assign Case</DropdownMenuItem>
          )}
          {userData?.role === 'admin' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete Case
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AssignCaseDialog 
        open={isAssignDialogOpen} 
        onOpenChange={setIsAssignDialogOpen} 
        report={report}
        mode={assignMode}
      />
      <DeleteReportDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen} 
        report={report}
      />
    </>
  );
}
