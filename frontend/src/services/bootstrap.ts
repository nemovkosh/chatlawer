import { createChat } from "./api";
import type { CaseSummary, ChatSummary } from "../types";

export interface CaseWithChat {
  caseItem: CaseSummary;
  chat: ChatSummary;
}

export async function createCaseWithChat(
  userId: string,
  caseTitle: string,
  chatTitle: string,
): Promise<CaseWithChat> {
  const response = await fetch("/api/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, title: caseTitle }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create case: ${text}`);
  }
  const createdCase = (await response.json()) as CaseSummary;
  const createdChat = await createChat(createdCase.id, chatTitle);
  return { caseItem: createdCase, chat: createdChat };
}

