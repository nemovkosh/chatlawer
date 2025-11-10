import OpenAI from "openai";

import { settings } from "./config.js";

export const openaiClient = new OpenAI({
  apiKey: settings.OPENAI_API_KEY,
  baseURL: settings.OPENAI_API_BASE,
});

