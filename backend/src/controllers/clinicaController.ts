import { Response } from "express";
import { CustomRequest } from "../middlewares/authMiddleware";
import { prisma } from "../database";
import { respostaErro, respostaSucesso } from "../utils/respostaApi";

const obterIdClinica = (valor: string | string[] | undefined): number | null => {
  if (typeof valor !== "string") {
    return null;
  }

  const idClinica = Number(valor);

  if (!Number.isInteger(idClinica) || idClinica <= 0) {
    return null;
  }

  return idClinica;
};

// Cadastrar clínica
export const cadastrarClinica = async (req: CustomRequest, res: Response) => {
  try {
    const { nomeClinica, cnpj, telefone, endereco } = req.body;

    if (
      typeof nomeClinica !== "string" ||
      !nomeClinica.trim() ||
      typeof cnpj !== "string" ||
      !cnpj.trim() ||
      typeof telefone !== "string" ||
      !telefone.trim() ||
      typeof endereco !== "string" ||
      !endereco.trim()
    ) {
      return respostaErro(res, 400, "Todos os dados da clínica são obrigatórios.");
    }

    const cnpjLimpo = cnpj.trim();

    const clinicaExistente = await prisma.clinica.findUnique({
      where: { cnpj: cnpjLimpo },
    });

    if (clinicaExistente) {
      return respostaErro(res, 409, "Já existe uma clínica cadastrada com este CNPJ.");
    }

    const clinica = await prisma.clinica.create({
      data: {
        nomeClinica: nomeClinica.trim(),
        cnpj: cnpjLimpo,
        telefone: telefone.trim(),
        endereco: endereco.trim(),
      },
    });

    return respostaSucesso(res, 201, "Clínica cadastrada com sucesso!", { clinica });
  } catch {
    return respostaErro(res, 500, "Erro ao cadastrar clínica.");
  }
};

// Listar todas as clínicas
export const listarClinicas = async (req: CustomRequest, res: Response) => {
  try {
    void req;

    const clinicas = await prisma.clinica.findMany();

    return respostaSucesso(res, 200, "Clínicas listadas com sucesso!", { clinicas });
  } catch {
    return respostaErro(res, 500, "Erro ao listar clínicas.");
  }
};

// Buscar clínica por ID
export const buscarClinica = async (req: CustomRequest, res: Response) => {
  try {
    const idClinica = obterIdClinica(req.params.id);

    if (idClinica === null) {
      return respostaErro(res, 400, "ID da clínica inválido.");
    }

    const clinica = await prisma.clinica.findUnique({
      where: { idClinica },
    });

    if (!clinica) {
      return respostaErro(res, 404, "Clínica não encontrada.");
    }

    return respostaSucesso(res, 200, "Clínica encontrada com sucesso!", { clinica });
  } catch {
    return respostaErro(res, 500, "Erro ao buscar clínica.");
  }
};

// Atualizar clínica
export const atualizarClinica = async (req: CustomRequest, res: Response) => {
  try {
    const idClinica = obterIdClinica(req.params.id);

    if (idClinica === null) {
      return respostaErro(res, 400, "ID da clínica inválido.");
    }

    const clinicaExistente = await prisma.clinica.findUnique({
      where: { idClinica },
    });

    if (!clinicaExistente) {
      return respostaErro(res, 404, "Clínica não encontrada.");
    }

    const { nomeClinica, cnpj, telefone, endereco } = req.body;

    if (
      typeof nomeClinica !== "string" ||
      !nomeClinica.trim() ||
      typeof cnpj !== "string" ||
      !cnpj.trim() ||
      typeof telefone !== "string" ||
      !telefone.trim() ||
      typeof endereco !== "string" ||
      !endereco.trim()
    ) {
      return respostaErro(res, 400, "Todos os dados da clínica são obrigatórios.");
    }

    const cnpjLimpo = cnpj.trim();

    const cnpjExistente = await prisma.clinica.findFirst({
      where: {
        cnpj: cnpjLimpo,
        NOT: { idClinica },
      },
    });

    if (cnpjExistente) {
      return respostaErro(res, 409, "Já existe outra clínica cadastrada com este CNPJ.");
    }

    const clinica = await prisma.clinica.update({
      where: { idClinica },
      data: {
        nomeClinica: nomeClinica.trim(),
        cnpj: cnpjLimpo,
        telefone: telefone.trim(),
        endereco: endereco.trim(),
      },
    });

    return respostaSucesso(res, 200, "Clínica atualizada com sucesso!", { clinica });
  } catch {
    return respostaErro(res, 500, "Erro ao atualizar clínica.");
  }
};

// Deletar clínica
export const deletarClinica = async (req: CustomRequest, res: Response) => {
  try {
    const idClinica = obterIdClinica(req.params.id);

    if (idClinica === null) {
      return respostaErro(res, 400, "ID da clínica inválido.");
    }

    const clinica = await prisma.clinica.findUnique({
      where: { idClinica },
    });

    if (!clinica) {
      return respostaErro(res, 404, "Clínica não encontrada.");
    }

    await prisma.clinica.delete({
      where: { idClinica },
    });

    return respostaSucesso(res, 200, "Clínica excluída com sucesso!");
  } catch {
    return respostaErro(res, 500, "Erro ao excluir clínica.");
  }
};
