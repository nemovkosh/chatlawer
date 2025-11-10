# Setup Checklist

1. **Supabase**
   - Enable `pgvector` extension on the project database.
   - Create buckets (e.g. `legal-assistant-uploads`) in Supabase Storage.
   - Apply tables according to the PRD schema (`cases`, `documents`, `chats`, `messages`, `document_embeddings`).

2. **Environment Variables**
   - Copy `backend/env.example` to `backend/.env` и заполните Supabase + OpenAI (`APP_OPENAI_API_KEY`, при необходимости `APP_OPENAI_API_BASE`, приоритетная модель `APP_OPENAI_MODEL=gpt-5-mini`).
   - Copy `frontend/env.example` to `frontend/.env.local` (на Vercel внесите значения через Project Settings) и укажите `VITE_API_BASE_URL`, `VITE_APP_ENV`, `VITE_DEFAULT_USER_ID`.

3. **System Dependencies**
   - Для OCR установите Tesseract: `brew install tesseract` (macOS) или `sudo apt-get install tesseract-ocr` (Linux). На Windows используйте официальный установщик.
   - Убедитесь, что переменная `TESSDATA_PREFIX` указывает на каталог языковых моделей, если используется кастомная локация.

4. **Local Development**
   - Backend: `poetry install && poetry run uvicorn app.main:app --reload`.
   - Frontend: `npm install && npm run dev`.
   - Visit `http://localhost:5173` to interact with the UI.

5. **Embedding Pipeline (Planned)**
   - Hook document uploads to a background worker that extracts text, chunks content, and stores embeddings.
   - Use Supabase Edge Functions or an external worker queue (Celery/RQ) for asynchronous indexing.

6. **Testing**
   - Backend tests via `poetry run pytest`.
   - Frontend tests (future) with `npm test` once suites are added.

