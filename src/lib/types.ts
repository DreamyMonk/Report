export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  email: string;
};

export type Report = {
  id: string;
  title: string;
  content: string;
  category: "Financial" | "HR" | "Safety" | "Other";
  submittedAt: string;
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
