/*
  Warnings:

  - Made the column `veterinarioId` on table `HistoricoMedico` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rg` on table `Usuario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cidade` on table `Usuario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `estado` on table `Usuario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bairro` on table `Usuario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `numero` on table `Usuario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cep` on table `Usuario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `situacao` on table `Usuario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tipoUsuario` on table `Usuario` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "HistoricoMedico" DROP CONSTRAINT "HistoricoMedico_veterinarioId_fkey";

-- AlterTable
ALTER TABLE "HistoricoMedico" ALTER COLUMN "veterinarioId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Usuario" ALTER COLUMN "rg" SET NOT NULL,
ALTER COLUMN "cidade" SET NOT NULL,
ALTER COLUMN "estado" SET NOT NULL,
ALTER COLUMN "bairro" SET NOT NULL,
ALTER COLUMN "numero" SET NOT NULL,
ALTER COLUMN "cep" SET NOT NULL,
ALTER COLUMN "situacao" SET NOT NULL,
ALTER COLUMN "situacao" SET DEFAULT 'Ativo',
ALTER COLUMN "tipoUsuario" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "HistoricoMedico" ADD CONSTRAINT "HistoricoMedico_veterinarioId_fkey" FOREIGN KEY ("veterinarioId") REFERENCES "Veterinario"("idVeterinario") ON DELETE RESTRICT ON UPDATE CASCADE;
