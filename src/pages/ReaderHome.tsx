// 독자 홈 — 발행 브리핑 피드 자리(마일스톤 4 에서 briefings SELECT + reactions 연결).
// 지금은 회원관리 동작 확인용 랜딩.
import { useAuth } from "../contexts/AuthContext";

export function ReaderHome() {
  const { profile, role } = useAuth();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">독자 피드</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {profile?.email ?? "사용자"} 님, 환영합니다. 현재 역할은{" "}
          <strong>{role === "editor" ? "편집자" : "독자"}</strong> 입니다.
        </p>

        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm text-ink-soft">
            발행된 브리핑 피드 · 카테고리 필터 · 저장/좋아요는
            <br />
            <span className="font-medium">마일스톤 4</span> 에서 연결됩니다.
          </p>
        </div>

        {role === "editor" && (
          <p className="mt-4 text-sm text-brand">
            편집자 콘솔은 상단 메뉴에서 열 수 있습니다.
          </p>
        )}
      </div>
    </div>
  );
}
