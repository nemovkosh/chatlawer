# Deployment Guide

## GitHub

1. Initialize the repository (once):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Legal AI Assistant skeleton"
   ```
2. Create a new GitHub repository (e.g. `Legal-AI-Assistant`) and add it as a remote:
   ```bash
   git remote add origin git@github.com:<org-or-username>/Legal-AI-Assistant.git
   git branch -M main
   git push -u origin main
   ```
3. Configure branch protection rules on `main` and require pull requests for changes.

## Vercel (Single Project)

1. В настройках проекта установите **Root Directory** = `.` (корень репозитория), Framework preset — `Vite` или `Other`.
2. `vercel.json` уже описывает:
   - build: `npm run build` → собирает фронтенд (результат выходит в `dist/` в корне),
   - API-функция `api/index.ts` с зависимостями из `backend-ts`.
3. Перед первым деплоем локально:
   ```bash
   npm install
   vercel dev  # smoke-test: http://localhost:5173 фронт, http://localhost:3000/api/... бэкенд
   vercel --prod
   ```
4. Переменные в Vercel → Project Settings → Environment Variables:
   - `APP_SUPABASE_URL`, `APP_SUPABASE_SERVICE_ROLE_KEY`, `APP_SUPABASE_STORAGE_BUCKET`
   - `APP_OPENAI_API_KEY`, опционально `APP_OPENAI_API_BASE`, `APP_SYSTEM_PROMPT`
   - `APP_OPENAI_MODEL`, `APP_EMBEDDINGS_MODEL`, `APP_CHUNK_SIZE`, `APP_CHUNK_OVERLAP`, `APP_MAX_CONTEXT_CHUNKS`
   - `VITE_APP_ENV`, `VITE_DEFAULT_USER_ID` (при необходимости). `VITE_API_BASE_URL` можно не задавать — по умолчанию `/api`.

## Backend Notes

- Tesseract.js использует wasm-бандлы, дополнительных системных пакетов на Vercel не требуется. Для больших очередей OCR рассмотрите вынос в воркер.
- Supabase storage bucket (`legal-assistant-uploads`) должен существовать заранее.
- Сервисный ключ Supabase храните только в серверных переменных (`APP_SUPABASE_SERVICE_ROLE_KEY`).

## Verification

- Перед продакшеном:
  ```bash
  npm install
  npm run build           # vite build фронтенда
  npx tsc --noEmit --project backend-ts/tsconfig.json
  ```
- Убедитесь, что RAG-цепочка (загрузка документа → чат) проходит на `vercel dev` с актуальными ключами.

