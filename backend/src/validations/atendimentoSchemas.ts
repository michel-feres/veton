import { z } from "zod";

const textoObrigatorio = z.string().trim().min(1, "Este campo é obrigatório.");

const dataValida = (valor: string): boolean => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const data = new Date(`${valor}T00:00:00.000Z`);

    return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
  }

  return /^\d{4}-\d{2}-\d{2}T/.test(valor) && !Number.isNaN(Date.parse(valor));
};

const dataOpcionalSchema = z
  .string()
  .refine(dataValida, "Informe uma data válida.")
  .nullable()
  .optional();

export const atualizarStatusAnimalSchema = z
  .object({
    status: z.enum(["Saudavel", "EmTratamento", "Emergencia"]),
  })
  .strict();

export const registrarVacinaSchema = z
  .object({
    nome: textoObrigatorio,
    fabricante: textoObrigatorio.nullable().optional(),
    dataAplicacao: dataOpcionalSchema,
    proximaDose: dataOpcionalSchema,
  })
  .strict();

export const adicionarHistoricoSchema = z
  .object({
    descricao: textoObrigatorio,
    tratamento: textoObrigatorio.nullable().optional(),
  })
  .strict();
