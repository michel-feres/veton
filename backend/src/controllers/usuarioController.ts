import { CustomRequest } from "../middlewares/authMiddleware";
import { Response } from "express";
import { prisma } from "../database";

//Buscar perfil de usuario
export const buscarPerfil = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return res.status(401).json({
        error: "Usuário não autenticado.",
      });
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
      return res.status(404).json({
        error: "Usuário não encontrado.",
      });
    }

    return res.status(200).json(usuario);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro interno do servidor.",
    });
  }
};

// Atualizar perfil de usuário
export const atualizarPerfil = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return res.status(401).json({
        error: "Usuário não autenticado.",
      });
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

    return res.status(200).json({
      message: "Perfil atualizado com sucesso!",
      usuario,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro ao atualizar perfil.",
    });
  }
};

// Deletar perfil de usuário
export const deletarPerfil = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return res.status(401).json({
        error: "Usuário não autenticado.",
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        idUsuario,
      },
    });

    if (!usuario) {
      return res.status(404).json({
        error: "Usuário não encontrado.",
      });
    }

    await prisma.usuario.delete({
      where: {
        idUsuario,
      },
    });

    return res.status(200).json({
      message: "Conta excluída com sucesso!",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro ao excluir conta.",
    });
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

    return res.status(200).json({
      consultasHoje,
      vacinasHoje,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro ao buscar lembretes.",
    });
  }
};
