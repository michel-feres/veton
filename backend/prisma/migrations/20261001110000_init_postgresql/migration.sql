-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('Tutor', 'Veterinario');

-- CreateEnum
CREATE TYPE "StatusUsuario" AS ENUM ('Ativo', 'Inativo');

-- CreateEnum
CREATE TYPE "StatusAnimal" AS ENUM ('Saudavel', 'EmTratamento', 'Emergencia');

-- CreateEnum
CREATE TYPE "StatusConsulta" AS ENUM ('Agendada', 'Concluida', 'Cancelada');

-- CreateTable
CREATE TABLE "Usuario" (
    "idUsuario" SERIAL NOT NULL,
    "rg" TEXT,
    "nome" TEXT NOT NULL,
    "cidade" TEXT,
    "email" TEXT NOT NULL,
    "estado" TEXT,
    "bairro" TEXT,
    "numero" TEXT,
    "cep" TEXT,
    "senha" TEXT NOT NULL,
    "situacao" "StatusUsuario",
    "tipoUsuario" "TipoUsuario",
    "codigoRecuperacao" TEXT,
    "expiraCodigo" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("idUsuario")
);

CREATE TABLE "Tutor" (
    "idTutor" SERIAL NOT NULL,
    "cpf" TEXT NOT NULL,
    "idUsuario" INTEGER NOT NULL,
    CONSTRAINT "Tutor_pkey" PRIMARY KEY ("idTutor")
);

CREATE TABLE "Veterinario" (
    "idVeterinario" SERIAL NOT NULL,
    "crmv" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "idUsuario" INTEGER NOT NULL,
    CONSTRAINT "Veterinario_pkey" PRIMARY KEY ("idVeterinario")
);

CREATE TABLE "Clinica" (
    "idClinica" SERIAL NOT NULL,
    "nomeClinica" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    CONSTRAINT "Clinica_pkey" PRIMARY KEY ("idClinica")
);

CREATE TABLE "Animal" (
    "idAnimal" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "especie" TEXT NOT NULL,
    "raca" TEXT,
    "sexo" TEXT,
    "peso" DOUBLE PRECISION,
    "cor" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "status" "StatusAnimal" NOT NULL DEFAULT 'Saudavel',
    "idTutor" INTEGER NOT NULL,
    CONSTRAINT "Animal_pkey" PRIMARY KEY ("idAnimal")
);

CREATE TABLE "Vacina" (
    "idVacina" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "fabricante" TEXT,
    "dataAplicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proximaDose" TIMESTAMP(3),
    "idAnimal" INTEGER NOT NULL,
    CONSTRAINT "Vacina_pkey" PRIMARY KEY ("idVacina")
);

CREATE TABLE "HistoricoMedico" (
    "idHistorico" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "tratamento" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idAnimal" INTEGER NOT NULL,
    "veterinarioId" INTEGER,
    CONSTRAINT "HistoricoMedico_pkey" PRIMARY KEY ("idHistorico")
);

CREATE TABLE "Consulta" (
    "idConsulta" SERIAL NOT NULL,
    "dataConsulta" TIMESTAMP(3) NOT NULL,
    "horaConsulta" TEXT NOT NULL,
    "observacoes" TEXT,
    "statusConsulta" "StatusConsulta" NOT NULL DEFAULT 'Agendada',
    "idAnimal" INTEGER NOT NULL,
    "idVeterinario" INTEGER NOT NULL,
    "idClinica" INTEGER NOT NULL,
    CONSTRAINT "Consulta_pkey" PRIMARY KEY ("idConsulta")
);

CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE UNIQUE INDEX "Tutor_cpf_key" ON "Tutor"("cpf");
CREATE UNIQUE INDEX "Tutor_idUsuario_key" ON "Tutor"("idUsuario");
CREATE UNIQUE INDEX "Veterinario_crmv_key" ON "Veterinario"("crmv");
CREATE UNIQUE INDEX "Veterinario_idUsuario_key" ON "Veterinario"("idUsuario");
CREATE UNIQUE INDEX "Clinica_cnpj_key" ON "Clinica"("cnpj");

ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_idUsuario_fkey"
  FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("idUsuario") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Veterinario" ADD CONSTRAINT "Veterinario_idUsuario_fkey"
  FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("idUsuario") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Animal" ADD CONSTRAINT "Animal_idTutor_fkey"
  FOREIGN KEY ("idTutor") REFERENCES "Tutor"("idTutor") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Vacina" ADD CONSTRAINT "Vacina_idAnimal_fkey"
  FOREIGN KEY ("idAnimal") REFERENCES "Animal"("idAnimal") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HistoricoMedico" ADD CONSTRAINT "HistoricoMedico_idAnimal_fkey"
  FOREIGN KEY ("idAnimal") REFERENCES "Animal"("idAnimal") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HistoricoMedico" ADD CONSTRAINT "HistoricoMedico_veterinarioId_fkey"
  FOREIGN KEY ("veterinarioId") REFERENCES "Veterinario"("idVeterinario") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_idAnimal_fkey"
  FOREIGN KEY ("idAnimal") REFERENCES "Animal"("idAnimal") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_idVeterinario_fkey"
  FOREIGN KEY ("idVeterinario") REFERENCES "Veterinario"("idVeterinario") ON UPDATE CASCADE;

ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_idClinica_fkey"
  FOREIGN KEY ("idClinica") REFERENCES "Clinica"("idClinica") ON UPDATE CASCADE;
