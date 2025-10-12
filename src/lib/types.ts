import { Timestamp } from "firebase/firestore";

export type User = {
  docId?: string;
  id: string;
  name: string;
  avatarUrl: string;
  email: string;
  role?: 'admin' | 'officer';
};

export type Report = {
  docId?: string;
  id: string;
  title: string;
  content: string;
  category: "Financial" | "HR" | "Safety" | "Other";
  submittedAt: Timestamp;
  status: "New" | "In Progress" | "Resolved" | "Dismissed";
  severity: "Low" | "Medium" | "High";
  assignee: User | null;
  submissionType: "anonymous" | "confidential";
  reporter?: {
    name?: string;
    email?: string;
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
  fileUrl?: string;
}
