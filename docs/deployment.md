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

## Vercel (Frontend)

1. Install the Vercel CLI and log in:
   ```bash
   npm i -g vercel
   vercel login
   ```
2. From the `frontend/` directory, deploy:
   ```bash
   cd frontend
   vercel --prod
   ```
   Vercel reads `vercel.json` for build and output configuration.
3. Set environment variables in the Vercel dashboard:
   - `VITE_API_BASE_URL` → URL of the FastAPI backend.
   - `VITE_APP_ENV` → Environment label (`production`, `staging`, etc.).
   - `VITE_DEFAULT_USER_ID` → ID пользователя Supabase/демо-аккаунта (или удалите, если есть полноценная аутентификация).
4. Enable automatic deployments from GitHub by linking the repository in the Vercel dashboard.

## Backend Hosting

- The FastAPI backend can be hosted on rendering platforms (Render, Railway, Fly.io) or containerized for deployment.
- Provide the deployed backend URL to the frontend via `VITE_API_BASE_URL`.
- Ensure Supabase credentials, OpenAI key (`APP_OPENAI_API_KEY`) и при необходимости `APP_SYSTEM_PROMPT` заданы в конфигурации бекенда.
- Для OCR установите Tesseract на хосте (`apt-get install tesseract-ocr`, `brew install tesseract` и т.д.), иначе извлечение текста из изображений будет пропущено.

## Verification

- Before deploying, run:
  ```bash
  # Backend
  cd backend
  poetry run pytest
  poetry run uvicorn app.main:app --reload

  # Frontend
  cd frontend
  npm run build
  npm run preview
  ```
- Confirm the chat flow works end-to-end with Supabase and OpenAI credentials in a staging environment.

