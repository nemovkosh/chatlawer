import { z } from "zod";

import { defaultSystemPrompt } from "./systemPrompt";

const SettingsSchema = z.object({
  ENVIRONMENT: z.enum(["local", "development", "staging", "production"]).default("local"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default("legal-assistant-uploads"),
  OPENAI_API_KEY: z.string(),
  OPENAI_API_BASE: z.string().url().optional(),
  OPENAI_MODEL: z.string().default("gpt-5-mini"),
  OPENAI_EMBEDDINGS_MODEL: z.string().default("text-embedding-3-large"),
  OPENAI_EMBEDDINGS_DIMS: z.coerce.number().default(1536),
  CHUNK_SIZE: z.coerce.number().default(1500),
  CHUNK_OVERLAP: z.coerce.number().default(200),
  MAX_CONTEXT_CHUNKS: z.coerce.number().default(6),
  SYSTEM_PROMPT: z.string().default(defaultSystemPrompt),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const settings: Settings = SettingsSchema.parse({
  ENVIRONMENT: process.env.APP_ENVIRONMENT,
  SUPABASE_URL: process.env.APP_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.APP_SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY: process.env.APP_SUPABASE_ANON_KEY,
  SUPABASE_STORAGE_BUCKET: process.env.APP_SUPABASE_STORAGE_BUCKET,
  OPENAI_API_KEY: process.env.APP_OPENAI_API_KEY,
  OPENAI_API_BASE: process.env.APP_OPENAI_API_BASE,
  OPENAI_MODEL: process.env.APP_OPENAI_MODEL,
  OPENAI_EMBEDDINGS_MODEL: process.env.APP_EMBEDDINGS_MODEL,
  OPENAI_EMBEDDINGS_DIMS: process.env.APP_EMBEDDINGS_DIMS,
  CHUNK_SIZE: process.env.APP_CHUNK_SIZE,
  CHUNK_OVERLAP: process.env.APP_CHUNK_OVERLAP,
  MAX_CONTEXT_CHUNKS: process.env.APP_MAX_CONTEXT_CHUNKS,
  SYSTEM_PROMPT: process.env.APP_SYSTEM_PROMPT,
  LOG_LEVEL: process.env.APP_LOG_LEVEL,
});

