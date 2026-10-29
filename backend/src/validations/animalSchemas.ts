import { z } from "zod";

const textoObrigatorio = z.string().trim().min(1, "Este campo é obrigatório.");

const idPositivo = z.coerce.number().int().positive();
const pesoPositivo = z.coerce.number().positive();

const dataISOValida = (valor: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const data = new Date(`${valor}T00:00:00.000Z`);

  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
};

const dataNascimentoSchema = z
  .string()
  .refine(dataISOValida, "Informe uma data válida no formato AAAA-MM-DD.");

const statusAnimalSchema = z.enum(["Saudavel", "EmTratamento", "Emergencia"]);

export const cadastrarAnimalSchema = z
  .object({
    nome: textoObrigatorio,
    especie: textoObrigatorio,
    raca: textoObrigatorio,
    sexo: textoObrigatorio,
    peso: pesoPositivo,
    cor: textoObrigatorio,
    dataNascimento: dataNascimentoSchema,
    status: statusAnimalSchema,
    idTutor: idPositivo,
  })
  .strict();

export const atualizarAnimalSchema = z
  .object({
    nome: textoObrigatorio.optional(),
    especie: textoObrigatorio.optional(),
    raca: textoObrigatorio.nullable().optional(),
    sexo: textoObrigatorio.nullable().optional(),
    peso: pesoPositivo.optional(),
    cor: textoObrigatorio.nullable().optional(),
    dataNascimento: dataNascimentoSchema.optional(),
    status: statusAnimalSchema.optional(),
    idTutor: idPositivo.optional(),
  })
  .strict()
  .refine((dados) => Object.values(dados).some((valor) => valor !== undefined), {
    message: "Informe pelo menos um campo para atualizar.",
  });

export const animalIdParamsSchema = z
  .object({
    id: z.string().regex(/^[1-9]\d*$/, "ID do animal inválido."),
  })
  .strict();

export const idAnimalParamsSchema = z
  .object({
    idAnimal: z.string().regex(/^[1-9]\d*$/, "ID do animal inválido."),
  })
  .strict();
