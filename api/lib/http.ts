import type { VercelRequest, VercelResponse } from "@vercel/node";

export async function parseJson<T>(req: VercelRequest): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf-8") || "{}";
  return JSON.parse(raw) as T;
}

export function sendJson(res: VercelResponse, payload: unknown, status = 200) {
  res.status(status).setHeader("Content-Type", "application/json").send(JSON.stringify(payload));
}

export function sendError(res: VercelResponse, status: number, message: string) {
  sendJson(res, { error: message }, status);
}

