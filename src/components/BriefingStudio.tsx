// 브리핑 초안 생성 스튜디오 — 기존 Phase 0 흐름(회사 프로필 → 주제 → 브리핑)을
// 컴포넌트로 보존. Phase 1 에서는 편집자 콘솔의 "초안 생성 도구"로 흡수된다.
// (마일스톤 5 에서 /api/lens + briefings INSERT 발행 단계가 여기에 붙는다.)
import { useEffect, useState } from "react";
import type { CompanyProfile, TopicKey } from "../lib/types";
import { loadProfile } from "../lib/storage";
import { useBriefing } from "../hooks/useBriefing";
import { CompanyProfileForm } from "./CompanyProfileForm";
import { TopicSelector } from "./TopicSelector";
import { StatusIndicator } from "./StatusIndicator";
import { BriefingResults } from "./BriefingResults";

export function BriefingStudio() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState(true);
  const [topics, setTopics] = useState<TopicKey[]>([]);
  const briefing = useBriefing();

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
    <div className="space-y-6">
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

      {profile && !editingProfile && (
        <TopicSelector
          selected={topics}
          onChange={setTopics}
          onGenerate={handleGenerate}
          phase={briefing.phase}
        />
      )}

      <StatusIndicator
        phase={briefing.phase}
        errorMessage={briefing.errorMessage}
        failedTopics={briefing.failedTopics}
      />

      <BriefingResults
        briefing={briefing.briefing}
        articles={briefing.articles}
        llmFailed={briefing.llmFailed}
      />
    </div>
  );
}
