import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, hasSupabase } from "@/lib/env";

let client: SupabaseClient | null = null;

/**
 * 服务端 Supabase 客户端（service_role，绕过 RLS）。
 * 未配置时返回 null —— 调用方据此降级为「不持久化 / localStorage」。
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!hasSupabase) return null;
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
