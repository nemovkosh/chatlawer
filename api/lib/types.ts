export interface Case {
  id: string;
  user_id: string;
  title: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  case_id: string;
  file_name: string;
  file_url: string;
  content: string | null;
  created_at: string;
}

export interface Chat {
  id: string;
  case_id: string;
  title: string;
  created_at: string;
}

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  chat_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface DocumentEmbedding {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  embedding: number[];
  created_at: string;
}

export interface TablesInsert {
  cases: {
    id?: string;
    user_id: string;
    title: string;
    tags?: string[] | null;
  };
  documents: {
    id?: string;
    case_id: string;
    file_name: string;
    file_url: string;
    content?: string | null;
  };
  chats: {
    id?: string;
    case_id: string;
    title: string;
  };
  messages: {
    id?: string;
    chat_id: string;
    role: MessageRole;
    content: string;
  };
  document_embeddings: {
    id?: string;
    document_id: string;
    chunk_index: number;
    content: string;
    embedding: number[];
  };
}

