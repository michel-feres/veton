import { Response } from "express";
import { CustomRequest } from "../../middlewares/authMiddleware";
import { prisma } from "../../database";
import type { Prisma } from "../../generated/prisma/client";
import { buscarUsuarioConsulta, dataISOValida, detalhesConsulta } from "./consultaUtils";
import { respostaErro, respostaSucesso } from "../../utils/respostaApi";

// Marcar consulta
export const marcarConsulta = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return respostaErro(res, 401, "Usuário não autenticado.");
    }

    const usuario = await buscarUsuarioConsulta(idUsuario);

    if (!usuario || !usuario.tipoUsuario) {
      return respostaErro(res, 403, "Usuário sem tipo de acesso definido.");
    }

    const {
      dataConsulta,
      horaConsulta,
      observacoes,
      idAnimal: idAnimalBody,
      idVeterinario: idVeterinarioBody,
      idClinica: idClinicaBody,
    } = req.body ?? {};

    const idAnimal = Number(idAnimalBody);
    const idVeterinario = Number(idVeterinarioBody);
    const idClinica = Number(idClinicaBody);

    if (
      typeof dataConsulta !== "string" ||
      !dataISOValida(dataConsulta) ||
      typeof horaConsulta !== "string" ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(horaConsulta) ||
      !Number.isInteger(idAnimal) ||
      idAnimal <= 0 ||
      !Number.isInteger(idVeterinario) ||
      idVeterinario <= 0 ||
      !Number.isInteger(idClinica) ||
      idClinica <= 0
    ) {
      return respostaErro(res, 400, "Informe uma data, um horário e IDs válidos para a consulta.");
    }

    if (observacoes !== undefined && observacoes !== null && typeof observacoes !== "string") {
      return respostaErro(res, 400, "O campo observacoes deve ser um texto.");
    }

    const animal = await prisma.animal.findUnique({
      where: { idAnimal },
    });

    if (!animal) {
      return respostaErro(res, 404, "Animal não encontrado.");
    }

    const clinica = await prisma.clinica.findUnique({
      where: { idClinica },
    });

    if (!clinica) {
      return respostaErro(res, 404, "Clínica não encontrada.");
    }

    const veterinario = await prisma.veterinario.findUnique({
      where: { idVeterinario },
    });

    if (!veterinario) {
      return respostaErro(res, 404, "Veterinário não encontrado.");
    }

    if (usuario.tipoUsuario === "Tutor") {
      if (!usuario.tutor) {
        return respostaErro(res, 404, "Cadastro de tutor não encontrado.");
      }

      if (usuario.tutor.idTutor !== animal.idTutor) {
        return respostaErro(res, 403, "Você só pode agendar consultas para seus próprios animais.");
      }
    } else if (usuario.tipoUsuario === "Veterinario") {
      if (!usuario.veterinario) {
        return respostaErro(res, 404, "Cadastro de veterinário não encontrado.");
      }

      if (usuario.veterinario.idVeterinario !== idVeterinario) {
        return respostaErro(res, 403, "Você só pode agendar consultas para si mesmo.");
      }
    } else {
      return respostaErro(res, 403, "Permissão não autorizada.");
    }

    const consulta = await prisma.consulta.create({
      data: {
        dataConsulta: new Date(`${dataConsulta}T00:00:00.000Z`),
        horaConsulta,
        observacoes: observacoes ?? null,
        idAnimal,
        idVeterinario,
        idClinica,
      },
      include: detalhesConsulta,
    });

    return respostaSucesso(res, 201, "Consulta agendada com sucesso!", { consulta });
  } catch (error) {
    console.error("Erro ao agendar consulta:", error);

    return respostaErro(res, 500, "Erro ao agendar consulta.");
  }
};

// Listar consultas com filtros de data
export const listarConsultas = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return respostaErro(res, 401, "Usuário não autenticado.");
    }

    const usuario = await buscarUsuarioConsulta(idUsuario);

    if (!usuario || !usuario.tipoUsuario) {
      return respostaErro(res, 403, "Usuário sem tipo de acesso definido.");
    }

    const { dataInicio, dataFim } = req.query;

    if (
      (dataInicio !== undefined &&
        (typeof dataInicio !== "string" || !dataISOValida(dataInicio))) ||
      (dataFim !== undefined && (typeof dataFim !== "string" || !dataISOValida(dataFim)))
    ) {
      return respostaErro(res, 400, "Use datas válidas no formato AAAA-MM-DD.");
    }

    if (typeof dataInicio === "string" && typeof dataFim === "string" && dataInicio > dataFim) {
      return respostaErro(res, 400, "A data inicial não pode ser posterior à data final.");
    }

    const whereConsulta: Prisma.ConsultaWhereInput = {};
    const filtroData: { gte?: Date; lte?: Date } = {};

    if (typeof dataInicio === "string") {
      filtroData.gte = new Date(`${dataInicio}T00:00:00.000Z`);
    }

    if (typeof dataFim === "string") {
      filtroData.lte = new Date(`${dataFim}T23:59:59.999Z`);
    }

    if (Object.keys(filtroData).length > 0) {
      whereConsulta.dataConsulta = filtroData;
    }

    if (usuario.tipoUsuario === "Tutor") {
      if (!usuario.tutor) {
        return respostaErro(res, 404, "Cadastro de tutor não encontrado.");
      }

      whereConsulta.animal = {
        is: {
          idTutor: usuario.tutor.idTutor,
        },
      };
    } else if (usuario.tipoUsuario === "Veterinario") {
      if (!usuario.veterinario) {
        return respostaErro(res, 404, "Cadastro de veterinário não encontrado.");
      }

      whereConsulta.idVeterinario = usuario.veterinario.idVeterinario;
    } else {
      return respostaErro(res, 403, "Permissão não autorizada.");
    }

    const consultas = await prisma.consulta.findMany({
      where: whereConsulta,
      include: detalhesConsulta,
      orderBy: [{ dataConsulta: "asc" }, { horaConsulta: "asc" }],
    });

    return respostaSucesso(res, 200, "Consultas listadas com sucesso!", { consultas });
  } catch (error) {
    console.error("Erro ao listar consultas:", error);

    return respostaErro(res, 500, "Erro ao listar consultas.");
  }
};
