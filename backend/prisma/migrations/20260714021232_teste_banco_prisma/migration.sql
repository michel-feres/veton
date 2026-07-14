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
    "rg" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "situacao" "StatusUsuario" NOT NULL,
    "tipoUsuario" "TipoUsuario" NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("idUsuario")
);

-- CreateTable
CREATE TABLE "Tutor" (
    "idTutor" SERIAL NOT NULL,
    "cpf" TEXT NOT NULL,
    "idUsuario" INTEGER NOT NULL,

    CONSTRAINT "Tutor_pkey" PRIMARY KEY ("idTutor")
);

-- CreateTable
CREATE TABLE "Veterinario" (
    "idVeterinario" SERIAL NOT NULL,
    "crmv" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "idUsuario" INTEGER NOT NULL,

    CONSTRAINT "Veterinario_pkey" PRIMARY KEY ("idVeterinario")
);

-- CreateTable
CREATE TABLE "Clinica" (
    "idClinica" SERIAL NOT NULL,
    "nomeClinica" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,

    CONSTRAINT "Clinica_pkey" PRIMARY KEY ("idClinica")
);

-- CreateTable
CREATE TABLE "Animal" (
    "idAnimal" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "especie" TEXT NOT NULL,
    "raca" TEXT NOT NULL,
    "sexo" TEXT NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL,
    "cor" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "status" "StatusAnimal" NOT NULL,
    "idTutor" INTEGER NOT NULL,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("idAnimal")
);

-- CreateTable
CREATE TABLE "Vacina" (
    "idVacina" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "fabricante" TEXT NOT NULL,
    "dataAplicacao" TIMESTAMP(3) NOT NULL,
    "proximaDose" TIMESTAMP(3) NOT NULL,
    "idAnimal" INTEGER NOT NULL,

    CONSTRAINT "Vacina_pkey" PRIMARY KEY ("idVacina")
);

-- CreateTable
CREATE TABLE "HistoricoMedico" (
    "idHistorico" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataRegistro" TIMESTAMP(3) NOT NULL,
    "tratamento" TEXT NOT NULL,
    "idAnimal" INTEGER NOT NULL,

    CONSTRAINT "HistoricoMedico_pkey" PRIMARY KEY ("idHistorico")
);

-- CreateTable
CREATE TABLE "Consulta" (
    "idConsulta" SERIAL NOT NULL,
    "dataConsulta" TIMESTAMP(3) NOT NULL,
    "horaConsulta" TEXT NOT NULL,
    "observacoes" TEXT NOT NULL,
    "statusConsulta" "StatusConsulta" NOT NULL,
    "idAnimal" INTEGER NOT NULL,
    "idVeterinario" INTEGER NOT NULL,
    "idClinica" INTEGER NOT NULL,

    CONSTRAINT "Consulta_pkey" PRIMARY KEY ("idConsulta")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_cpf_key" ON "Tutor"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_idUsuario_key" ON "Tutor"("idUsuario");

-- CreateIndex
CREATE UNIQUE INDEX "Veterinario_crmv_key" ON "Veterinario"("crmv");

-- CreateIndex
CREATE UNIQUE INDEX "Veterinario_idUsuario_key" ON "Veterinario"("idUsuario");

-- CreateIndex
CREATE UNIQUE INDEX "Clinica_cnpj_key" ON "Clinica"("cnpj");

-- AddForeignKey
ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("idUsuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Veterinario" ADD CONSTRAINT "Veterinario_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("idUsuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_idTutor_fkey" FOREIGN KEY ("idTutor") REFERENCES "Tutor"("idTutor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacina" ADD CONSTRAINT "Vacina_idAnimal_fkey" FOREIGN KEY ("idAnimal") REFERENCES "Animal"("idAnimal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoMedico" ADD CONSTRAINT "HistoricoMedico_idAnimal_fkey" FOREIGN KEY ("idAnimal") REFERENCES "Animal"("idAnimal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_idAnimal_fkey" FOREIGN KEY ("idAnimal") REFERENCES "Animal"("idAnimal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_idVeterinario_fkey" FOREIGN KEY ("idVeterinario") REFERENCES "Veterinario"("idVeterinario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_idClinica_fkey" FOREIGN KEY ("idClinica") REFERENCES "Clinica"("idClinica") ON DELETE RESTRICT ON UPDATE CASCADE;
