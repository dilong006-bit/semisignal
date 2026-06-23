// 라우터 + 인증 셸(마일스톤 3). 권한의 최종 강제는 RLS, 라우트 가드는 UX.
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppHeader } from "./components/AppHeader";
import { RequireAuth, RequireRole } from "./components/guards";
import { LoginPage } from "./pages/LoginPage";
import { ReaderHome } from "./pages/ReaderHome";
import { EditorConsole } from "./pages/EditorConsole";

function Shell() {
  return (
    <div className="min-h-full">
      <AppHeader />
      <main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* 로그인 필요 */}
          <Route element={<RequireAuth />}>
            <Route path="/" element={<ReaderHome />} />

            {/* 편집자 전용 */}
            <Route element={<RequireRole role="editor" />}>
              <Route path="/editor" element={<EditorConsole />} />
            </Route>
          </Route>

          {/* 알 수 없는 경로 → 홈 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="mx-auto max-w-3xl px-4 pb-10 pt-2 text-center text-xs text-ink-faint">
        EduScope · Phase 1 · 권한은 Supabase RLS 가 강제합니다.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      {/* BASE_URL 을 basename 으로 — GitHub Pages(/semisignal/)·Vercel(/) 모두 대응 */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}
