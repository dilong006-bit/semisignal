// 회사 프로필 입력 폼(FR-1). 규모·업종·관심영역. 저장 시 localStorage 기록.
import { useEffect, useState } from "react";
import {
  COMPANY_SIZES,
  INDUSTRY_PRESETS,
  TOPICS,
  type CompanyProfile,
  type CompanySize,
  type TopicKey,
} from "../lib/types";
import { saveProfile } from "../lib/storage";

interface Props {
  initial: CompanyProfile | null;
  onSave: (profile: CompanyProfile) => void;
}

export function CompanyProfileForm({ initial, onSave }: Props) {
  const [size, setSize] = useState<CompanySize>(initial?.size ?? "스타트업");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [interests, setInterests] = useState<TopicKey[]>(
    initial?.interests ?? [],
  );

  useEffect(() => {
    if (initial) {
      setSize(initial.size);
      setIndustry(initial.industry);
      setInterests(initial.interests);
    }
  }, [initial]);

  function toggleInterest(key: TopicKey) {
    setInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  const canSave = industry.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    const profile: CompanyProfile = {
      size,
      industry: industry.trim(),
      interests,
    };
    saveProfile(profile);
    onSave(profile);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-ink">회사 프로필</h2>
      <p className="mt-1 text-sm text-ink-soft">
        한 번 입력하면 다음 방문에도 복원됩니다. 이 프로필이 브리핑의 렌즈가 됩니다.
      </p>

      {/* 규모 */}
      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-ink">규모</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {COMPANY_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                size === s
                  ? "border-brand bg-brand text-white"
                  : "border-slate-300 bg-white text-ink-soft hover:border-brand-soft"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      {/* 업종 — 규모와 동일한 단일선택 칩(클릭으로 자유롭게 변경). */}
      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-ink">업종</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {INDUSTRY_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={industry === p}
              onClick={() => setIndustry(p)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                industry === p
                  ? "border-brand bg-brand text-white"
                  : "border-slate-300 bg-white text-ink-soft hover:border-brand-soft"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </fieldset>

      {/* 관심 영역 */}
      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-ink">관심 영역</legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TOPICS.map((t) => {
            const active = interests.includes(t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => toggleInterest(t.key)}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-brand bg-brand-bg"
                    : "border-slate-200 bg-white hover:border-brand-soft"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{t.label}</span>
                  <span
                    className={`h-4 w-4 rounded-full border ${
                      active ? "border-brand bg-brand" : "border-slate-300"
                    }`}
                  />
                </div>
                <p className="mt-1 text-xs text-ink-faint">{t.description}</p>
              </button>
            );
          })}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={!canSave}
        className="mt-6 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        프로필 저장
      </button>
    </form>
  );
}
