import type { User, Report } from "./types";

export const users: User[] = [
  { id: "user-1", name: "Alice Johnson", email: "alice@example.com", avatarUrl: "https://picsum.photos/seed/100/100/100", role: 'admin' },
  { id: "user-2", name: "Bob Williams", email: "bob@example.com", avatarUrl: "https://picsum.photos/seed/101/100/100", role: 'officer' },
  { id: "user-3", name: "Charlie Brown", email: "charlie@example.com", avatarUrl: "https://picsum.photos/seed/102/100/100", role: 'officer' },
  { id: "user-4", name: "Diana Prince", email: "diana@example.com", avatarUrl: "https://picsum.photos/seed/103/100/100", role: 'officer' },
];

export const reports: Report[] = [];
