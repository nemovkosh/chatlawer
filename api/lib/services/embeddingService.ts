import type { TablesInsert } from "../types";
import { settings } from "../config";
import { openaiClient } from "../openai";
import { supabaseAdmin } from "../supabase";

function chunkText(text: string): string[] {
  const { CHUNK_SIZE, CHUNK_OVERLAP } = settings;
  if (!text) {
    return [];
  }
  const normalized = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);
    chunks.push(normalized.slice(start, end));
    if (end >= normalized.length) {
      break;
    }
    start = Math.max(0, end - CHUNK_OVERLAP);
  }
  return chunks;
}

export async function upsertEmbeddings({
  documentId,
  text,
}: {
  documentId: string;
  text: string;
}) {
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    return;
  }

  await supabaseAdmin.from("document_embeddings").delete().eq("document_id", documentId);

  const response = await openaiClient.embeddings.create({
    model: settings.OPENAI_EMBEDDINGS_MODEL,
    input: chunks,
  });

  const payload: TablesInsert["document_embeddings"][] = response.data.map((item, index) => ({
    document_id: documentId,
    chunk_index: index,
    content: chunks[index],
    embedding: item.embedding,
  }));

  if (payload.length) {
    await supabaseAdmin.from("document_embeddings").insert(payload);
  }
}

