import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// EduScope dev 서버 설정.
// 작업 D: /api/* 외부 호출은 서버리스 함수(api/llm·api/news)가 담당한다.
// ⚠️ 과거의 server.proxy(외부 도메인 직결)는 제거했다 — 남아 있으면 로컬에서 Vite 가
//    서버리스를 건너뛰고 외부로 직접 프록시해, 배포와 동작이 달라지는 함정이 된다.
//    로컬에서 /api/* 까지 함께 띄우려면 `vercel dev` 를 사용한다(README 참고).
export default defineConfig({
  // 작업 E: Vercel 은 루트(/)로 서빙하므로 base 를 "/"로 둔다.
  // App.tsx 의 BrowserRouter basename={import.meta.env.BASE_URL} 은 base="/"면 "/"가 되어
  // 자동 대응된다(별도 변경 불필요).
  base: "/",
  plugins: [react()],
});
