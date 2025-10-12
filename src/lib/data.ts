import type { User, Report } from "./types";

export const users: User[] = [
  { id: "user-1", name: "Alice Johnson", email: "alice@example.com", avatarUrl: "https://picsum.photos/seed/100/100/100" },
  { id: "user-2", name: "Bob Williams", email: "bob@example.com", avatarUrl: "https://picsum.photos/seed/101/100/100" },
  { id: "user-3", name: "Charlie Brown", email: "charlie@example.com", avatarUrl: "https://picsum.photos/seed/102/100/100" },
  { id: "user-4", name: "Diana Prince", email: "diana@example.com", avatarUrl: "https://picsum.photos/seed/103/100/100" },
];

export const reports: Report[] = [
  {
    id: "IB-K5A8-9G3H1J",
    title: "Suspicious Financial Transactions in Q3",
    content: "I have noticed several large, undocumented transactions from the marketing department's budget to a vendor I've never heard of. The amounts are just under the threshold that requires director approval. This has been happening for the past three months and I'm concerned it could be a form of embezzlement.",
    category: "Financial",
    submittedAt: "2024-07-20T10:30:00Z",
    status: "New",
    severity: "High",
    assignee: null,
    submissionType: "confidential",
    reporter: {
      name: "A Concerned Employee",
      email: "confidential.reporter@example.com",
    },
    aiSummary: "The report details potentially fraudulent financial activities, specifically large, recurring, undocumented transactions from the marketing budget to an unknown vendor, suggesting possible embezzlement.",
    aiRiskAssessment: "High risk due to potential financial loss, legal implications, and reputational damage. Immediate investigation is required.",
    aiSuggestedSteps: [
      "Secure all financial records for the marketing department for Q3.",
      "Identify the unknown vendor and its relationship with company employees.",
      "Interview the marketing department head and financial controller.",
      "Conduct a forensic audit of the transactions in question."
    ],
    aiReasoning: "The pattern of transactions just below approval thresholds is a classic red flag for financial fraud. The potential for significant financial loss and legal exposure justifies the high severity and immediate, structured investigation."
  },
  {
    id: "IB-L9B1-4K2P5N",
    title: "Workplace Harassment by a Team Lead",
    content: "A team lead in the engineering department has been consistently making inappropriate comments and creating a hostile work environment for several junior female employees. Multiple people have mentioned feeling uncomfortable but are afraid to speak up for fear of retaliation.",
    category: "HR",
    submittedAt: "2024-07-19T15:00:00Z",
    status: "In Progress",
    severity: "Medium",
    assignee: users[0],
    submissionType: "anonymous",
    aiSummary: "An anonymous report alleges workplace harassment by an engineering team lead, creating a hostile environment for junior female employees who fear retaliation.",
    aiRiskAssessment: "Medium to High risk. This poses a significant legal and reputational risk, can harm employee morale and productivity, and could lead to high turnover.",
    aiSuggestedSteps: [
      "Conduct confidential interviews with the team members mentioned or in the same team.",
      "Review the team lead's performance history and any prior complaints.",
      "Consult with legal counsel on HR investigation protocols.",
      "Reinforce anti-harassment policies with all employees."
    ],
    aiReasoning: "Harassment claims are serious and require a delicate but firm response. The 'Medium' severity reflects the personnel-focused nature, but it could escalate to 'High' if ignored. The steps focus on gathering information discreetly while protecting the reporter and potential victims."
  },
  {
    id: "IB-M2C4-7R8S9T",
    title: "Safety Violations in the Warehouse",
    content: "Forklift operators are not consistently using safety harnesses, and emergency exits are frequently blocked by pallets. There was a near-miss accident last week that went unreported. Management seems to be ignoring these issues despite verbal complaints.",
    category: "Safety",
    submittedAt: "2024-07-18T09:00:00Z",
    status: "Resolved",
    severity: "High",
    assignee: users[1],
    submissionType: 'confidential',
    reporter: {
        name: 'Warehouse Worker',
        email: 'safety.first@example.com'
    },
    aiSummary: "The report highlights critical safety violations in the warehouse, including improper use of equipment and blocked emergency exits, along with a recent unreported near-miss accident.",
    aiRiskAssessment: "High risk due to the immediate threat of physical injury or death to employees. This could lead to severe legal penalties and operational shutdowns.",
    aiSuggestedSteps: [
      "Immediately conduct an unannounced safety inspection of the warehouse.",
      "Clear all blocked emergency exits and ensure they remain clear.",
      "Halt forklift operations until all operators are retrained on safety procedures.",
      "Interview warehouse staff about the unreported near-miss."
    ],
    aiReasoning: "The potential for serious injury or fatality makes this a high-priority issue. The suggested steps are designed to mitigate immediate risk first, followed by investigation and corrective action."
  },
  {
    id: "IB-N5D6-1V2W3X",
    title: "Office supplies are constantly missing",
    content: "The supply closet seems to be running out of pens and notepads much faster than usual. I think someone might be taking them home for personal use. It's not a huge deal but it's getting annoying.",
    category: "Other",
    submittedAt: "2024-07-17T11:45:00Z",
    status: "Dismissed",
    severity: "Low",
    assignee: users[2],
    submissionType: "anonymous",
    aiSummary: "An anonymous report notes that office supplies like pens and notepads are disappearing at an unusually high rate, suggesting minor theft for personal use.",
    aiRiskAssessment: "Low risk. The financial impact is minimal, and it does not pose a legal or safety threat. It is primarily an issue of workplace etiquette and minor policy violation.",
aiSuggestedSteps: [
      "Monitor supply closet inventory for a few weeks to confirm the high usage rate.",
      "Send a general reminder to all staff about company policy on office supplies.",
      "Consider implementing a sign-out sheet if the problem persists."
    ],
    aiReasoning: "This issue is minor. The low severity reflects the low impact on the business. The suggested steps are low-effort and aim to address the issue without creating a major incident."
  },
   {
    id: "IB-P8E9-3Y4Z5A",
    title: "Project Data Falsification",
    content: "I have reason to believe that the progress metrics for 'Project Titan' are being intentionally inflated to meet deadlines. The reported completion rates do not match the actual work that has been done. This could lead to major problems with the client when the final product is delivered.",
    category: "Financial",
    submittedAt: "2024-07-21T14:00:00Z",
    status: "New",
    severity: "High",
    assignee: null,
    submissionType: "anonymous",
    aiSummary: "Anonymous report alleging intentional falsification of progress metrics for a key client project ('Project Titan'). The reporter warns of future client-side issues upon delivery.",
    aiRiskAssessment: "High risk. Falsifying data for a client can lead to breach of contract, significant financial penalties, loss of the client, and severe reputational damage.",
    aiSuggestedSteps: [
      "Discreetly pull the project's source code repository and commit history.",
      "Compare reported metrics against tangible evidence of progress (e.g., completed features, code commits).",
      "Assemble an independent technical expert to conduct a confidential audit of the project status.",
      "Prepare a communication plan for the client if the allegations are confirmed."
    ],
    aiReasoning: "Client trust and contractual obligations are at stake. A high severity is warranted. The investigation must be swift, technical, and discreet to verify the claims before the project delivery date."
  },
];
