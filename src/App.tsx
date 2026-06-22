// 전체 레이아웃 + 흐름 연결(7절 App). 단일 페이지, 라우팅 없음.
import { useEffect, useState } from "react";
import type { CompanyProfile, TopicKey } from "./lib/types";
import { loadProfile } from "./lib/storage";
import { useBriefing } from "./hooks/useBriefing";
import { CompanyProfileForm } from "./components/CompanyProfileForm";
import { TopicSelector } from "./components/TopicSelector";
import { StatusIndicator } from "./components/StatusIndicator";
import { BriefingResults } from "./components/BriefingResults";

export default function App() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  // 프로필이 없으면(첫 방문) 입력 폼을 우선 노출, 있으면 접어 둔다.
  const [editingProfile, setEditingProfile] = useState(true);
  const [topics, setTopics] = useState<TopicKey[]>([]);

  const briefing = useBriefing();

  // 마운트 시 localStorage 에서 프로필 복원(FR-1).
  useEffect(() => {
    const saved = loadProfile();
    if (saved) {
      setProfile(saved);
      setTopics(saved.interests);
      setEditingProfile(false);
    }
  }, []);

  function handleSaveProfile(p: CompanyProfile) {
    setProfile(p);
    setTopics(p.interests);
    setEditingProfile(false);
  }

  function handleGenerate() {
    if (!profile || topics.length === 0) return;
    void briefing.run(profile, topics);
  }

  return (
    <div className="min-h-full">
      {/* 헤더 */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <h1 className="text-2xl font-bold text-ink">EduScope</h1>
          <p className="mt-1 text-sm text-ink-soft">
            교육·AI·HRD 산업 동향을 <strong>우리 회사의 렌즈</strong>로 재해석한
            주간 브리핑.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {/* 1) 회사 프로필 */}
        {editingProfile || !profile ? (
          <CompanyProfileForm initial={profile} onSave={handleSaveProfile} />
        ) : (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="text-sm">
              <span className="font-semibold text-ink">{profile.industry}</span>
              <span className="text-ink-faint"> · {profile.size}</span>
            </div>
            <button
              type="button"
              onClick={() => setEditingProfile(true)}
              className="text-sm font-medium text-brand hover:underline"
            >
              프로필 수정
            </button>
          </div>
        )}

        {/* 2) 주제 선택 + 생성 (프로필 확정 후) */}
        {profile && !editingProfile && (
          <TopicSelector
            selected={topics}
            onChange={setTopics}
            onGenerate={handleGenerate}
            phase={briefing.phase}
          />
        )}

        {/* 3) 상태 */}
        <StatusIndicator
          phase={briefing.phase}
          errorMessage={briefing.errorMessage}
          failedTopics={briefing.failedTopics}
        />

        {/* 4) 결과 */}
        <BriefingResults
          briefing={briefing.briefing}
          articles={briefing.articles}
          llmFailed={briefing.llmFailed}
        />
      </main>

      <footer className="mx-auto max-w-3xl px-4 pb-10 pt-2 text-center text-xs text-ink-faint">
        EduScope · 로컬 학습용 프로토타입 · 근거 기사는 새 탭에서 열립니다.
      </footer>
    </div>
  );
}
