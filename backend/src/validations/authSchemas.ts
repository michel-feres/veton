import { z } from "zod";

const textoObrigatorio = z.string().trim().min(1, "Este campo é obrigatório.");

const emailValido = z.string().trim().email("Informe um e-mail válido.");

const senhaValida = z.string().refine((senha) => senha.trim().length > 0, {
  message: "A senha é obrigatória.",
});

export const registrarUsuarioSchema = z
  .object({
    nome: textoObrigatorio,
    email: emailValido,
    senha: senhaValida,
    tipoUsuario: z.enum(["Tutor", "Veterinario"]),

    rg: textoObrigatorio.optional(),
    cidade: textoObrigatorio.optional(),
    estado: textoObrigatorio.optional(),
    bairro: textoObrigatorio.optional(),
    numero: textoObrigatorio.optional(),
    cep: textoObrigatorio.optional(),

    situacao: z.enum(["Ativo", "Inativo"]).optional(),

    cpf: textoObrigatorio.optional(),
    crmv: textoObrigatorio.optional(),
    especialidade: textoObrigatorio.optional(),
  })
  .strict()
  .superRefine((dados, contexto) => {
    if (dados.tipoUsuario === "Tutor" && !dados.cpf) {
      contexto.addIssue({
        code: "custom",
        path: ["cpf"],
        message: "CPF é obrigatório para tutor.",
      });
    }

    if (dados.tipoUsuario === "Veterinario") {
      if (!dados.crmv) {
        contexto.addIssue({
          code: "custom",
          path: ["crmv"],
          message: "CRMV é obrigatório para veterinário.",
        });
      }

      if (!dados.especialidade) {
        contexto.addIssue({
          code: "custom",
          path: ["especialidade"],
          message: "Especialidade é obrigatória para veterinário.",
        });
      }
    }
  });

export const loginSchema = z
  .object({
    email: emailValido,
    senha: senhaValida,
  })
  .strict();

export const esqueciSenhaSchema = z
  .object({
    email: emailValido,
  })
  .strict();

export const redefinirSenhaSchema = z
  .object({
    email: emailValido,
    codigo: z.string().regex(/^\d{6}$/, "O código deve conter 6 dígitos."),
    novaSenha: senhaValida,
  })
  .strict();

export const atualizarPerfilSchema = z
  .object({
    nome: textoObrigatorio.optional(),
    email: emailValido.optional(),
    rg: textoObrigatorio.optional(),
    cidade: textoObrigatorio.optional(),
    estado: textoObrigatorio.optional(),
    bairro: textoObrigatorio.optional(),
    numero: textoObrigatorio.optional(),
    cep: textoObrigatorio.optional(),
  })
  .strict()
  .refine((dados) => Object.values(dados).some((valor) => valor !== undefined), {
    message: "Informe pelo menos um campo para atualizar.",
  });
