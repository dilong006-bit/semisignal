# EduScope — 교육 산업 인텔리전스 주간 브리핑

> 회사 프로필을 한 번 입력하면, 매주 교육·AI·HRD 산업 동향을 **우리 회사의 렌즈로 재해석**해 전달하는 주간 브리핑 웹앱.

리서치 인력이 없는 중소기업·스타트업을 위해, 뉴스를 *짧게* 만들지 않고 *우리 회사 상황의 언어로 번역*합니다. 같은 기사라도 입력한 회사 프로필(규모·업종·관심 영역)이 LLM 프롬프트의 "렌즈"가 되어 회사마다 다른 함의로 재해석됩니다.

---

## 핵심 동작

1. **회사 프로필 입력** — 규모 / 업종 / 관심 영역(최소 1개). `localStorage`에 저장되어 다음 방문에 복원.
2. **주제 선택** — AX·AI / 교육 트렌드 / 초·중등 / 고등교육 중 토글 선택.
3. **브리핑 생성** — `① 뉴스 수집 중 → ② 회사 관점으로 정리 중` 2단계 로딩.
4. **결과 카드** — 주제별로 **3줄 요약 + "우리 회사에 주는 의미" + 근거 기사 링크** 표시.
5. 결과를 마크다운으로 복사하거나, 주제·프로필을 바꿔 다시 생성.

---

## 아키텍처 — RAG 데이터 플로우

```
[회사 프로필 + 선택 주제]
        │
        ▼
① 수집 (Retrieval)
   각 주제 → Google News RSS (when:7d) 호출 → XML 파싱
   → Article[] (제목·링크·출처·게시일·요약)
        │
        ▼
② 보강 (Augmentation)
   Article[] + CompanyProfile + 출력형식 지시 → 프롬프트 구성
        │
        ▼
③ 생성 (Generation)
   LLM 호출 → BriefingItem[] (주제별 3줄요약 + 회사함의 + 근거)
        │
        ▼
[브리핑 카드 렌더링]
```

`useBriefing` 훅이 이 흐름을 `phase` 상태(`idle → fetchingNews → summarizing → done/error`)로 오케스트레이션합니다.

---

## 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | React 18 | 함수형 컴포넌트 + Hooks |
| 빌드 | Vite 5 | dev server proxy로 CORS 우회 |
| 언어 | TypeScript | 타입 계약 중심 |
| 상태 관리 | React 내장 (useState/useReducer/Context) | 전역 상태 라이브러리 없음 |
| 스타일 | TailwindCSS | 가볍고 반응형 |
| LLM | Anthropic Claude API (`claude-opus-4-8`) | 모델은 환경변수로 분리 |
| 뉴스 소스 | Google News RSS | 키 불필요, XML 파싱 |

> 데이터베이스·인증·서버 프레임워크는 이번 버전에 없습니다. 영속성은 `localStorage`로 최소화.

---

## 디렉터리 구조

```
src/
├── App.tsx                      # 전체 레이아웃 + 흐름 연결
├── components/
│   ├── CompanyProfileForm.tsx   # 회사 프로필 입력 (규모·업종·관심영역)
│   ├── TopicSelector.tsx        # 주제 선택 + 생성 트리거
│   ├── StatusIndicator.tsx      # 2단계 phase / 에러 표시
│   ├── BriefingResults.tsx      # 카드 목록 컨테이너
│   ├── BriefingCard.tsx         # 주제별 카드 (요약·함의·링크)
│   └── ExportButton.tsx         # 마크다운 복사
├── services/
│   ├── newsService.ts           # Google News RSS 호출 + DOMParser XML 파싱
│   └── llmService.ts            # Claude API 호출 + JSON 파싱
├── lib/
│   ├── queries.ts               # 주제별 RSS 쿼리 빌더 (순수 함수)
│   ├── types.ts                 # 타입 계약
│   └── storage.ts               # localStorage 래퍼
├── hooks/
│   └── useBriefing.ts           # 수집→보강→생성 오케스트레이션 + phase 상태
└── main.tsx
vite.config.ts                   # dev proxy 설정 (news, llm)
.env.example                     # 키 없이 형태만 (커밋용)
```

**서비스 계층 격리 원칙:** 외부 호출(뉴스·LLM)은 반드시 `services/`에 가두고, 컴포넌트는 `useBriefing` 훅만 호출합니다. 코드에서는 외부 도메인 대신 `/api/*` 프록시 경로로만 호출하므로, 추후 LLM 호출부를 "직접 호출 → 서버리스 프록시"로 교체할 때 호출부를 건드리지 않습니다.

---

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 복사해 `.env`를 만들고 Anthropic API 키를 입력합니다.

```bash
cp .env.example .env
```

```env
# .env
VITE_ANTHROPIC_API_KEY=sk-ant-실제-키
VITE_ANTHROPIC_MODEL=claude-opus-4-8   # (선택) 미지정 시 기본값
```

> ⚠️ **`.env`는 절대 커밋하지 마세요.** `.gitignore`에 포함되어 있습니다. 실제 키는 로컬에만 두고, 공개 저장소에는 `.env.example`만 올립니다. 이 구조는 로컬 학습용이며, 실제 배포 시에는 키가 브라우저에 노출되지 않도록 서버리스 함수(프록시)로 전환해야 합니다.

### 3. 개발 서버 실행

```bash
npm run dev                 # 기본 포트(5173)
npm run dev -- --port 5151  # 포트 지정
```

### 4. 프로덕션 빌드

```bash
npm run build    # tsc 타입체크 + vite 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

---

## CORS / dev proxy

브라우저에서 Google News RSS와 Anthropic API를 직접 호출하면 CORS에 막힙니다. `vite.config.ts`의 `server.proxy`로 우회합니다.

- `/api/news` → `https://news.google.com`
- `/api/llm` → `https://api.anthropic.com`

코드에서는 절대경로(외부 도메인) 대신 상대 프록시 경로(`/api/...`)로만 호출합니다.

---

## 작업 이력

### 2026-06-22 — 초기 빌드 (v1.0)

- Vite + React + TypeScript + Tailwind 프로젝트 구성
- 타입 계약(`lib/types.ts`), RSS 쿼리 빌더(`lib/queries.ts`), localStorage 래퍼(`lib/storage.ts`)
- `services/newsService.ts` — Google News RSS 호출 + DOMParser XML 파싱, 부분 성공 처리
- `services/llmService.ts` — Claude API(`claude-opus-4-8`) 호출 + JSON 파싱(코드펜스 제거·1회 재시도)
- `hooks/useBriefing.ts` — phase 기반 수집→보강→생성 오케스트레이션
- UI 컴포넌트 일습(프로필 폼 → 주제 선택 → 상태 → 결과 카드)
- dev proxy로 CORS 우회 검증(뉴스 52건 정상 수신)

### 2026-06-22 — 업종 선택 UI/UX 개선 (오류 수정)

**문제:** 업종 입력이 `텍스트 입력란 + datalist(자동완성)` 구조라, 한 번 값이 채워지면 옵션 목록이 다시 뜨지 않았습니다. 예를 들어 "교육 출판"을 고른 뒤 "에듀테크"로 바꾸려면 Edit 모드에서 기존 값을 지우고 다시 focus해야 해서, 선택을 변경할 수 없는 것처럼 보였습니다.

**원인:** `datalist`는 "선택" UI가 아니라 "입력 자동완성"입니다. 사용자 기대(8개 중 하나를 고르고 바꾸는 동작)와 컴포넌트의 실제 동작(텍스트 편집)이 어긋났습니다.

**수정:** 업종 입력을 **규모 필드와 동일한 단일선택 칩**으로 교체했습니다. 이제 다른 칩을 한 번 클릭하면 즉시 변경됩니다. 데이터 계약(`industry: string`)·저장·LLM 프롬프트는 그대로 유지해 영향 범위를 `CompanyProfileForm.tsx`의 업종 입력부 한 곳으로 한정했고, `aria-pressed`로 접근성을 보강했습니다.

---

## 범위 밖 (이번 버전 제외)

사용자 인증·회원 시스템 / 서버 DB / 결제 / 실제 공개 배포 / 이메일·푸시 알림 / 다국어 i18n / 사용자별 클라우드 저장. (확장 로드맵 항목)

---

*로컬 학습용 프로토타입입니다. 실제 배포 시 API 키 보호(서버리스 프록시 전환)가 선행되어야 합니다.*
