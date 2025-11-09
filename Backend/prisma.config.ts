// Ensure dotenv is loaded before we call env(...) so Prisma config can read .env values
import dotenv from 'dotenv';
dotenv.config();

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
