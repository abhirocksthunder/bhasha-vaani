import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deliberately NOT port 6002 -- that's still apps/mobile_flutter's port
// (see CLAUDE.md), and Start BhashaVaani.cmd keeps serving the Flutter
// build there throughout the migration. This app runs on 6003 instead so
// both frontends can be open side-by-side and you can tell them apart.
// Backend stays on 6001 either way (CORS in apps/api/app/main.py already
// allows 127.0.0.1:6003). Port 6000 is intentionally avoided (Chromium
// treats it as an unsafe port).
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 6003,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 6003,
    strictPort: true,
  },
})
