import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack was resolving the repo root to ~/ because of a second lockfile there;
  // that prevented `.env.local` in this folder from loading (middleware had no Supabase env).
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
