import { createReadStream } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { createWorker } from "tesseract.js";

import type { File } from "formidable";

let ocrWorkerPromise: ReturnType<typeof createWorker> | null = null;

async function ensureOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = createWorker("rus+eng");
  }
  return ocrWorkerPromise;
}

async function extractPdf(buffer: Buffer) {
  const data = await pdfParse(buffer);
  return data.text ?? "";
}

async function extractDocx(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

async function extractImage(file: File) {
  const worker = await ensureOcrWorker();
  const { data } = await worker.recognize(file.filepath);
  return data.text ?? "";
}

function isPdf(mime: string | undefined, filename: string) {
  return mime === "application/pdf" || filename.toLowerCase().endsWith(".pdf");
}

function isDocx(mime: string | undefined, filename: string) {
  return (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename.toLowerCase().endsWith(".docx")
  );
}

function isDoc(mime: string | undefined, filename: string) {
  return mime === "application/msword" || filename.toLowerCase().endsWith(".doc");
}

function isImage(mime: string | undefined, filename: string) {
  const lower = filename.toLowerCase();
  return (
    (mime && mime.startsWith("image/")) ||
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".tif") ||
    lower.endsWith(".tiff") ||
    lower.endsWith(".bmp")
  );
}

export async function extractTextFromFile(file: File): Promise<string | null> {
  const buffer = await fileToBuffer(file);
  const mime = file.mimetype ?? undefined;
  const name = file.originalFilename ?? file.newFilename ?? "upload";

  if (isPdf(mime, name)) {
    return extractPdf(buffer);
  }
  if (isDocx(mime, name)) {
    return extractDocx(buffer);
  }
  if (isDoc(mime, name)) {
    return buffer.toString("utf-8");
  }
  if (isImage(mime, name)) {
    return extractImage(file);
  }
  if (mime?.startsWith("text/") || name.toLowerCase().endsWith(".txt")) {
    return buffer.toString("utf-8");
  }
  return null;
}

export async function fileToBuffer(file: File): Promise<Buffer> {
  const stream = createReadStream(file.filepath);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function destroyTempFile(file: File) {
  try {
    await rm(file.filepath, { force: true });
  } catch {
    // ignore
  }
}

export function tempFilePath(filename: string) {
  const id = randomUUID();
  return join(tmpdir(), `${id}-${filename}`);
}

