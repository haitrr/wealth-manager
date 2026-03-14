import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.POSTGRES_URL ?? "postgres://postgres:postgres@localhost:54323/wm",
  },
});
