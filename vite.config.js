import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const familyTarget = process.env.FINOWN_FAMILY_API_URL || 'http://127.0.0.1:8784';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(familyTarget))throw new Error('Aile test API yalnız 127.0.0.1 olabilir.');

// https://vite.dev/config/
export default defineConfig({
  server: { proxy: { '/family-api': { target: familyTarget, changeOrigin: true }, '/auth/v1': { target: familyTarget, changeOrigin: true } } },
  plugins: [react()],
})
