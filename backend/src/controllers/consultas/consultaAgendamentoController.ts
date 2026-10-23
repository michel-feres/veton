import { Response } from "express";
import { CustomRequest } from "../../middlewares/authMiddleware";
import { prisma } from "../../database";
import type { Prisma } from "../../generated/prisma/client";
import { buscarUsuarioConsulta, dataISOValida, detalhesConsulta } from "./consultaUtils";

// Marcar consulta
export const marcarConsulta = async (req: CustomRequest, res: Response): Promise<Response> => {
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
      return res.status(400).json({
        error: "Informe uma data, um horário e IDs válidos para a consulta.",
      });
    }

    if (observacoes !== undefined && observacoes !== null && typeof observacoes !== "string") {
      return res.status(400).json({
        error: "O campo observacoes deve ser um texto.",
      });
    }

    const animal = await prisma.animal.findUnique({
      where: { idAnimal },
    });

    if (!animal) {
      return res.status(404).json({
        error: "Animal não encontrado.",
      });
    }

    const clinica = await prisma.clinica.findUnique({
      where: { idClinica },
    });

    if (!clinica) {
      return res.status(404).json({
        error: "Clínica não encontrada.",
      });
    }

    const veterinario = await prisma.veterinario.findUnique({
      where: { idVeterinario },
    });

    if (!veterinario) {
      return res.status(404).json({
        error: "Veterinário não encontrado.",
      });
    }

    if (usuario.tipoUsuario === "Tutor") {
      if (usuario.tutor?.idTutor !== animal.idTutor) {
        return res.status(403).json({
          error: "Você só pode agendar consultas para seus próprios animais.",
        });
      }
    } else if (usuario.tipoUsuario === "Veterinario") {
      if (usuario.veterinario?.idVeterinario !== idVeterinario) {
        return res.status(403).json({
          error: "Você só pode agendar consultas para si mesmo.",
        });
      }
    } else {
      return res.status(403).json({
        error: "Permissão não autorizada.",
      });
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

    return res.status(201).json({
      message: "Consulta agendada com sucesso!",
      consulta,
    });
  } catch (error) {
    console.error("Erro ao agendar consulta:", error);

    return res.status(500).json({
      error: "Erro ao agendar consulta.",
    });
  }
};

// Listar consultas com filtros de data
export const listarConsultas = async (req: CustomRequest, res: Response): Promise<Response> => {
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

    const { dataInicio, dataFim } = req.query;

    if (
      (dataInicio !== undefined &&
        (typeof dataInicio !== "string" || !dataISOValida(dataInicio))) ||
      (dataFim !== undefined && (typeof dataFim !== "string" || !dataISOValida(dataFim)))
    ) {
      return res.status(400).json({
        error: "Use datas válidas no formato AAAA-MM-DD.",
      });
    }

    if (typeof dataInicio === "string" && typeof dataFim === "string" && dataInicio > dataFim) {
      return res.status(400).json({
        error: "A data inicial não pode ser posterior à data final.",
      });
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
        return res.status(404).json({
          error: "Cadastro de tutor não encontrado.",
        });
      }

      whereConsulta.animal = {
        is: {
          idTutor: usuario.tutor.idTutor,
        },
      };
    } else if (usuario.tipoUsuario === "Veterinario") {
      if (!usuario.veterinario) {
        return res.status(404).json({
          error: "Cadastro de veterinário não encontrado.",
        });
      }

      whereConsulta.idVeterinario = usuario.veterinario.idVeterinario;
    } else {
      return res.status(403).json({
        error: "Permissão não autorizada.",
      });
    }

    const consultas = await prisma.consulta.findMany({
      where: whereConsulta,
      include: detalhesConsulta,
      orderBy: [{ dataConsulta: "asc" }, { horaConsulta: "asc" }],
    });

    return res.status(200).json(consultas);
  } catch (error) {
    console.error("Erro ao listar consultas:", error);

    return res.status(500).json({
      error: "Erro ao listar consultas.",
    });
  }
};
