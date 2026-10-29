import { Response } from "express";
import { CustomRequest } from "../../middlewares/authMiddleware";
import { prisma } from "../../database";
import {
  buscarUsuarioConsulta,
  dataISOValida,
  detalhesConsulta,
  possuiAcessoConsulta,
} from "./consultaUtils";
import { respostaErro, respostaSucesso } from "../../utils/respostaApi";

const obterIdConsulta = (valor: string | string[] | undefined): number | null => {
  if (typeof valor !== "string") {
    return null;
  }

  const idConsulta = Number(valor);

  if (!Number.isInteger(idConsulta) || idConsulta <= 0) {
    return null;
  }

  return idConsulta;
};

// Alterar data ou horário de uma consulta
export const alterarHorarioConsulta = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return respostaErro(res, 401, "Usuário não autenticado.");
    }

    const usuario = await buscarUsuarioConsulta(idUsuario);

    if (!usuario || !usuario.tipoUsuario) {
      return respostaErro(res, 403, "Usuário sem tipo de acesso definido.");
    }

    const idConsulta = obterIdConsulta(req.params.id);

    if (idConsulta === null) {
      return respostaErro(res, 400, "ID da consulta inválido.");
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
      return respostaErro(res, 404, "Consulta não encontrada.");
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
      return respostaErro(res, 403, "Você não tem permissão para alterar esta consulta.");
    }

    if (consulta.statusConsulta !== "Agendada") {
      return respostaErro(res, 400, "Somente consultas agendadas podem ter o horário alterado.");
    }

    const { dataConsulta, horaConsulta } = req.body ?? {};

    if (dataConsulta === undefined && horaConsulta === undefined) {
      return respostaErro(res, 400, "Informe a nova data ou o novo horário da consulta.");
    }

    const dadosAtualizacao: {
      dataConsulta?: Date;
      horaConsulta?: string;
    } = {};

    if (dataConsulta !== undefined) {
      if (typeof dataConsulta !== "string" || !dataISOValida(dataConsulta)) {
        return respostaErro(res, 400, "Informe uma data válida no formato AAAA-MM-DD.");
      }

      dadosAtualizacao.dataConsulta = new Date(`${dataConsulta}T00:00:00.000Z`);
    }

    if (horaConsulta !== undefined) {
      if (typeof horaConsulta !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(horaConsulta)) {
        return respostaErro(res, 400, "Informe um horário válido no formato HH:mm.");
      }

      dadosAtualizacao.horaConsulta = horaConsulta;
    }

    const consultaAtualizada = await prisma.consulta.update({
      where: { idConsulta },
      data: dadosAtualizacao,
      include: detalhesConsulta,
    });

    return respostaSucesso(res, 200, "Consulta atualizada com sucesso!", {
      consulta: consultaAtualizada,
    });
  } catch (error) {
    console.error("Erro ao alterar consulta:", error);

    return respostaErro(res, 500, "Erro ao alterar consulta.");
  }
};

// Cancelar consulta
export const cancelarConsulta = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return respostaErro(res, 401, "Usuário não autenticado.");
    }

    const usuario = await buscarUsuarioConsulta(idUsuario);

    if (!usuario || !usuario.tipoUsuario) {
      return respostaErro(res, 403, "Usuário sem tipo de acesso definido.");
    }

    const idConsulta = obterIdConsulta(req.params.id);

    if (idConsulta === null) {
      return respostaErro(res, 400, "ID da consulta inválido.");
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
      return respostaErro(res, 404, "Consulta não encontrada.");
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
      return respostaErro(res, 403, "Você não tem permissão para cancelar esta consulta.");
    }

    if (consulta.statusConsulta === "Cancelada") {
      return respostaErro(res, 400, "Esta consulta já foi cancelada.");
    }

    if (consulta.statusConsulta === "Concluida") {
      return respostaErro(res, 400, "Uma consulta concluída não pode ser cancelada.");
    }

    const consultaCancelada = await prisma.consulta.update({
      where: { idConsulta },
      data: {
        statusConsulta: "Cancelada",
      },
      include: detalhesConsulta,
    });

    return respostaSucesso(res, 200, "Consulta cancelada com sucesso!", {
      consulta: consultaCancelada,
    });
  } catch (error) {
    console.error("Erro ao cancelar consulta:", error);

    return respostaErro(res, 500, "Erro ao cancelar consulta.");
  }
};

// Excluir consulta
export const excluirConsulta = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return respostaErro(res, 401, "Usuário não autenticado.");
    }

    const usuario = await buscarUsuarioConsulta(idUsuario);

    if (!usuario || !usuario.tipoUsuario) {
      return respostaErro(res, 403, "Usuário sem tipo de acesso definido.");
    }

    const idConsulta = obterIdConsulta(req.params.id);

    if (idConsulta === null) {
      return respostaErro(res, 400, "ID da consulta inválido.");
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
      return respostaErro(res, 404, "Consulta não encontrada.");
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
      return respostaErro(res, 403, "Você não tem permissão para excluir esta consulta.");
    }

    await prisma.consulta.delete({
      where: { idConsulta },
    });

    return respostaSucesso(res, 200, "Consulta excluída permanentemente.", { idConsulta });
  } catch (error) {
    console.error("Erro ao excluir consulta:", error);

    return respostaErro(res, 500, "Erro ao excluir consulta.");
  }
};

// Reativar consulta cancelada
export const reativarConsulta = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return respostaErro(res, 401, "Usuário não autenticado.");
    }

    const usuario = await buscarUsuarioConsulta(idUsuario);

    if (!usuario || !usuario.tipoUsuario) {
      return respostaErro(res, 403, "Usuário sem tipo de acesso definido.");
    }

    const idConsulta = obterIdConsulta(req.params.id);

    if (idConsulta === null) {
      return respostaErro(res, 400, "ID da consulta inválido.");
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
      return respostaErro(res, 404, "Consulta não encontrada.");
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
      return respostaErro(res, 403, "Você não tem permissão para reativar esta consulta.");
    }

    if (consulta.statusConsulta !== "Cancelada") {
      return respostaErro(res, 400, "Somente consultas canceladas podem ser reativadas.");
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
      return respostaErro(
        res,
        409,
        "Não foi possível reativar: o veterinário já possui uma consulta agendada nesse horário."
      );
    }

    const consultaReativada = await prisma.consulta.update({
      where: { idConsulta },
      data: {
        statusConsulta: "Agendada",
      },
      include: detalhesConsulta,
    });

    return respostaSucesso(res, 200, "Consulta reativada com sucesso!", {
      consulta: consultaReativada,
    });
  } catch (error) {
    console.error("Erro ao reativar consulta:", error);

    return respostaErro(res, 500, "Erro ao reativar consulta.");
  }
};
