import { Response } from "express";
import { CustomRequest } from "../middlewares/authMiddleware";
import { prisma } from "../database";

// Cadastrar clínica
export const cadastrarClinica = async (
    req: CustomRequest,
    res: Response
): Promise<Response> => {
    try {
        const { nomeClinica, cnpj, telefone, endereco } = req.body;

        if (!nomeClinica || !cnpj || !telefone || !endereco) {
            return res.status(400).json({
                error: "Todos os dados da clínica são obrigatórios.",
            });
        }

        const clinicaExistente = await prisma.clinica.findUnique({
            where: {
                cnpj,
            },
        });

        if (clinicaExistente) {
            return res.status(400).json({
                error: "Já existe uma clínica cadastrada com este CNPJ.",
            });
        }

        const clinica = await prisma.clinica.create({
            data: {
                nomeClinica,
                cnpj,
                telefone,
                endereco,
            },
        });

        return res.status(201).json({
            message: "Clínica cadastrada com sucesso!",
            clinica,
        });
    } catch (error) {
        console.error("Erro ao cadastrar clínica:", error);

        return res.status(500).json({
            error: "Erro ao cadastrar clínica.",
        });
    }
};

// Listar todas as clínicas
export const listarClinicas = async (
    req: CustomRequest,
    res: Response
): Promise<Response> => {
    try {
        const clinicas = await prisma.clinica.findMany();

        return res.status(200).json(clinicas);
    } catch (error) {
        console.error("Erro ao listar clínicas:", error);

        return res.status(500).json({
            error: "Erro ao listar clínicas.",
        });
    }
};

// Buscar clínica por ID
export const buscarClinica = async (
    req: CustomRequest,
    res: Response
): Promise<Response> => {
    try {
        const idClinica = Number(req.params.id);

        if (!idClinica) {
            return res.status(400).json({
                error: "ID da clínica inválido.",
            });
        }

        const clinica = await prisma.clinica.findUnique({
            where: {
                idClinica,
            },
        });

        if (!clinica) {
            return res.status(404).json({
                error: "Clínica não encontrada.",
            });
        }

        return res.status(200).json(clinica);
    } catch (error) {
        console.error("Erro ao buscar clínica:", error);

        return res.status(500).json({
            error: "Erro ao buscar clínica.",
        });
    }
};

// Atualizar clínica
export const atualizarClinica = async (
    req: CustomRequest,
    res: Response
): Promise<Response> => {
    try {
        const idClinica = Number(req.params.id);

        if (!idClinica) {
            return res.status(400).json({
                error: "ID da clínica inválido.",
            });
        }

        const clinicaExistente = await prisma.clinica.findUnique({
            where: {
                idClinica,
            },
        });

        if (!clinicaExistente) {
            return res.status(404).json({
                error: "Clínica não encontrada.",
            });
        }

        const { nomeClinica, cnpj, telefone, endereco } = req.body;

        if (!nomeClinica || !cnpj || !telefone || !endereco) {
            return res.status(400).json({
                error: "Todos os dados da clínica são obrigatórios.",
            });
        }

        const cnpjExistente = await prisma.clinica.findFirst({
            where: {
                cnpj,
                NOT: {
                    idClinica,
                },
            },
        });

        if (cnpjExistente) {
            return res.status(400).json({
                error: "Já existe outra clínica cadastrada com este CNPJ.",
            });
        }

        const clinica = await prisma.clinica.update({
            where: {
                idClinica,
            },
            data: {
                nomeClinica,
                cnpj,
                telefone,
                endereco,
            },
        });

        return res.status(200).json({
            message: "Clínica atualizada com sucesso!",
            clinica,
        });
    } catch (error) {
        console.error("Erro ao atualizar clínica:", error);

        return res.status(500).json({
            error: "Erro ao atualizar clínica.",
        });
    }
};

// Deletar clínica
export const deletarClinica = async (
    req: CustomRequest,
    res: Response
): Promise<Response> => {
    try {
        const idClinica = Number(req.params.id);

        if (!idClinica) {
            return res.status(400).json({
                error: "ID da clínica inválido.",
            });
        }

        const clinica = await prisma.clinica.findUnique({
            where: {
                idClinica,
            },
        });

        if (!clinica) {
            return res.status(404).json({
                error: "Clínica não encontrada.",
            });
        }

        await prisma.clinica.delete({
            where: {
                idClinica,
            },
        });

        return res.status(200).json({
            message: "Clínica excluída com sucesso!",
        });
    } catch (error) {
        console.error("Erro ao excluir clínica:", error);

        return res.status(500).json({
            error: "Erro ao excluir clínica.",
        });
    }
};