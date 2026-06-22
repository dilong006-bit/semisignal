import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// EduScope dev 서버 설정.
// 브라우저에서 Google News RSS / Anthropic API 를 직접 호출하면 CORS 에 막힌다.
// server.proxy 로 우회한다(11-3절). 코드에서는 외부 도메인 대신 /api/* 프록시
// 경로로만 호출하므로, 추후 서버리스 프록시로 교체할 때 호출부를 건드리지 않는다.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // /api/news/rss/search?... -> https://news.google.com/rss/search?...
      "/api/news": {
        target: "https://news.google.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, ""),
      },
      // /api/llm/v1/messages -> https://api.anthropic.com/v1/messages
      "/api/llm": {
        target: "https://api.anthropic.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/llm/, ""),
      },
    },
  },
});
