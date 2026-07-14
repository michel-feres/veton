// prisma.config.ts
import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";
import * as path from "path";

// Força o dotenv a carregar o arquivo .env que está exatamente na raiz do projeto
dotenv.config({ path: path.resolve(__dirname, ".env") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("A variável DATABASE_URL não foi encontrada no seu arquivo .env!");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl, // Passa a string de conexão direta que acabamos de ler
  },
});
