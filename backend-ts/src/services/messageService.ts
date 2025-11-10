import type { Message, MessageRole } from "../types/supabase.js";
import { settings } from "../config.js";
import { openaiClient } from "../openai.js";
import { supabaseAdmin } from "../supabase.js";

export async function listMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  if (error) {
    throw error;
  }
  return data as Message[];
}

export async function createMessage({
  chatId,
  role,
  content,
}: {
  chatId: string;
  role: MessageRole;
  content: string;
}): Promise<Message> {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({ chat_id: chatId, role, content })
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data as Message;
}

export async function getContextChunks(caseId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("id")
    .eq("case_id", caseId);
  if (error) {
    throw error;
  }
  const documentIds = (data ?? []).map((doc) => doc.id);
  if (!documentIds.length) {
    return [];
  }
  const { data: chunks, error: chunksError } = await supabaseAdmin
    .from("document_embeddings")
    .select("content, chunk_index")
    .in("document_id", documentIds)
    .order("chunk_index", { ascending: true })
    .limit(settings.MAX_CONTEXT_CHUNKS);
  if (chunksError) {
    throw chunksError;
  }
  return (chunks ?? []).map((item) => item.content);
}

export async function* streamAssistantReply({
  chatHistory,
  contextualChunks,
}: {
  chatHistory: { role: MessageRole; content: string }[];
  contextualChunks: string[];
}): AsyncGenerator<string, void, unknown> {
  const messages: { role: MessageRole | "system"; content: string }[] = [
    { role: "system", content: settings.SYSTEM_PROMPT },
  ];
  if (contextualChunks.length) {
    messages.push({
      role: "system",
      content: `Релевантные материалы дела:\n${contextualChunks.join("\n---\n")}`,
    });
  }
  messages.push(...chatHistory);

  const stream = await openaiClient.chat.completions.create({
    model: settings.OPENAI_MODEL,
    stream: true,
    messages,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      yield delta;
    }
  }
}

