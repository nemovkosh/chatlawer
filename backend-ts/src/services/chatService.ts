import { supabaseAdmin } from "../supabase.js";
import type { Chat, TablesInsert } from "../types/supabase.js";

export async function listChats(caseId: string): Promise<Chat[]> {
  const { data, error } = await supabaseAdmin
    .from("chats")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data as Chat[];
}

export async function createChat(payload: TablesInsert["chats"]): Promise<Chat> {
  const { data, error } = await supabaseAdmin.from("chats").insert(payload).select().single();
  if (error) {
    throw error;
  }
  return data as Chat;
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const { data, error } = await supabaseAdmin
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return (data as Chat) ?? null;
}

export async function deleteChat(chatId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("chats").delete().eq("id", chatId);
  if (error) {
    throw error;
  }
}

