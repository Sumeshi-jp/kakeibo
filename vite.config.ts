import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages では https://sumeshi-jp.github.io/kakeibo/ に公開される
export default defineConfig({
  base: '/kakeibo/',
  plugins: [react(), tailwindcss()],
})
