import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

import { createMessage, listMessages } from "../../../lib/services/messageService";
import { sendError, sendJson, parseJson } from "../../../lib/http";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]).default("user"),
  content: z.string().min(1),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const chatIdParam = req.query.chatId;
  const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;
  if (!chatId) {
    sendError(res, 400, "chatId parameter is required");
    return;
  }

  try {
    if (req.method === "GET") {
      const messages = await listMessages(chatId);
      sendJson(res, messages);
      return;
    }

    if (req.method === "POST") {
      const payload = messageSchema.parse(await parseJson(req));
      const created = await createMessage({
        chatId,
        role: payload.role,
        content: payload.content,
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

