// 초안 카드 하단 발행 컨트롤(마일스톤 A). 편집자 검수 후 발행/발행취소.
interface Props {
  published: boolean;
  busy: boolean;
  configured: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
}

export function PublishBar({
  published,
  busy,
  configured,
  onPublish,
  onUnpublish,
}: Props) {
  if (!configured) {
    return (
      <p className="text-xs text-amber-700">
        발행하려면 Supabase 연결이 필요합니다(.env 설정 후 테스트).
      </p>
    );
  }

  if (published) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          발행됨
        </span>
        <button
          type="button"
          onClick={onUnpublish}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
        >
          {busy ? "처리 중…" : "발행취소"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-ink-faint">
        검수 후 독자 피드에 발행합니다.
      </span>
      <button
        type="button"
        onClick={onPublish}
        disabled={busy}
        className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-soft disabled:opacity-50"
      >
        {busy ? "발행 중…" : "발행"}
      </button>
    </div>
  );
}
