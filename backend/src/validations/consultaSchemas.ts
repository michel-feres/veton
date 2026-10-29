import { z } from "zod";

const dataISOValida = (valor: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const data = new Date(`${valor}T00:00:00.000Z`);

  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
};

const dataSchema = z
  .string()
  .refine(dataISOValida, "Informe uma data válida no formato AAAA-MM-DD.");

const horaSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido no formato HH:mm.");

const idPositivo = z.coerce.number().int().positive();

export const marcarConsultaSchema = z
  .object({
    dataConsulta: dataSchema,
    horaConsulta: horaSchema,
    observacoes: z.string().nullable().optional(),
    idAnimal: idPositivo,
    idVeterinario: idPositivo,
    idClinica: idPositivo,
  })
  .strict();

export const listarConsultasQuerySchema = z
  .object({
    dataInicio: dataSchema.optional(),
    dataFim: dataSchema.optional(),
  })
  .strict()
  .superRefine((dados, contexto) => {
    if (dados.dataInicio && dados.dataFim && dados.dataInicio > dados.dataFim) {
      contexto.addIssue({
        code: "custom",
        path: ["dataFim"],
        message: "A data final não pode ser anterior à data inicial.",
      });
    }
  });

export const alterarHorarioConsultaSchema = z
  .object({
    dataConsulta: dataSchema.optional(),
    horaConsulta: horaSchema.optional(),
  })
  .strict()
  .refine((dados) => dados.dataConsulta !== undefined || dados.horaConsulta !== undefined, {
    message: "Informe a nova data ou o novo horário da consulta.",
  });

export const consultaIdParamsSchema = z
  .object({
    id: z.string().regex(/^[1-9]\d*$/, "ID da consulta inválido."),
  })
  .strict();
