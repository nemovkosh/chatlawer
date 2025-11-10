# Setup Checklist

1. **Supabase**
   - Enable `pgvector` extension on the project database.
   - Create buckets (e.g. `legal-assistant-uploads`) in Supabase Storage.
   - Apply tables according to the PRD schema (`cases`, `documents`, `chats`, `messages`, `document_embeddings`).

2. **Environment Variables**
   - API: скопируйте `env.example` в `.env.local` (используется `vercel dev`) или задайте переменные в Vercel → Project Settings. Нужны `APP_SUPABASE_*`, `APP_OPENAI_API_KEY`, `APP_SUPABASE_STORAGE_BUCKET`, при желании `APP_SYSTEM_PROMPT`.
   - Frontend: скопируйте `frontend/env.example` в `frontend/.env.local` и при необходимости обновите `VITE_APP_ENV`, `VITE_INITIAL_CASE_TITLE` (по умолчанию `VITE_API_BASE_URL=/api` работает без изменений).

3. **Local Development**
   - Запустите `npm install` в корне (workspaces).
   - Поднимите `vercel dev` в корне: фронтенд на `http://localhost:5173`, API — `http://localhost:3000/api/...`.
   - Для изолированной разработки можно использовать `npm run dev --workspace frontend`.

4. **Embedding Pipeline (Planned)**
   - Для крупного объёма документов перенесите парсинг/эмбеддинги в фоновый воркер (Supabase Edge Functions, очереди).

5. **Testing**
   - Пока автоматических тестов нет; для smoke-проверки выполните `npm run build` и `vercel dev`, затем прогоните ключевые пользовательские сценарии вручную.

