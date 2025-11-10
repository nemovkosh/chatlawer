export type CaseTag = "Civil" | "Corporate" | "Criminal" | "Family" | "Immigration" | string;

export interface CaseSummary {
  id: string;
  title: string;
  tags: CaseTag[];
  created_at: string;
  updated_at: string;
}

export interface DocumentSummary {
  id: string;
  case_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

export interface ChatSummary {
  id: string;
  case_id: string;
  title: string;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface CreateMessageInput {
  role: "user";
  content: string;
}

