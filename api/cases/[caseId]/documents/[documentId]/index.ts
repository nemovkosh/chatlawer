import type { VercelRequest, VercelResponse } from "@vercel/node";

import { deleteDocument } from "../../../../lib/services/documentService";
import { sendError } from "../../../../lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "DELETE") {
    sendError(res, 405, "Method Not Allowed");
    return;
  }

  const docIdParam = req.query.documentId;
  const documentId = Array.isArray(docIdParam) ? docIdParam[0] : docIdParam;

  if (!documentId) {
    sendError(res, 400, "documentId parameter is required");
    return;
  }

  try {
    await deleteDocument(documentId);
    res.status(204).end();
  } catch (error: unknown) {
    console.error(error);
    sendError(res, 500, (error as Error).message ?? "Internal Server Error");
  }
}

