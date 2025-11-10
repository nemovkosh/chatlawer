import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

import { getChat } from "../../../lib/services/chatService";
import { createMessage, getContextChunks, listMessages, streamAssistantReply } from "../../../lib/services/messageService";
import { sendError, parseJson } from "../../../lib/http";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]).default("user"),
  content: z.string().min(1),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    sendError(res, 405, "Method Not Allowed");
    return;
  }

  const chatIdParam = req.query.chatId;
  const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;
  if (!chatId) {
    sendError(res, 400, "chatId parameter is required");
    return;
  }

  try {
    const payload = messageSchema.parse(await parseJson(req));
    const chat = await getChat(chatId);
    if (!chat) {
      sendError(res, 404, "Chat not found");
      return;
    }

    const history = await listMessages(chatId);
    const combinedHistory = [...history, { role: payload.role, content: payload.content }].map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
    const contextChunks = await getContextChunks(chat.case_id);

    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    let assistantBuffer = "";
    try {
      for await (const token of streamAssistantReply({
        caseId: chat.case_id,
        chatHistory: combinedHistory,
        contextualChunks: contextChunks,
      })) {
        res.write(token);
        assistantBuffer += token;
      }
      if (assistantBuffer.trim()) {
        await createMessage({
          chatId,
          role: "assistant",
          content: assistantBuffer,
        });
      }
    } finally {
      res.end();
    }
  } catch (error: unknown) {
    console.error(error);
    if (!res.headersSent) {
      sendError(res, 500, (error as Error).message ?? "Internal Server Error");
    } else {
      res.end();
    }
  }
}

