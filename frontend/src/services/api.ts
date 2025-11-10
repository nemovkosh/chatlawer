import type {
  CaseSummary,
  ChatSummary,
  CreateMessageInput,
  DocumentSummary,
  Message,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error (${response.status}): ${text}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchCases(userId: string) {
  return request<CaseSummary[]>(`${API_BASE_URL}/cases?user_id=${userId}`);
}

export async function fetchChats(caseId: string) {
  return request<ChatSummary[]>(`${API_BASE_URL}/cases/${caseId}/chats`);
}

export async function createChat(caseId: string, title: string) {
  return request<ChatSummary>(`${API_BASE_URL}/cases/${caseId}/chats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
}

export async function fetchDocuments(caseId: string) {
  return request<DocumentSummary[]>(`${API_BASE_URL}/cases/${caseId}/documents`);
}

export async function fetchMessages(chatId: string) {
  return request<Message[]>(`${API_BASE_URL}/chats/${chatId}/messages`);
}

export async function createMessage(chatId: string, payload: CreateMessageInput) {
  return request<Message>(`${API_BASE_URL}/chats/${chatId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function streamAssistantMessage(chatId: string, payload: CreateMessageInput, onToken: (token: string) => void) {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to stream response: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onToken(decoder.decode(value));
  }
}

