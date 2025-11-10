# Legal AI Assistant — Architecture Overview

## High-Level System

- **Frontend** — React + TypeScript + Tailwind (Vite build) delivering the legal-focused chat experience:
  - `CaseSidebar` for case selection, chat threads in each case, and quick chat creation.
  - `ChatWorkspace` for streaming conversations with auto-scroll, Markdown rendering, and tone guidance.
  - `DocumentPanel` to surface uploaded case materials for quick access.
  - `services/api.ts` centralizes REST interactions with the backend, supporting streaming tokens.

- **Backend** — TypeScript serverless API (Vercel + @vercel/node):
  - Маршруты `/cases`, `/cases/:id/chats`, `/cases/:id/documents`, `/chats/:id/messages`, `/chats/:id/messages/stream`.
  - `supabase.ts` использует service role key для CRUD и Supabase Storage.
  - `documentService` — извлечение текста из PDF (`pdf-parse`), DOCX (`mammoth`), TXT, изображений (`tesseract.js`), сохранение файлов в Supabase Storage и индексация через `EmbeddingService`.
  - `messageService` — Retrieval-Augmented Generation: загрузка контекстных чанков, стриминг GPT-5 mini, запись ассистентских ответов.
  - Вся логика — в Node runtime, совместимом с Vercel serverless.

- **Supabase** — Single managed stack:
  - Auth (future) for user management.
  - PostgreSQL + `pgvector` for structured and semantic data.
  - Storage buckets for document uploads.
  - Future Edge Functions can host preprocessing pipelines (text extraction, chunking, embeddings).

## Request Flow

1. User sends a chat message from the frontend.
2. Backend persists the user message and resolves contextual document chunks tied to the case.
3. Retrieval context and conversation history are sent to OpenAI for streaming completion.
4. Streamed tokens are forwarded to the frontend for real-time rendering.
5. Final assistant message is persisted; clients refresh conversation state.

## Extensibility Notes

- **Document Processing** — При высоких нагрузках вынесите OCR/парсинг в фоновые очереди (Supabase Edge Functions, Durable queues) и подключите ретраи.
- **Embeddings Pipeline** — Синхронная индексация подходит для MVP; для крупных документов используйте батчевую генерацию эмбеддингов и bulk insert.
- **Auth & Security** — Replace demo user handling with Supabase Auth JWT verification and enforce Row-Level Security policies.
- **Realtime** — Supabase Realtime channels can push message updates to active sessions.
- **Testing** — Добавьте интеграционные тесты для API (Vitest/Supertest) и UI тесты (React Testing Library, Playwright).

