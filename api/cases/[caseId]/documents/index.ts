import type { VercelRequest, VercelResponse } from "@vercel/node";
import formidable from "formidable";

import { listDocuments, storeDocument } from "../../../lib/services/documentService";
import { sendError, sendJson } from "../../../lib/http";

async function parseFormData(req: VercelRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const form = formidable({ multiples: false, keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err: Error | null, fields: formidable.Fields, files: formidable.Files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const caseIdParam = req.query.caseId;
  const caseId = Array.isArray(caseIdParam) ? caseIdParam[0] : caseIdParam;
  if (!caseId) {
    sendError(res, 400, "caseId parameter is required");
    return;
  }

  try {
    if (req.method === "GET") {
      const docs = await listDocuments(caseId);
      sendJson(res, docs);
      return;
    }

    if (req.method === "POST") {
      const { files } = await parseFormData(req);
      const fileField = files.file;
      const file = Array.isArray(fileField) ? fileField[0] : (fileField as formidable.File | undefined);
      if (!file) {
        sendError(res, 400, "File field is required");
        return;
      }
      const document = await storeDocument({ caseId, file });
      sendJson(res, document, 201);
      return;
    }

    sendError(res, 405, "Method Not Allowed");
  } catch (error: unknown) {
    console.error(error);
    sendError(res, 500, (error as Error).message ?? "Internal Server Error");
  }
}

