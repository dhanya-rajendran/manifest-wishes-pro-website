import path from 'node:path'
import dotenv from 'dotenv'
import { defineConfig, env } from 'prisma/config'

// Load .env.local first (used by Next.js), then fall back to .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})