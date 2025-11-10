import type { Message, MessageRole } from "../types";
import { settings } from "../config";
import { openaiClient } from "../openai";
import { supabaseAdmin } from "../supabase";

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
  const { data, error } = await supabaseAdmin.from("documents").select("id").eq("case_id", caseId);
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

function isImageFile(filename: string) {
  const lower = filename.toLowerCase();
  return (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".bmp") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".tiff")
  );
}

async function getImageAttachments(caseId: string): Promise<Array<{ url: string; fileName: string }>> {
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("file_name, file_url")
    .eq("case_id", caseId);
  if (error) {
    throw error;
  }
  return (data ?? [])
    .filter((doc) => doc.file_url && doc.file_name && isImageFile(doc.file_name))
    .map((doc) => ({
      url: doc.file_url as string,
      fileName: doc.file_name as string,
    }));
}

export async function* streamAssistantReply({
  caseId,
  chatHistory,
  contextualChunks,
}: {
  caseId: string;
  chatHistory: { role: MessageRole; content: string }[];
  contextualChunks: string[];
}): AsyncGenerator<string, void, unknown> {
  const messages: Array<{ role: string; content: unknown }> = [
    {
      role: "system",
      content: [{ type: "text", text: settings.SYSTEM_PROMPT }],
    },
  ];

  if (contextualChunks.length) {
    messages.push({
      role: "system",
      content: [
        {
          type: "text",
          text: `Релевантные материалы дела:\n${contextualChunks.join("\n---\n")}`,
        },
      ],
    });
  }

  const imageAttachments = await getImageAttachments(caseId);
  if (imageAttachments.length) {
    messages.push({
      role: "system",
      content: [
        {
          type: "text",
          text: "Визуальные материалы дела. Проанализируй изображения при формировании ответа.",
        },
        ...imageAttachments.map((attachment) => ({
          type: "image_url" as const,
          image_url: { url: attachment.url },
        })),
      ],
    });
  }

  messages.push(
    ...chatHistory.map((msg) => ({
      role: msg.role,
      content: [{ type: "text", text: msg.content }],
    })),
  );

  const stream = await openaiClient.chat.completions.create({
    model: settings.OPENAI_MODEL,
    stream: true,
    messages: messages as any,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      yield delta;
    }
  }
}

