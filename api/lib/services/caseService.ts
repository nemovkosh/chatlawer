import { supabaseAdmin } from "../supabase";
import type { Case, TablesInsert } from "../types";

export async function listCases(userId: string): Promise<Case[]> {
  const { data, error } = await supabaseAdmin
    .from("cases")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data as Case[];
}

export async function createCase(payload: TablesInsert["cases"]): Promise<Case> {
  const { data, error } = await supabaseAdmin.from("cases").insert(payload).select().single();
  if (error) {
    throw error;
  }
  return data as Case;
}

export async function getCase(caseId: string): Promise<Case | null> {
  const { data, error } = await supabaseAdmin.from("cases").select("*").eq("id", caseId).maybeSingle();
  if (error) {
    throw error;
  }
  return (data as Case) ?? null;
}

export async function updateCase(caseId: string, updates: Partial<TablesInsert["cases"]>): Promise<Case | null> {
  const { data, error } = await supabaseAdmin
    .from("cases")
    .update(updates)
    .eq("id", caseId)
    .select()
    .maybeSingle();
  if (error) {
    throw error;
  }
  return (data as Case) ?? null;
}

export async function deleteCase(caseId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("cases").delete().eq("id", caseId);
  if (error) {
    throw error;
  }
}

