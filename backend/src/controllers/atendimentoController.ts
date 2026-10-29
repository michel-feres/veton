import { Response } from "express";
import { CustomRequest } from "../middlewares/authMiddleware";
import { prisma } from "../database";
import { StatusAnimal } from "../generated/prisma/client";
import { respostaErro, respostaSucesso } from "../utils/respostaApi";

const obterIdAnimal = (valor: string | string[] | undefined): number | null => {
  if (typeof valor !== "string") {
    return null;
  }

  const idAnimal = Number(valor);

  if (!Number.isInteger(idAnimal) || idAnimal <= 0) {
    return null;
  }

  return idAnimal;
};

export const atualizarStatusAnimal = async (req: CustomRequest, res: Response) => {
  try {
    const idAnimal = obterIdAnimal(req.params.idAnimal);
    const { status } = req.body;

    if (idAnimal === null) {
      return respostaErro(res, 400, "ID do animal inválido.");
    }

    const statusRecebido = typeof status === "string" ? status.trim() : "";

    if (!statusRecebido || !Object.values(StatusAnimal).includes(statusRecebido as StatusAnimal)) {
      return respostaErro(res, 400, "Status do animal inválido.");
    }

    const animalExiste = await prisma.animal.findUnique({
      where: { idAnimal },
    });

    if (!animalExiste) {
      return respostaErro(res, 404, "Animal não encontrado.");
    }

    const animalAtualizado = await prisma.animal.update({
      where: { idAnimal },
      data: { status: statusRecebido as StatusAnimal },
    });

    return respostaSucesso(res, 200, "Status do animal atualizado com sucesso!", {
      animal: animalAtualizado,
    });
  } catch {
    return respostaErro(res, 500, "Erro ao atualizar status do animal.");
  }
};

export const registrarVacina = async (req: CustomRequest, res: Response) => {
  try {
    const idAnimal = obterIdAnimal(req.params.idAnimal);
    const { nome, fabricante, dataAplicacao, proximaDose } = req.body;

    if (idAnimal === null) {
      return respostaErro(res, 400, "ID do animal inválido.");
    }

    if (typeof nome !== "string" || !nome.trim()) {
      return respostaErro(res, 400, "O nome da vacina é obrigatório.");
    }

    const animalExiste = await prisma.animal.findUnique({
      where: { idAnimal },
    });

    if (!animalExiste) {
      return respostaErro(res, 404, "Animal não encontrado.");
    }

    const dataAplicacaoDate = dataAplicacao ? new Date(dataAplicacao) : new Date();

    if (Number.isNaN(dataAplicacaoDate.getTime())) {
      return respostaErro(res, 400, "Data de aplicação inválida.");
    }

    let proximaDoseDate: Date | undefined;

    if (proximaDose) {
      proximaDoseDate = new Date(proximaDose);

      if (Number.isNaN(proximaDoseDate.getTime())) {
        return respostaErro(res, 400, "Data da próxima dose inválida.");
      }
    }

    const novaVacina = await prisma.vacina.create({
      data: {
        nome: nome.trim(),
        fabricante:
          typeof fabricante === "string" && fabricante.trim() ? fabricante.trim() : "Não informado",
        dataAplicacao: dataAplicacaoDate,
        ...(proximaDoseDate && { proximaDose: proximaDoseDate }),
        animal: {
          connect: { idAnimal },
        },
      },
    });

    return respostaSucesso(res, 201, "Vacina registrada com sucesso!", { vacina: novaVacina });
  } catch {
    return respostaErro(res, 500, "Erro ao registrar vacina.");
  }
};

export const adicionarHistorico = async (req: CustomRequest, res: Response) => {
  try {
    const idAnimal = obterIdAnimal(req.params.idAnimal);
    const { descricao, tratamento } = req.body;
    const usuarioId = req.usuarioLogado?.idUsuario;

    if (idAnimal === null) {
      return respostaErro(res, 400, "ID do animal inválido.");
    }

    if (typeof descricao !== "string" || !descricao.trim()) {
      return respostaErro(res, 400, "A descrição do prontuário é obrigatória.");
    }

    const animalExiste = await prisma.animal.findUnique({
      where: { idAnimal },
    });

    if (!animalExiste) {
      return respostaErro(res, 404, "Animal não encontrado.");
    }

    let idVeterinario: number | null = null;

    if (usuarioId !== undefined) {
      const veterinario = await prisma.veterinario.findUnique({
        where: { idUsuario: Number(usuarioId) },
      });

      if (veterinario) {
        idVeterinario = veterinario.idVeterinario;
      }
    }

    const novoHistorico = await prisma.historicoMedico.create({
      data: {
        descricao: descricao.trim(),
        tratamento: typeof tratamento === "string" && tratamento.trim() ? tratamento.trim() : null,
        data: new Date(),
        animal: {
          connect: { idAnimal },
        },
        ...(idVeterinario !== null && {
          veterinario: {
            connect: { idVeterinario },
          },
        }),
      },
    });

    return respostaSucesso(res, 201, "Prontuário adicionado ao histórico médico com sucesso!", {
      historico: novoHistorico,
    });
  } catch {
    return respostaErro(res, 500, "Erro ao adicionar histórico médico.");
  }
};

export const buscarFichaAnimal = async (req: CustomRequest, res: Response) => {
  try {
    const idAnimal = obterIdAnimal(req.params.idAnimal);

    if (idAnimal === null) {
      return respostaErro(res, 400, "ID do animal inválido.");
    }

    const animal = await prisma.animal.findUnique({
      where: { idAnimal },
      include: {
        vacinas: {
          orderBy: { dataAplicacao: "desc" },
        },
        historicoMedico: {
          orderBy: { data: "desc" },
        },
      },
    });

    if (!animal) {
      return respostaErro(res, 404, "Animal não encontrado.");
    }

    return respostaSucesso(res, 200, "Ficha do animal encontrada com sucesso!", { animal });
  } catch {
    return respostaErro(res, 500, "Erro ao buscar ficha do animal.");
  }
};
