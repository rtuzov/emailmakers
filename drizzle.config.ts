import type { Config } from 'drizzle-kit';

export default {
  schema: [
    './src/shared/infrastructure/database/schema.ts',
    './src/shared/infrastructure/database/render-testing-schema.ts'
  ],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config; 