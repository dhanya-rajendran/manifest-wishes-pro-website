import 'dotenv/config'

// Use a plain object export to avoid importing Prisma 7 types.
// The Prisma CLI will read this configuration for migrations and seeding.
const config = {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
}

export default config