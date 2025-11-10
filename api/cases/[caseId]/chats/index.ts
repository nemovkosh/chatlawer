import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

import { listChats, createChat } from "../../../lib/services/chatService";
import { sendError, sendJson, parseJson } from "../../../lib/http";

const createChatSchema = z.object({
  title: z.string().min(1),
});

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
      const chats = await listChats(caseId);
      sendJson(res, chats);
      return;
    }

    if (req.method === "POST") {
      const payload = createChatSchema.parse(await parseJson(req));
      const created = await createChat({ case_id: caseId, title: payload.title });
      sendJson(res, created, 201);
      return;
    }

    sendError(res, 405, "Method Not Allowed");
  } catch (error: unknown) {
    console.error(error);
    sendError(res, 500, (error as Error).message ?? "Internal Server Error");
  }
}

