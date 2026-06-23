// Supabase 클라이언트(마일스톤 2). anon 키는 공개 가능하나 RLS 가 권한을 강제한다.
// 가드레일: env 미설정 시 throw 하지 않고 null 을 반환해, 설정 전에도 앱이 깨지지 않게 한다.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** .env 에 Supabase 값이 채워져 있는지. false 면 UI 가 설정 안내 배너를 띄운다. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/** 미설정 시 null. 사용 측에서는 isSupabaseConfigured 로 가드한다. */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // 매직링크 콜백 처리.
      },
    })
  : null;
