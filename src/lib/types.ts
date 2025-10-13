
import { Timestamp } from "firebase/firestore";

export type User = {
  docId?: string;
  id: string;
  name: string;
  avatarUrl: string;
  email: string;
  role?: 'admin' | 'officer';
  designation?: string;
  department?: string;
  requiresPasswordChange?: boolean;
};

export type Report = {
  docId?: string;
  id: string;
  title: string;
  content: string;
  category: string;
  submittedAt: Timestamp;
  status: string;
  severity: "Low" | "Medium" | "High";
  assignees: User[] | null;
  submissionType: "anonymous" | "confidential";
  reporter?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  aiSummary?: string;
  aiRiskAssessment?: string;
  aiSuggestedSteps?: string[];
  aiReasoning?: string;
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
  attachment?: {
    url: string;
    fileName: string;
    fileType: string;
  }
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

    