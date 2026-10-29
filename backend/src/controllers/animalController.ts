import { Response } from "express";
import { CustomRequest } from "../middlewares/authMiddleware";
import { prisma } from "../database";
import { respostaErro, respostaSucesso } from "../utils/respostaApi";

// Buscar tipo do usuário logado
const buscarTipoUsuario = async (idUsuario: number) => {
  const usuario = await prisma.usuario.findUnique({
    where: { idUsuario },
    select: { tipoUsuario: true },
  });

  return usuario?.tipoUsuario;
};

// Cadastrar animal
export const cadastrarAnimal = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return respostaErro(res, 401, "Usuário não autenticado.");
    }

    const tipoUsuario = await buscarTipoUsuario(idUsuario);

    if (tipoUsuario !== "Veterinario") {
      return respostaErro(res, 403, "Apenas veterinários podem cadastrar animais.");
    }

    const { nome, especie, raca, sexo, peso, cor, dataNascimento, status, idTutor } = req.body;

    if (
      !nome ||
      !especie ||
      !raca ||
      !sexo ||
      peso === undefined ||
      !cor ||
      !dataNascimento ||
      !status ||
      !idTutor
    ) {
      return respostaErro(res, 400, "Todos os dados do animal são obrigatórios.");
    }

    const tutor = await prisma.tutor.findUnique({
      where: { idTutor: Number(idTutor) },
    });

    if (!tutor) {
      return respostaErro(res, 404, "Tutor não encontrado.");
    }

    const animal = await prisma.animal.create({
      data: {
        nome,
        especie,
        raca,
        sexo,
        peso: Number(peso),
        cor,
        dataNascimento: new Date(dataNascimento),
        status,
        idTutor: Number(idTutor),
      },
    });

    return respostaSucesso(res, 201, "Animal cadastrado com sucesso!", {
      animal,
    });
  } catch (error) {
    console.error(error);
    return respostaErro(res, 500, "Erro ao cadastrar animal.");
  }
};

// Listar animais
export const listarAnimais = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return respostaErro(res, 401, "Usuário não autenticado.");
    }

    const tipoUsuario = await buscarTipoUsuario(idUsuario);

    if (tipoUsuario === "Veterinario") {
      const animais = await prisma.animal.findMany({
        include: {
          tutor: {
            select: {
              idTutor: true,
              cpf: true,
              usuario: {
                select: {
                  idUsuario: true,
                  nome: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return respostaSucesso(res, 200, "Animais consultados com sucesso.", { animais });
    }

    if (tipoUsuario === "Tutor") {
      const tutor = await prisma.tutor.findUnique({
        where: { idUsuario },
      });

      if (!tutor) {
        return respostaErro(res, 404, "Tutor não encontrado.");
      }

      const animais = await prisma.animal.findMany({
        where: { idTutor: tutor.idTutor },
      });

      return respostaSucesso(res, 200, "Animais consultados com sucesso.", { animais });
    }

    return respostaErro(res, 403, "Permissão não autorizada.");
  } catch (error) {
    console.error(error);
    return respostaErro(res, 500, "Erro ao listar animais.");
  }
};

// Buscar detalhes de um animal
export const buscarAnimal = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;
    const idAnimal = Number(req.params.id);

    if (!idUsuario) {
      return respostaErro(res, 401, "Usuário não autenticado.");
    }

    if (!Number.isInteger(idAnimal) || idAnimal <= 0) {
      return respostaErro(res, 400, "ID do animal inválido.");
    }

    const tipoUsuario = await buscarTipoUsuario(idUsuario);

    const animal = await prisma.animal.findUnique({
      where: { idAnimal },
      include: {
        tutor: {
          select: {
            idTutor: true,
            cpf: true,
            usuario: {
              select: {
                idUsuario: true,
                nome: true,
                email: true,
              },
            },
          },
        },
        vacinas: true,
        historicoMedico: true,
        consultas: true,
      },
    });

    if (!animal) {
      return respostaErro(res, 404, "Animal não encontrado.");
    }

    if (tipoUsuario === "Tutor") {
      const tutor = await prisma.tutor.findUnique({
        where: { idUsuario },
      });

      if (!tutor || animal.idTutor !== tutor.idTutor) {
        return respostaErro(res, 403, "Você não tem permissão para visualizar este animal.");
      }
    } else if (tipoUsuario !== "Veterinario") {
      return respostaErro(res, 403, "Permissão não autorizada.");
    }

    return respostaSucesso(res, 200, "Animal consultado com sucesso.", { animal });
  } catch (error) {
    console.error(error);
    return respostaErro(res, 500, "Erro ao buscar animal.");
  }
};

// Atualizar animal
export const atualizarAnimal = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return respostaErro(res, 401, "Usuário não autenticado.");
    }

    const tipoUsuario = await buscarTipoUsuario(idUsuario);

    if (tipoUsuario !== "Veterinario") {
      return respostaErro(res, 403, "Apenas veterinários podem atualizar animais.");
    }

    const idAnimal = Number(req.params.id);

    if (!Number.isInteger(idAnimal) || idAnimal <= 0) {
      return respostaErro(res, 400, "ID do animal inválido.");
    }

    const animalExistente = await prisma.animal.findUnique({
      where: { idAnimal },
    });

    if (!animalExistente) {
      return respostaErro(res, 404, "Animal não encontrado.");
    }

    const { nome, especie, raca, sexo, peso, cor, dataNascimento, status, idTutor } = req.body;

    if (idTutor !== undefined) {
      const tutor = await prisma.tutor.findUnique({
        where: { idTutor: Number(idTutor) },
      });

      if (!tutor) {
        return respostaErro(res, 404, "Tutor não encontrado.");
      }
    }

    const animal = await prisma.animal.update({
      where: { idAnimal },
      data: {
        nome,
        especie,
        raca,
        sexo,
        peso: peso !== undefined ? Number(peso) : undefined,
        cor,
        dataNascimento: dataNascimento !== undefined ? new Date(dataNascimento) : undefined,
        status,
        idTutor: idTutor !== undefined ? Number(idTutor) : undefined,
      },
    });

    return respostaSucesso(res, 200, "Animal atualizado com sucesso!", { animal });
  } catch (error) {
    console.error(error);
    return respostaErro(res, 500, "Erro ao atualizar animal.");
  }
};

// Deletar animal
export const deletarAnimal = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const idUsuario = req.usuarioLogado?.idUsuario;

    if (!idUsuario) {
      return respostaErro(res, 401, "Usuário não autenticado.");
    }

    const tipoUsuario = await buscarTipoUsuario(idUsuario);

    if (tipoUsuario !== "Veterinario") {
      return respostaErro(res, 403, "Apenas veterinários podem excluir animais.");
    }

    const idAnimal = Number(req.params.id);

    if (!Number.isInteger(idAnimal) || idAnimal <= 0) {
      return respostaErro(res, 400, "ID do animal inválido.");
    }

    const animal = await prisma.animal.findUnique({
      where: { idAnimal },
    });

    if (!animal) {
      return respostaErro(res, 404, "Animal não encontrado.");
    }

    await prisma.animal.delete({
      where: { idAnimal },
    });

    return respostaSucesso(res, 200, "Animal excluído com sucesso!");
  } catch (error) {
    console.error(error);
    return respostaErro(res, 500, "Erro ao excluir animal.");
  }
};
