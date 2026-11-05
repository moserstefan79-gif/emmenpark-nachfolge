import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
export default defineConfig({ plugins: [react()], resolve: { alias: { '@supabase/supabase-js': path.resolve('mock/supabase-mock.js') } }, build: { outDir: 'dist-mock' } })
