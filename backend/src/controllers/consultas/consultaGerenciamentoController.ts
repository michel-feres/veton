import { Response } from "express";
import { CustomRequest } from "../../middlewares/authMiddleware";
import { prisma } from "../../database";
import {
  buscarUsuarioConsulta,
  dataISOValida,
  detalhesConsulta,
  possuiAcessoConsulta,
} from "./consultaUtils";

// Alterar data ou horário de uma consulta
export const alterarHorarioConsulta = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return res.status(401).json({
        error: "Usuário não autenticado.",
      });
    }

    const usuario = await buscarUsuarioConsulta(idUsuario);

    if (!usuario || !usuario.tipoUsuario) {
      return res.status(403).json({
        error: "Usuário sem tipo de acesso definido.",
      });
    }

    const idConsulta = Number(req.params.id);

    if (!Number.isInteger(idConsulta) || idConsulta <= 0) {
      return res.status(400).json({
        error: "ID da consulta inválido.",
      });
    }

    const consulta = await prisma.consulta.findUnique({
      where: { idConsulta },
      include: {
        animal: {
          select: {
            idTutor: true,
          },
        },
      },
    });

    if (!consulta) {
      return res.status(404).json({
        error: "Consulta não encontrada.",
      });
    }

    if (
      !possuiAcessoConsulta(
        usuario.tipoUsuario,
        usuario.tutor?.idTutor,
        usuario.veterinario?.idVeterinario,
        consulta.animal.idTutor,
        consulta.idVeterinario
      )
    ) {
      return res.status(403).json({
        error: "Você não tem permissão para alterar esta consulta.",
      });
    }

    if (consulta.statusConsulta !== "Agendada") {
      return res.status(400).json({
        error: "Somente consultas agendadas podem ter o horário alterado.",
      });
    }

    const { dataConsulta, horaConsulta } = req.body ?? {};

    if (dataConsulta === undefined && horaConsulta === undefined) {
      return res.status(400).json({
        error: "Informe a nova data ou o novo horário da consulta.",
      });
    }

    const dadosAtualizacao: {
      dataConsulta?: Date;
      horaConsulta?: string;
    } = {};

    if (dataConsulta !== undefined) {
      if (typeof dataConsulta !== "string" || !dataISOValida(dataConsulta)) {
        return res.status(400).json({
          error: "Informe uma data válida no formato AAAA-MM-DD.",
        });
      }

      dadosAtualizacao.dataConsulta = new Date(`${dataConsulta}T00:00:00.000Z`);
    }

    if (horaConsulta !== undefined) {
      if (typeof horaConsulta !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(horaConsulta)) {
        return res.status(400).json({
          error: "Informe um horário válido no formato HH:mm.",
        });
      }

      dadosAtualizacao.horaConsulta = horaConsulta;
    }

    const consultaAtualizada = await prisma.consulta.update({
      where: { idConsulta },
      data: dadosAtualizacao,
      include: detalhesConsulta,
    });

    return res.status(200).json({
      message: "Consulta atualizada com sucesso!",
      consulta: consultaAtualizada,
    });
  } catch (error) {
    console.error("Erro ao alterar consulta:", error);

    return res.status(500).json({
      error: "Erro ao alterar consulta.",
    });
  }
};

// Cancelar consulta
export const cancelarConsulta = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return res.status(401).json({
        error: "Usuário não autenticado.",
      });
    }

    const usuario = await buscarUsuarioConsulta(idUsuario);

    if (!usuario || !usuario.tipoUsuario) {
      return res.status(403).json({
        error: "Usuário sem tipo de acesso definido.",
      });
    }

    const idConsulta = Number(req.params.id);

    if (!Number.isInteger(idConsulta) || idConsulta <= 0) {
      return res.status(400).json({
        error: "ID da consulta inválido.",
      });
    }

    const consulta = await prisma.consulta.findUnique({
      where: { idConsulta },
      include: {
        animal: {
          select: {
            idTutor: true,
          },
        },
      },
    });

    if (!consulta) {
      return res.status(404).json({
        error: "Consulta não encontrada.",
      });
    }

    if (
      !possuiAcessoConsulta(
        usuario.tipoUsuario,
        usuario.tutor?.idTutor,
        usuario.veterinario?.idVeterinario,
        consulta.animal.idTutor,
        consulta.idVeterinario
      )
    ) {
      return res.status(403).json({
        error: "Você não tem permissão para cancelar esta consulta.",
      });
    }

    if (consulta.statusConsulta === "Cancelada") {
      return res.status(400).json({
        error: "Esta consulta já foi cancelada.",
      });
    }

    if (consulta.statusConsulta === "Concluida") {
      return res.status(400).json({
        error: "Uma consulta concluída não pode ser cancelada.",
      });
    }

    const consultaCancelada = await prisma.consulta.update({
      where: { idConsulta },
      data: {
        statusConsulta: "Cancelada",
      },
    });

    return res.status(200).json({
      message: "Consulta cancelada com sucesso!",
      consulta: consultaCancelada,
    });
  } catch (error) {
    console.error("Erro ao cancelar consulta:", error);

    return res.status(500).json({
      error: "Erro ao cancelar consulta.",
    });
  }
};

// Excluir consulta
export const excluirConsulta = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return res.status(401).json({
        error: "Usuário não autenticado.",
      });
    }

    const usuario = await buscarUsuarioConsulta(idUsuario);

    if (!usuario || !usuario.tipoUsuario) {
      return res.status(403).json({
        error: "Usuário sem tipo de acesso definido.",
      });
    }

    const idConsulta = Number(req.params.id);

    if (!Number.isInteger(idConsulta) || idConsulta <= 0) {
      return res.status(400).json({
        error: "ID da consulta inválido.",
      });
    }

    const consulta = await prisma.consulta.findUnique({
      where: { idConsulta },
      include: {
        animal: {
          select: {
            idTutor: true,
          },
        },
      },
    });

    if (!consulta) {
      return res.status(404).json({
        error: "Consulta não encontrada.",
      });
    }

    if (
      !possuiAcessoConsulta(
        usuario.tipoUsuario,
        usuario.tutor?.idTutor,
        usuario.veterinario?.idVeterinario,
        consulta.animal.idTutor,
        consulta.idVeterinario
      )
    ) {
      return res.status(403).json({
        error: "Você não tem permissão para excluir esta consulta.",
      });
    }

    await prisma.consulta.delete({
      where: { idConsulta },
    });

    return res.status(200).json({
      message: "Consulta excluída permanentemente.",
      idConsulta,
    });
  } catch (error) {
    console.error("Erro ao excluir consulta:", error);

    return res.status(500).json({
      error: "Erro ao excluir consulta.",
    });
  }
};

// Reativar consulta cancelada
export const reativarConsulta = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return res.status(401).json({
        error: "Usuário não autenticado.",
      });
    }

    const usuario = await buscarUsuarioConsulta(idUsuario);

    if (!usuario || !usuario.tipoUsuario) {
      return res.status(403).json({
        error: "Usuário sem tipo de acesso definido.",
      });
    }

    const idConsulta = Number(req.params.id);

    if (!Number.isInteger(idConsulta) || idConsulta <= 0) {
      return res.status(400).json({
        error: "ID da consulta inválido.",
      });
    }

    const consulta = await prisma.consulta.findUnique({
      where: { idConsulta },
      include: {
        animal: {
          select: {
            idTutor: true,
          },
        },
      },
    });

    if (!consulta) {
      return res.status(404).json({
        error: "Consulta não encontrada.",
      });
    }

    if (
      !possuiAcessoConsulta(
        usuario.tipoUsuario,
        usuario.tutor?.idTutor,
        usuario.veterinario?.idVeterinario,
        consulta.animal.idTutor,
        consulta.idVeterinario
      )
    ) {
      return res.status(403).json({
        error: "Você não tem permissão para reativar esta consulta.",
      });
    }

    if (consulta.statusConsulta !== "Cancelada") {
      return res.status(400).json({
        error: "Somente consultas canceladas podem ser reativadas.",
      });
    }

    const conflito = await prisma.consulta.findFirst({
      where: {
        idConsulta: { not: idConsulta },
        idVeterinario: consulta.idVeterinario,
        dataConsulta: consulta.dataConsulta,
        horaConsulta: consulta.horaConsulta,
        statusConsulta: "Agendada",
      },
    });

    if (conflito) {
      return res.status(409).json({
        error:
          "Não foi possível reativar: o veterinário já possui uma consulta agendada nesse horário.",
      });
    }

    const consultaReativada = await prisma.consulta.update({
      where: { idConsulta },
      data: {
        statusConsulta: "Agendada",
      },
    });

    return res.status(200).json({
      message: "Consulta reativada com sucesso!",
      consulta: consultaReativada,
    });
  } catch (error) {
    console.error("Erro ao reativar consulta:", error);

    return res.status(500).json({
      error: "Erro ao reativar consulta.",
    });
  }
};
