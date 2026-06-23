import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// EduScope dev 서버 설정.
// 작업 D: /api/* 외부 호출은 서버리스 함수(api/llm·api/news)가 담당한다.
// ⚠️ 과거의 server.proxy(외부 도메인 직결)는 제거했다 — 남아 있으면 로컬에서 Vite 가
//    서버리스를 건너뛰고 외부로 직접 프록시해, 배포와 동작이 달라지는 함정이 된다.
//    로컬에서 /api/* 까지 함께 띄우려면 `vercel dev` 를 사용한다(README 참고).
export default defineConfig({
  // GitHub Pages 프로젝트 사이트는 https://<user>.github.io/semisignal/ 하위 경로로
  // 서비스되므로 base 를 저장소 이름에 맞춰야 빌드 결과의 자원 경로가 어긋나지 않는다.
  // (작업 E 에서 Vercel 루트 서빙에 맞춰 base 정리 예정.)
  base: "/semisignal/",
  plugins: [react()],
});
