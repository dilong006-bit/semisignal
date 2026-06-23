/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 프론트엔드 공개 가능 키 — RLS 로 보호됨.
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  // [Phase 0 잔존] llmService 가 /api/lens 로 이전되기 전까지 로컬에서만 사용.
  readonly VITE_ANTHROPIC_API_KEY?: string;
  readonly VITE_ANTHROPIC_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
