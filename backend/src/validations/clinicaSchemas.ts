import { z } from "zod";

const textoObrigatorio = z.string().trim().min(1, "Este campo é obrigatório.");

export const cadastrarClinicaSchema = z
  .object({
    nomeClinica: textoObrigatorio,
    cnpj: textoObrigatorio,
    telefone: textoObrigatorio,
    endereco: textoObrigatorio,
  })
  .strict();

export const atualizarClinicaSchema = z
  .object({
    nomeClinica: textoObrigatorio,
    cnpj: textoObrigatorio,
    telefone: textoObrigatorio,
    endereco: textoObrigatorio,
  })
  .strict();

export const clinicaIdParamsSchema = z
  .object({
    id: z.string().regex(/^[1-9]\d*$/, "ID da clínica inválido."),
  })
  .strict();
