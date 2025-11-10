import { randomUUID } from "node:crypto";
import type { File } from "formidable";

import { settings } from "../config.js";
import { supabaseAdmin } from "../supabase.js";
import type { Document, TablesInsert } from "../types/supabase.js";
import { destroyTempFile, extractTextFromFile, fileToBuffer } from "./documentExtraction.js";
import { upsertEmbeddings } from "./embeddingService.js";

export async function listDocuments(caseId: string): Promise<Document[]> {
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data as Document[];
}

export async function saveDocumentMetadata(payload: TablesInsert["documents"]): Promise<Document> {
  const { data, error } = await supabaseAdmin.from("documents").insert(payload).select().single();
  if (error) {
    throw error;
  }
  return data as Document;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await supabaseAdmin.from("document_embeddings").delete().eq("document_id", documentId);
  const { error } = await supabaseAdmin.from("documents").delete().eq("id", documentId);
  if (error) {
    throw error;
  }
}

export async function storeDocument({
  caseId,
  file,
}: {
  caseId: string;
  file: File;
}): Promise<Document> {
  try {
    const buffer = await fileToBuffer(file);
    const textContent = await extractTextFromFile(file);
    const objectKey = `${caseId}/${randomUUID()}-${file.originalFilename ?? file.newFilename}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(settings.SUPABASE_STORAGE_BUCKET)
      .upload(objectKey, buffer, {
        upsert: false,
        contentType: file.mimetype ?? "application/octet-stream",
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
      .from(settings.SUPABASE_STORAGE_BUCKET)
      .createSignedUrl(objectKey, 60 * 60 * 24 * 7); // 7 days

    if (urlError) {
      throw urlError;
    }

    const document = await saveDocumentMetadata({
      case_id: caseId,
      file_name: file.originalFilename ?? file.newFilename ?? "document",
      file_url: signedUrlData.signedUrl,
      content: textContent,
    });

    if (textContent) {
      await upsertEmbeddings({ documentId: document.id, text: textContent });
    }

    return document;
  } finally {
    await destroyTempFile(file);
  }
}

