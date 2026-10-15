import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages では https://sumeshi-jp.github.io/kakeibo/ に公開される
export default defineConfig({
  base: '/kakeibo/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 使っている最中にページを読み込み直すと、入力中の内容が消えたり PIN を再入力させたりするため、
      // 新しい版は待機させておき、次にアプリを開いたときに切り替える
      registerType: 'prompt',
      includeAssets: ['icons/apple-touch-icon-180x180.png', 'icons/favicon-64x64.png'],
      manifest: {
        name: 'kakeibo',
        short_name: 'kakeibo',
        description: '自分のための家計簿',
        lang: 'ja',
        start_url: '/kakeibo/',
        scope: '/kakeibo/',
        display: 'standalone',
        theme_color: '#faf9f7',
        background_color: '#faf9f7',
        icons: [
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Google Fonts もオフラインで使えるようにキャッシュする
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
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
