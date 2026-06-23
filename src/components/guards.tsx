// 라우트 가드(마일스톤 3). 프론트 분기는 UX 편의일 뿐, 권한의 최종 강제는 RLS.
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { Role } from "../lib/types";

function FullScreenSpinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 text-ink-soft">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}

/** 로그인 필요. 미로그인 시 /login 으로. */
export function RequireAuth() {
  const { loading, session } = useAuth();
  if (loading) return <FullScreenSpinner label="세션 확인 중…" />;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** 특정 역할 필요. 권한 없으면 홈으로(접근 거부 안내). */
export function RequireRole({ role }: { role: Role }) {
  const { loading, session, profile } = useAuth();
  if (loading) return <FullScreenSpinner label="권한 확인 중…" />;
  if (!session) return <Navigate to="/login" replace />;
  // 프로필 로딩 직후 race 보호: profile 이 아직 null 이면 잠시 대기 표시.
  if (!profile) return <FullScreenSpinner label="권한 확인 중…" />;
  if (profile.role !== role) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-lg font-semibold text-ink">접근 권한이 없습니다</p>
        <p className="mt-2 text-sm text-ink-soft">
          이 페이지는 {role === "editor" ? "편집자" : "독자"} 전용입니다.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }
  return <Outlet />;
}
