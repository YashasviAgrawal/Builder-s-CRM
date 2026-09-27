import "dotenv/config";

import { defineConfig } from "prisma/config";

// The CLI (migrate, studio) needs a session connection: migrations take session-level advisory locks, which a
// transaction pooler (e.g. Supabase port 6543) does not support. The app itself connects through DATABASE_URL.
const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  // Multi-file schema: one file per module (BUILD_PLAN §2.3).
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed/index.ts",
  },
  // Optional so `prisma generate` works without a database (e.g. Docker builds); migrate commands need it.
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
