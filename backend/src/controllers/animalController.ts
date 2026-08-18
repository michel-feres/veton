import { CustomRequest } from "../middlewares/authMiddleware";
import { Response } from "express";
import { prisma } from "../database";

// Buscar tipo do usuário logado
const buscarTipoUsuario = async (idUsuario: number) => {
    const usuario = await prisma.usuario.findUnique({
        where: {
            idUsuario,
        },
        select: {
            tipoUsuario: true,
        },
    });

    return usuario?.tipoUsuario;
};

// Cadastrar animal
export const cadastrarAnimal = async (
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

        const tipoUsuario = await buscarTipoUsuario(idUsuario);

        if (tipoUsuario !== "Veterinario") {
            return res.status(403).json({
                error: "Apenas veterinários podem cadastrar animais.",
            });
        }

        const {
            nome,
            especie,
            raca,
            sexo,
            peso,
            cor,
            dataNascimento,
            status,
            idTutor,
        } = req.body;

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
            return res.status(400).json({
                error: "Todos os dados do animal são obrigatórios.",
            });
        }

        const tutor = await prisma.tutor.findUnique({
            where: {
                idTutor: Number(idTutor),
            },
        });

        if (!tutor) {
            return res.status(404).json({
                error: "Tutor não encontrado.",
            });
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

        return res.status(201).json({
            message: "Animal cadastrado com sucesso!",
            animal,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erro ao cadastrar animal.",
        });
    }
};

// Listar animais
export const listarAnimais = async (
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

        const tipoUsuario = await buscarTipoUsuario(idUsuario);

        // Veterinário pode visualizar todos os animais
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

            return res.status(200).json(animais);
        }

        // Tutor pode visualizar somente seus próprios animais
        if (tipoUsuario === "Tutor") {
            const tutor = await prisma.tutor.findUnique({
                where: {
                    idUsuario,
                },
            });

            if (!tutor) {
                return res.status(404).json({
                    error: "Tutor não encontrado.",
                });
            }

            const animais = await prisma.animal.findMany({
                where: {
                    idTutor: tutor.idTutor,
                },
            });

            return res.status(200).json(animais);
        }

        return res.status(403).json({
            error: "Permissão não autorizada.",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erro ao listar animais.",
        });
    }
};

// Buscar detalhes de um animal
export const buscarAnimal = async (
    req: CustomRequest,
    res: Response
): Promise<Response> => {
    try {
        const idUsuario = req.usuarioLogado?.idUsuario;
        const idAnimal = Number(req.params.id);

        if (!idUsuario) {
            return res.status(401).json({
                error: "Usuário não autenticado.",
            });
        }

        if (!idAnimal) {
            return res.status(400).json({
                error: "ID do animal inválido.",
            });
        }

        const tipoUsuario = await buscarTipoUsuario(idUsuario);

        const animal = await prisma.animal.findUnique({
            where: {
                idAnimal,
            },
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
                historicos: true,
                consultas: true,
            },
        });

        if (!animal) {
            return res.status(404).json({
                error: "Animal não encontrado.",
            });
        }

        // Tutor só pode visualizar seus próprios animais
        if (tipoUsuario === "Tutor") {
            const tutor = await prisma.tutor.findUnique({
                where: {
                    idUsuario,
                },
            });

            if (!tutor || animal.idTutor !== tutor.idTutor) {
                return res.status(403).json({
                    error: "Você não tem permissão para visualizar este animal.",
                });
            }
        }

        // Veterário pode visualizar qualquer animal
        if (tipoUsuario === "Veterinario") {
            return res.status(200).json(animal);
        }

        if (tipoUsuario !== "Tutor") {
            return res.status(403).json({
                error: "Permissão não autorizada.",
            });
        }

        return res.status(200).json(animal);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erro ao buscar animal.",
        });
    }
};

// Atualizar animal
export const atualizarAnimal = async (
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

        const tipoUsuario = await buscarTipoUsuario(idUsuario);

        if (tipoUsuario !== "Veterinario") {
            return res.status(403).json({
                error: "Apenas veterinários podem atualizar animais.",
            });
        }

        const idAnimal = Number(req.params.id);

        if (!idAnimal) {
            return res.status(400).json({
                error: "ID do animal inválido.",
            });
        }

        const animalExistente = await prisma.animal.findUnique({
            where: {
                idAnimal,
            },
        });

        if (!animalExistente) {
            return res.status(404).json({
                error: "Animal não encontrado.",
            });
        }

        const {
            nome,
            especie,
            raca,
            sexo,
            peso,
            cor,
            dataNascimento,
            status,
            idTutor,
        } = req.body;

        if (idTutor !== undefined) {
            const tutor = await prisma.tutor.findUnique({
                where: {
                    idTutor: Number(idTutor),
                },
            });

            if (!tutor) {
                return res.status(404).json({
                    error: "Tutor não encontrado.",
                });
            }
        }

        const animal = await prisma.animal.update({
            where: {
                idAnimal,
            },
            data: {
                nome,
                especie,
                raca,
                sexo,
                peso: peso !== undefined ? Number(peso) : undefined,
                cor,
                dataNascimento:
                    dataNascimento !== undefined
                        ? new Date(dataNascimento)
                        : undefined,
                status,
                idTutor: idTutor !== undefined ? Number(idTutor) : undefined,
            },
        });

        return res.status(200).json({
            message: "Animal atualizado com sucesso!",
            animal,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erro ao atualizar animal.",
        });
    }
};

// Deletar animal
export const deletarAnimal = async (
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

        const tipoUsuario = await buscarTipoUsuario(idUsuario);

        if (tipoUsuario !== "Veterinario") {
            return res.status(403).json({
                error: "Apenas veterinários podem excluir animais.",
            });
        }

        const idAnimal = Number(req.params.id);

        if (!idAnimal) {
            return res.status(400).json({
                error: "ID do animal inválido.",
            });
        }

        const animal = await prisma.animal.findUnique({
            where: {
                idAnimal,
            },
        });

        if (!animal) {
            return res.status(404).json({
                error: "Animal não encontrado.",
            });
        }

        await prisma.animal.delete({
            where: {
                idAnimal,
            },
        });

        return res.status(200).json({
            message: "Animal excluído com sucesso!",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erro ao excluir animal.",
        });
    }
};