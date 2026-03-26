import path from "node:path"
import { defineConfig } from "prisma/config"
import { Pool } from "pg"
import * as dotenv from "dotenv"

dotenv.config()

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  migrate: {
    async adapter() {
      const { PrismaAdapterPg } = await import("@prisma/adapter-pg")
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      })
      return new PrismaAdapterPg(pool)
    },
  },
})