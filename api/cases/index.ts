import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

import { createCase, listCases } from "../lib/services/caseService";
import { sendError, sendJson, parseJson } from "../lib/http";

const createCaseSchema = z.object({
  user_id: z.string(),
  title: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === "GET") {
      const userIdParam = req.query.user_id;
      const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
      if (!userId) {
        sendError(res, 400, "user_id query parameter is required");
        return;
      }
      const cases = await listCases(userId);
      sendJson(res, cases);
      return;
    }

    if (req.method === "POST") {
      const payload = createCaseSchema.parse(await parseJson(req));
      const created = await createCase({
        user_id: payload.user_id,
        title: payload.title,
        tags: payload.tags ?? [],
      });
      sendJson(res, created, 201);
      return;
    }

    sendError(res, 405, "Method Not Allowed");
  } catch (error: unknown) {
    console.error(error);
    sendError(res, 500, (error as Error).message ?? "Internal Server Error");
  }
}

