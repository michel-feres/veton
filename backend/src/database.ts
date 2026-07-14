// src/database.ts
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
// Buscando o PrismaClient direto da pasta física gerada!
import { PrismaClient } from "./generated/prisma/client";

// Configura o pool do driver do Postgres nativo com a sua URL do Supabase
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Instancia o Prisma usando o Adapter
export const prisma = new PrismaClient({ adapter });
