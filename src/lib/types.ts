
import { Timestamp } from "firebase/firestore";

export type User = {
  docId?: string;
  id: string;
  name: string;
  avatarUrl: string;
  email: string;
  role?: 'admin' | 'officer';
  about?: string;
  requiresPasswordChange?: boolean;
};

export type Report = {
  docId?: string;
  id: string; // Public tracking ID
  caseId: string; // Internal case ID
  title: string;
  content: string;
  category: string;
  submittedAt: Timestamp;
  status: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  assignees: User[] | null;
  submissionType: "anonymous" | "confidential";
  reporter?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

export type Message = {
  docId?: string;
  content: string;
  sentAt: Timestamp;
  sender: 'reporter' | 'officer';
  senderInfo?: {
    id: string;
    name: string;
    avatarUrl: string;
  };
}

export type Attachment = {
  docId?: string;
  url: string;
  fileName: string;
  fileType: string;
  uploadedAt: Timestamp;
  uploadedBy: {
    id: string;
    name: string;
  };
}

export type CaseStatus = {
    docId?: string;
    label: string;
    color: string;
    isDefault?: boolean;
}

export type AuditLog = {
    docId?: string;
    reportId: string;
    actor: {
        id: string;
        name: string;
    };
    action: string;
    timestamp: Timestamp;
}

export type Category = {
    docId?: string;
    label: string;
}

export type SharedReport = {
    docId?: string;
    id: string;
    reportId: string;
    expiresAt: Timestamp;
}

export type AppContent = {
    docId?: string;
    submissionGuidelines: string;
}
