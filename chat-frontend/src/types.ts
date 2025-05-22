// types.ts
export interface Message {
  id: string;
  sessionId: string;
  sender: string;
  content: string;
  timestamp: string;
}
export interface Session {
  id: string;
  userName: string | null;
  createdAt: string;
  closedAt: string | null;
  messages: Message[];
}