import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

import { deleteCase, getCase, updateCase } from "../../lib/services/caseService";
import { sendError, sendJson, parseJson } from "../../lib/http";

const updateCaseSchema = z.object({
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PATCH,DELETE,OPTIONS");
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
      const existing = await getCase(caseId);
      if (!existing) {
        sendError(res, 404, "Case not found");
        return;
      }
      sendJson(res, existing);
      return;
    }

    if (req.method === "PATCH") {
      const payload = updateCaseSchema.parse(await parseJson(req));
      const updated = await updateCase(caseId, payload);
      if (!updated) {
        sendError(res, 404, "Case not found");
        return;
      }
      sendJson(res, updated);
      return;
    }

    if (req.method === "DELETE") {
      await deleteCase(caseId);
      res.status(204).end();
      return;
    }

    sendError(res, 405, "Method Not Allowed");
  } catch (error: unknown) {
    console.error(error);
    sendError(res, 500, (error as Error).message ?? "Internal Server Error");
  }
}

