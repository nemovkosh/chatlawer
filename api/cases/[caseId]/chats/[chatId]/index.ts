import type { VercelRequest, VercelResponse } from "@vercel/node";

import { deleteChat, getChat } from "../../../../lib/services/chatService";
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

  const caseIdParam = req.query.caseId;
  const chatIdParam = req.query.chatId;
  const caseId = Array.isArray(caseIdParam) ? caseIdParam[0] : caseIdParam;
  const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;

  if (!caseId || !chatId) {
    sendError(res, 400, "caseId and chatId parameters are required");
    return;
  }

  try {
    const existing = await getChat(chatId);
    if (!existing || existing.case_id !== caseId) {
      sendError(res, 404, "Chat not found");
      return;
    }
    await deleteChat(chatId);
    res.status(204).end();
  } catch (error: unknown) {
    console.error(error);
    sendError(res, 500, (error as Error).message ?? "Internal Server Error");
  }
}

