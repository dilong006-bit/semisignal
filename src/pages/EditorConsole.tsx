// 편집자 콘솔(편집자 전용 라우트 + RLS). 현재는 기존 브리핑 초안 생성 도구를 흡수.
// 마일스톤 5 에서 /api/news → 선별 → /api/lens 초안 → 편집자 검수 → briefings INSERT 발행,
// 마일스톤 6 에서 독자 반응 신호 대시보드가 이 화면에 붙는다.
import { BriefingStudio } from "../components/BriefingStudio";

export function EditorConsole() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">편집자 콘솔</h1>
        <p className="mt-1 text-sm text-ink-soft">
          뉴스를 우리 회사 렌즈로 재해석한 브리핑 초안을 만듭니다. 발행·검수 및
          반응 대시보드는 다음 마일스톤에서 연결됩니다.
        </p>
      </div>

      {/* 기존 Phase 0 흐름 = 초안 생성 도구 */}
      <BriefingStudio />
    </div>
  );
}
