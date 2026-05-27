import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, extname, join } from 'path'

// Плагин для инлайна файлов из public в base64
function inlinePublicAssets() {
  return {
    name: 'inline-public-assets',
    apply: 'build',
    closeBundle() {
      // Работаем с финальным HTML после всех плагинов
      const htmlPath = resolve(process.cwd(), 'dist/index.html')
      let html = readFileSync(htmlPath, 'utf-8')

      let replacementCount = 0

      // Заменяем все ссылки на файлы из /assets/ на base64 (в JS)
      html = html.replace(/["']\/assets\/([^"']+)["']/g, (match, assetPath) => {
        try {
          const quote = match[0]
          const fullPath = resolve(process.cwd(), 'public/assets', assetPath)
          const data = readFileSync(fullPath)
          const ext = extname(assetPath).toLowerCase()

          let mimeType = 'application/octet-stream'
          if (ext === '.png') mimeType = 'image/png'
          else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg'
          else if (ext === '.gif') mimeType = 'image/gif'
          else if (ext === '.svg') mimeType = 'image/svg+xml'
          else if (ext === '.webp') mimeType = 'image/webp'
          else if (ext === '.mp3') mimeType = 'audio/mpeg'
          else if (ext === '.ogg') mimeType = 'audio/ogg'
          else if (ext === '.wav') mimeType = 'audio/wav'
          else if (ext === '.json') mimeType = 'application/json'

          const base64 = data.toString('base64')
          replacementCount++
          console.log(`  Inlined: ${assetPath} (${(data.length / 1024).toFixed(2)} KB)`)
          return `${quote}data:${mimeType};base64,${base64}${quote}`
        } catch (err) {
          console.warn(`  Could not inline: ${assetPath}`, err.message)
          return match
        }
      })

      // Заменяем url() в CSS (абсолютные пути /assets/)
      html = html.replace(/url\(["']?\/assets\/([^"')]+)["']?\)/g, (match, assetPath) => {
        try {
          const fullPath = resolve(process.cwd(), 'public/assets', assetPath)
          const data = readFileSync(fullPath)
          const ext = extname(assetPath).toLowerCase()

          let mimeType = 'application/octet-stream'
          if (ext === '.png') mimeType = 'image/png'
          else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg'
          else if (ext === '.gif') mimeType = 'image/gif'
          else if (ext === '.svg') mimeType = 'image/svg+xml'
          else if (ext === '.webp') mimeType = 'image/webp'

          const base64 = data.toString('base64')
          replacementCount++
          console.log(`  Inlined (CSS): ${assetPath} (${(data.length / 1024).toFixed(2)} KB)`)
          return `url("data:${mimeType};base64,${base64}")`
        } catch (err) {
          console.warn(`  Could not inline (CSS): ${assetPath}`, err.message)
          return match
        }
      })

      // Заменяем url() в CSS (относительные пути ./assets/)
      html = html.replace(/url\(["']?\.\/assets\/([^"')]+)["']?\)/g, (match, assetPath) => {
        try {
          const fullPath = resolve(process.cwd(), 'public/assets', assetPath)
          const data = readFileSync(fullPath)
          const ext = extname(assetPath).toLowerCase()

          let mimeType = 'application/octet-stream'
          if (ext === '.png') mimeType = 'image/png'
          else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg'
          else if (ext === '.gif') mimeType = 'image/gif'
          else if (ext === '.svg') mimeType = 'image/svg+xml'
          else if (ext === '.webp') mimeType = 'image/webp'

          const base64 = data.toString('base64')
          replacementCount++
          console.log(`  Inlined (CSS): ${assetPath} (${(data.length / 1024).toFixed(2)} KB)`)
          return `url("data:${mimeType};base64,${base64}")`
        } catch (err) {
          console.warn(`  Could not inline (CSS): ${assetPath}`, err.message)
          return match
        }
      })

      writeFileSync(htmlPath, html, 'utf-8')
      console.log(`\n[inline-public-assets] Total assets inlined: ${replacementCount}`)
      console.log(`[inline-public-assets] Final size: ${(html.length / 1024).toFixed(2)} KB\n`)
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), inlinePublicAssets(), viteSingleFile()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 100000000, // Inline все ассеты в base64 (100MB лимит)
    cssCodeSplit: false,
    copyPublicDir: false, // Не копируем public folder, инлайним все через плагин
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})