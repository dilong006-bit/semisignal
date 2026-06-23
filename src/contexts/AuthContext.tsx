// 인증/역할 컨텍스트(마일스톤 2). 세션·프로필(역할) 단일 소스.
// 가드레일: Supabase 미설정이어도 throw 하지 않고 "미설정" 상태로 흐른다.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { Profile, Role } from "../lib/types";

interface AuthState {
  /** 초기 세션 로딩 중. */
  loading: boolean;
  /** Supabase env 설정 여부. false 면 로그인 자체가 불가(안내만). */
  configured: boolean;
  session: Session | null;
  profile: Profile | null;
  /** 편의 접근자. profile?.role. */
  role: Role | null;
  /** 이메일 매직링크 발송. */
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  /** Google OAuth 로그인. */
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/** 로그인 후 리다이렉트로 돌아올 기준 URL(BASE_URL 고려). */
function redirectUrl(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  /** profiles 테이블에서 현재 사용자 프로필(역할) 조회. */
  const loadProfile = useCallback(async (uid: string, email: string | null) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .eq("id", uid)
      .maybeSingle();

    if (error) {
      console.error("[auth] 프로필 조회 실패:", error.message);
      setProfile(null);
      return;
    }
    // 트리거가 행을 만들기 전 레이스가 있을 수 있어, 없으면 reader 로 가정.
    setProfile(
      data
        ? (data as Profile)
        : { id: uid, email, role: "reader" as Role },
    );
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    let active = true;

    // 1) 현재 세션 복원
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) {
        void loadProfile(data.session.user.id, data.session.user.email ?? null);
      }
      setLoading(false);
    });

    // 2) 이후 인증 상태 변화 구독
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        void loadProfile(sess.user.id, sess.user.email ?? null);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signInWithEmail = useCallback(async (email: string) => {
    if (!supabase) return { error: "Supabase 가 설정되지 않았습니다." };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl() },
    });
    return { error: error?.message ?? null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return { error: "Supabase 가 설정되지 않았습니다." };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl() },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value: AuthState = {
    loading,
    configured: isSupabaseConfigured,
    session,
    profile,
    role: profile?.role ?? null,
    signInWithEmail,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 는 AuthProvider 내부에서만 사용하세요.");
  return ctx;
}
