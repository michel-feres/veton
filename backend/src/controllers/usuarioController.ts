import { CustomRequest } from "../middlewares/authMiddleware";
import { Response } from "express";
import { prisma } from "../database";
import { respostaSucesso, respostaErro } from "../utils/respostaApi";

//Buscar perfil de usuario
export const buscarPerfil = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return respostaErro(res, 401, "Usuário não autenticado.");
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        idUsuario,
      },
      select: {
        idUsuario: true,
        nome: true,
        email: true,
        rg: true,
        cidade: true,
        estado: true,
        bairro: true,
        numero: true,
        cep: true,
        situacao: true,
        tipoUsuario: true,
      },
    });

    if (!usuario) {
      return respostaErro(res, 404, "Usuário não encontrado.");
    }

    return respostaSucesso(res, 200, "Perfil consultado com sucesso.", { usuario });
  } catch (error) {
    console.error(error);

    return respostaErro(res, 500, "Erro interno do servidor.");
  }
};

// Atualizar perfil de usuário
export const atualizarPerfil = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return respostaErro(res, 401, "Usuário não autenticado.");
    }

    const { nome, email, rg, cidade, estado, bairro, numero, cep } = req.body;

    const usuario = await prisma.usuario.update({
      where: {
        idUsuario,
      },
      data: {
        nome,
        email,
        rg,
        cidade,
        estado,
        bairro,
        numero,
        cep,
      },
    });

    return respostaSucesso(res, 200, "Perfil atualizado com sucesso!", { usuario });
  } catch (error) {
    console.error(error);

    return respostaErro(res, 500, "Erro ao atualizar perfil.");
  }
};

// Deletar perfil de usuário
export const deletarPerfil = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return respostaErro(res, 401, "Usuário não autenticado.");
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        idUsuario,
      },
    });

    if (!usuario) {
      return respostaErro(res, 404, "Usuário não encontrado.");
    }

    await prisma.usuario.delete({
      where: {
        idUsuario,
      },
    });

    return respostaSucesso(res, 200, "Conta excluída com sucesso!");
  } catch (error) {
    console.error(error);

    return respostaErro(res, 500, "Erro ao excluir conta.");
  }
};

// Buscar lembretes do dia
export const buscarLembretes = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const hoje = new Date();

    const inicioDia = new Date(hoje);
    inicioDia.setHours(0, 0, 0, 0);

    const fimDia = new Date(hoje);
    fimDia.setHours(23, 59, 59, 999);

    const consultasHoje = await prisma.consulta.findMany({
      where: {
        dataConsulta: {
          gte: inicioDia,
          lte: fimDia,
        },
      },
      include: {
        animal: {
          select: {
            nome: true,
          },
        },
        veterinario: {
          select: {
            crmv: true,
          },
        },
        clinica: {
          select: {
            nomeClinica: true,
          },
        },
      },
    });

    const vacinasHoje = await prisma.vacina.findMany({
      where: {
        proximaDose: {
          gte: inicioDia,
          lte: fimDia,
        },
      },
      include: {
        animal: {
          select: {
            nome: true,
            especie: true,
            raca: true,
          },
        },
      },
    });

    return respostaSucesso(res, 200, "Lembretes consultados com sucesso.", {
      consultasHoje,
      vacinasHoje,
    });
  } catch (error) {
    console.error(error);

    return respostaErro(res, 500, "Erro ao buscar lembretes.");
  }
};
