// 공통 헤더 — 브랜드 + 역할 배지 + 네비(홈/편집자) + 로그아웃.
// 편집자 메뉴는 role==='editor' 일 때만 노출(UX 분기, 권한은 RLS).
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function AppHeader() {
  const { session, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  function navClass(active: boolean): string {
    return `text-sm font-medium transition ${
      active ? "text-brand" : "text-ink-soft hover:text-ink"
    }`;
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-ink">EduScope</span>
          <span className="hidden text-xs text-ink-faint sm:inline">
            교육 산업 주간 브리핑
          </span>
        </Link>

        {session && (
          <nav className="flex items-center gap-4">
            <Link to="/" className={navClass(pathname === "/")}>
              피드
            </Link>
            {role === "editor" && (
              <Link
                to="/editor"
                className={navClass(pathname.startsWith("/editor"))}
              >
                편집자 콘솔
              </Link>
            )}

            {/* 역할 배지 */}
            {role && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  role === "editor"
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-ink-soft"
                }`}
                title={profile?.email ?? undefined}
              >
                {role === "editor" ? "편집자" : "독자"}
              </span>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm font-medium text-ink-faint hover:text-ink"
            >
              로그아웃
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
