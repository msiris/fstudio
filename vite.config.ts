import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages 프로젝트 페이지 경로. 개발 서버도 같은 경로로 맞춰 둔다.
  base: '/fstudio/',
  plugins: [react()],
});
