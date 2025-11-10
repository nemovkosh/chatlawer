# Legal AI Assistant — Architecture Overview

## High-Level System

- **Frontend** — React + TypeScript + Tailwind (Vite build) delivering the legal-focused chat experience:
  - `CaseSidebar` for case selection, chat threads in each case, and quick chat creation.
  - `ChatWorkspace` for streaming conversations with auto-scroll, Markdown rendering, and tone guidance.
  - `DocumentPanel` to surface uploaded case materials for quick access.
  - `services/api.ts` centralizes REST interactions with the backend, supporting streaming tokens.

- **Backend** — FastAPI with Supabase integration:
  - RESTful endpoints for `cases`, `documents`, `chats`, and `messages`.
  - `SupabaseService` wraps Supabase client operations (insert/update/select) and exposes the storage bucket helpers.
  - `DocumentService` выполняет извлечение текста из PDF, DOCX, TXT и изображений (через Tesseract OCR), а `EmbeddingService` нарезает контент на чанки и сохраняет вектора в Supabase `pgvector`.
  - `MessageService` orchestrates Retrieval-Augmented Generation (RAG) by fetching relevant embeddings и стримит ответы модели GPT-5 mini по системному метапромпту.
  - Dependency injection keeps services modular and testable.

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

- **Document Processing** — При необходимости масштабирования выносите OCR и парсинг крупных файлов в асинхронные воркеры (Celery, Supabase Edge Functions).
- **Embeddings Pipeline** — Текущая синхронная индексация подходит для MVP; для больших файлов используйте очередь задач и батчевую запись в `document_embeddings`.
- **Auth & Security** — Replace demo user handling with Supabase Auth JWT verification and enforce Row-Level Security policies.
- **Realtime** — Supabase Realtime channels can push message updates to active sessions.
- **Testing** — Pytest + pytest-asyncio for service layer tests; React Testing Library for frontend interaction coverage.

