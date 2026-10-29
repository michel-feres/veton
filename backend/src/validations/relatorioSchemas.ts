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

const formatoSchema = z.enum(["pdf", "excel"]);

const validarOrdemDatas = (
  dados: { dataInicio?: string; dataFim?: string },
  contexto: z.RefinementCtx
) => {
  if (dados.dataInicio && dados.dataFim && dados.dataInicio > dados.dataFim) {
    contexto.addIssue({
      code: "custom",
      path: ["dataFim"],
      message: "A data final não pode ser anterior à data inicial.",
    });
  }
};

export const periodoRelatorioQuerySchema = z
  .object({
    dataInicio: dataSchema.optional(),
    dataFim: dataSchema.optional(),
  })
  .strict()
  .superRefine(validarOrdemDatas);

export const exportarRelatorioConsultasQuerySchema = z
  .object({
    formato: formatoSchema,
    dataInicio: dataSchema.optional(),
    dataFim: dataSchema.optional(),
  })
  .strict()
  .superRefine(validarOrdemDatas);

export const exportarRelatorioAnimaisQuerySchema = z
  .object({
    formato: formatoSchema,
  })
  .strict();
