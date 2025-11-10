import type { VercelRequest, VercelResponse } from "@vercel/node";
import formidable from "formidable";
import { z } from "zod";

import {
  createCase,
  deleteCase,
  getCase,
  listCases,
  updateCase,
} from "../backend-ts/src/services/caseService.js";
import {
  createChat,
  deleteChat,
  getChat,
  listChats,
} from "../backend-ts/src/services/chatService.js";
import {
  deleteDocument,
  listDocuments,
  storeDocument,
} from "../backend-ts/src/services/documentService.js";
import {
  createMessage,
  getContextChunks,
  listMessages,
  streamAssistantReply,
} from "../backend-ts/src/services/messageService.js";

const caseCreateSchema = z.object({
  title: z.string().min(1),
  tags: z.array(z.string()).optional(),
  user_id: z.string(),
});

const caseUpdateSchema = z.object({
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const chatCreateSchema = z.object({
  title: z.string().min(1),
});

const messageCreateSchema = z.object({
  role: z.enum(["user", "assistant", "system"]).default("user"),
  content: z.string().min(1),
});

function sendJson(res: VercelResponse, payload: unknown, status = 200) {
  res.status(status).setHeader("Content-Type", "application/json").send(JSON.stringify(payload));
}

async function parseJson<T>(req: VercelRequest): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf-8") || "{}";
  return JSON.parse(raw) as T;
}

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

function getPathSegments(pathname: string) {
  return pathname.split("/").filter(Boolean);
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
    const url = new URL(req.url ?? "", `https://${req.headers.host}`);
    const segments = getPathSegments(url.pathname);

    if (segments[0] === "cases" && segments.length === 1) {
      if (req.method === "GET") {
        const userId = url.searchParams.get("user_id");
        if (!userId) {
          sendJson(res, { error: "user_id query parameter is required" }, 400);
          return;
        }
        const cases = await listCases(userId);
        sendJson(res, cases);
        return;
      }
      if (req.method === "POST") {
        const payload = caseCreateSchema.parse(await parseJson(req));
        const created = await createCase({
          title: payload.title,
          tags: payload.tags ?? [],
          user_id: payload.user_id,
        });
        sendJson(res, created, 201);
        return;
      }
    }

    if (segments[0] === "cases" && segments.length === 2) {
      const caseId = segments[1];
      if (req.method === "GET") {
        const data = await getCase(caseId);
        if (!data) {
          sendJson(res, { error: "Case not found" }, 404);
          return;
        }
        sendJson(res, data);
        return;
      }
      if (req.method === "PATCH") {
        const payload = caseUpdateSchema.parse(await parseJson(req));
        const updated = await updateCase(caseId, payload);
        if (!updated) {
          sendJson(res, { error: "Case not found" }, 404);
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

    if (segments[0] === "cases" && segments[2] === "chats") {
      const caseId = segments[1];
      if (segments.length === 3) {
        if (req.method === "GET") {
          const chats = await listChats(caseId);
          sendJson(res, chats);
          return;
        }
        if (req.method === "POST") {
          const payload = chatCreateSchema.parse(await parseJson(req));
          const chat = await createChat({ case_id: caseId, title: payload.title });
          sendJson(res, chat, 201);
          return;
        }
      }
      if (segments.length === 4 && req.method === "DELETE") {
        const chatId = segments[3];
        const chat = await getChat(chatId);
        if (!chat || chat.case_id !== caseId) {
          sendJson(res, { error: "Chat not found" }, 404);
          return;
        }
        await deleteChat(chatId);
        res.status(204).end();
        return;
      }
    }

    if (segments[0] === "cases" && segments[2] === "documents") {
      const caseId = segments[1];
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
            sendJson(res, { error: "File field is required" }, 400);
            return;
          }
          const document = await storeDocument({ caseId, file });
          sendJson(res, document, 201);
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

    if (segments[0] === "chats" && segments[2] === "messages") {
      const chatId = segments[1];
      if (segments.length === 3) {
        if (req.method === "GET") {
          const messages = await listMessages(chatId);
          sendJson(res, messages);
          return;
        }
        if (req.method === "POST") {
          const payload = messageCreateSchema.parse(await parseJson(req));
          const message = await createMessage({
            chatId,
            role: payload.role,
            content: payload.content,
          });
          sendJson(res, message, 201);
          return;
        }
      }
      if (segments.length === 4 && segments[3] === "stream" && req.method === "POST") {
        const payload = messageCreateSchema.parse(await parseJson(req));
        const chat = await getChat(chatId);
        if (!chat) {
          sendJson(res, { error: "Chat not found" }, 404);
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

    sendJson(res, { error: "Not Found" }, 404);
  } catch (error: unknown) {
    console.error(error);
    sendJson(res, { error: (error as Error).message ?? "Internal Server Error" }, 500);
  }
}

export const config = {
  runtime: "nodejs",
};

