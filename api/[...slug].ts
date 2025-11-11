import type { VercelRequest, VercelResponse } from "@vercel/node";
import formidable from "formidable";
import { z } from "zod";

import { parseJson, sendError, sendJson } from "./lib/http";
import { createCase, deleteCase, getCase, listCases, updateCase } from "./lib/services/caseService";
import { createChat, deleteChat, getChat, listChats } from "./lib/services/chatService";
import { deleteDocument, listDocuments, storeDocument } from "./lib/services/documentService";
import { createMessage, getContextChunks, listMessages, streamAssistantReply } from "./lib/services/messageService";

const caseCreateSchema = z.object({
  user_id: z.string(),
  title: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

const caseUpdateSchema = z.object({
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const chatCreateSchema = z.object({
  title: z.string().min(1),
});

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]).default("user"),
  content: z.string().min(1),
});

async function parseForm(
  req: VercelRequest,
): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
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

function getSegments(req: VercelRequest): string[] {
  const slug = req.query.slug;
  if (Array.isArray(slug)) {
    return slug.filter(Boolean);
  }
  if (typeof slug === "string") {
    return slug.split("/").filter(Boolean);
  }

  const originalUrl = req.headers["x-vercel-original-url"];
  if (typeof originalUrl === "string") {
    return originalUrl.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  }

  const url = new URL(req.url ?? "", `https://${req.headers.host ?? "localhost"}`);
  return url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const segments = getSegments(req);

    if (segments.length === 0) {
      sendJson(res, { status: "ok" });
      return;
    }

    if (segments[0] === "cases" && segments.length === 1) {
      if (req.method === "GET") {
        const userParam = req.query.user_id;
        const userId = Array.isArray(userParam) ? userParam[0] : userParam;
        if (!userId) {
          sendError(res, 400, "user_id query parameter is required");
          return;
        }
        const cases = await listCases(userId);
        sendJson(res, cases);
        return;
      }

      if (req.method === "POST") {
        const payload = caseCreateSchema.parse(await parseJson(req));
        const created = await createCase({
          user_id: payload.user_id,
          title: payload.title,
          tags: payload.tags ?? [],
        });
        sendJson(res, created, 201);
        return;
      }
    }

    if (segments[0] === "cases" && segments.length >= 2) {
      const caseId = segments[1];
      if (!caseId) {
        sendError(res, 400, "Case ID is required");
        return;
      }

      if (segments.length === 2) {
        if (req.method === "GET") {
          const found = await getCase(caseId);
          if (!found) {
            sendError(res, 404, "Case not found");
            return;
          }
          sendJson(res, found);
          return;
        }

        if (req.method === "PATCH") {
          const payload = caseUpdateSchema.parse(await parseJson(req));
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
      }

      if (segments[2] === "chats") {
        if (segments.length === 3) {
          if (req.method === "GET") {
            const chats = await listChats(caseId);
            sendJson(res, chats);
            return;
          }
          if (req.method === "POST") {
            const payload = chatCreateSchema.parse(await parseJson(req));
            const created = await createChat({ case_id: caseId, title: payload.title });
            sendJson(res, created, 201);
            return;
          }
        }

        if (segments.length === 4 && req.method === "DELETE") {
          const chatId = segments[3];
          const existing = await getChat(chatId);
          if (!existing || existing.case_id !== caseId) {
            sendError(res, 404, "Chat not found");
            return;
          }
          await deleteChat(chatId);
          res.status(204).end();
          return;
        }
      }

      if (segments[2] === "documents") {
        if (segments.length === 3) {
          if (req.method === "GET") {
            const docs = await listDocuments(caseId);
            sendJson(res, docs);
            return;
          }
          if (req.method === "POST") {
            const { files } = await parseForm(req);
            const fileField = files.file;
            const file = Array.isArray(fileField) ? fileField[0] : (fileField as formidable.File | undefined);
            if (!file) {
              sendError(res, 400, "File field is required");
              return;
            }
            const created = await storeDocument({ caseId, file });
            sendJson(res, created, 201);
            return;
          }
        }

        if (segments.length === 4 && req.method === "DELETE") {
          const documentId = segments[3];
          await deleteDocument(documentId);
          res.status(204).end();
          return;
        }
      }
    }

    if (segments[0] === "chats" && segments.length >= 2) {
      const chatId = segments[1];
      if (!chatId) {
        sendError(res, 400, "Chat ID is required");
        return;
      }

      if (segments.length === 3 && segments[2] === "messages") {
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
      }

      if (segments.length === 4 && segments[2] === "messages" && segments[3] === "stream" && req.method === "POST") {
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
        return;
      }
    }

    sendError(res, 404, "Not Found");
  } catch (error: unknown) {
    console.error(error);
    if (!res.headersSent) {
      sendError(res, 500, (error as Error).message ?? "Internal Server Error");
    } else {
      res.end();
    }
  }
}

