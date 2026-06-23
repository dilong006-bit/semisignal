// 로그인(마일스톤 2). 이메일 매직링크 + Google OAuth.
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const { configured, session, loading, signInWithEmail, signInWithGoogle } =
    useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 이미 로그인 상태면 피드로.
  if (!loading && session) return <Navigate to="/" replace />;

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    const { error } = await signInWithEmail(email.trim());
    setBusy(false);
    if (error) setError(error);
    else setSent(true);
  }

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
      setBusy(false);
    }
    // 성공 시 OAuth 리다이렉트가 일어난다.
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-ink">EduScope 로그인</h1>
        <p className="mt-1 text-sm text-ink-soft">
          교육·AI·HRD 동향을 우리 회사의 렌즈로.
        </p>

        {!configured && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Supabase 가 아직 설정되지 않았습니다. <code>.env</code> 에{" "}
            <code>VITE_SUPABASE_URL</code> / <code>VITE_SUPABASE_ANON_KEY</code>{" "}
            를 입력한 뒤 다시 시도하세요.
          </div>
        )}

        {sent ? (
          <div className="mt-6 rounded-xl border border-brand/20 bg-brand-bg px-4 py-4 text-sm text-brand">
            <strong>{email}</strong> 으로 로그인 링크를 보냈습니다. 메일함을
            확인해 주세요.
          </div>
        ) : (
          <>
            <form onSubmit={handleEmail} className="mt-6 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                disabled={!configured || busy}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-slate-50"
              />
              <button
                type="submit"
                disabled={!configured || busy}
                className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {busy ? "전송 중…" : "이메일로 로그인 링크 받기"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-ink-faint">또는</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={!configured || busy}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              Google 계정으로 계속
            </button>
          </>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-ink-faint">
        최초 로그인 시 자동으로 독자(reader) 계정이 생성됩니다.
      </p>
    </div>
  );
}
