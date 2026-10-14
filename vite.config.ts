import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages では https://sumeshi-jp.github.io/kakeibo/ に公開される
export default defineConfig({
  base: '/kakeibo/',
  plugins: [react(), tailwindcss()],
  build: {
    // Firestore SDK 自体が 600kB 強あり分割できないため、上限をそれに合わせる
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        // Firebase は更新頻度が低いので別ファイルにしてキャッシュを効かせる
        advancedChunks: {
          groups: [{ name: 'firebase', test: /node_modules[\\/]@?firebase/ }],
        },
      },
    },
  },
})
