import { Response } from "express";
import { CustomRequest } from "../middlewares/authMiddleware";
import { prisma } from "../database";

export const atualizarStatusPet = async (req: CustomRequest, res: Response) => {
    try {
        const { idPet } = req.params;
        const { status } = req.body; // ex: "EM_ATENDIMENTO" ou "SAUDAVEL"

        if (!status) {
            return res.status(400).json({ error: "O campo 'status' é obrigatório." });
        }

        const petAtualizado = await prisma.pet.update({
            where: { idPet: Number(idPet) },
            data: { status },
        });

        return res.status(200).json({
            message: "Status do pet atualizado com sucesso!",
            pet: petAtualizado,
        });
    } catch (_error) {
        return res.status(500).json({ error: "Erro ao atualizar status do pet." });
    }
};

export const registrarVacina = async (req: CustomRequest, res: Response) => {
    try {
        const { idPet } = req.params;
        const { nome, fabricante, dataAplicacao, proximaDose } = req.body;

        if (!nome) {
            return res.status(400).json({ error: "O nome da vacina é obrigatório." });
        }

        const novaVacina = await prisma.vacina.create({
            data: {
                nome,
                fabricante: fabricante || "Não informado",
                dataAplicacao: dataAplicacao ? new Date(dataAplicacao) : new Date(),
                proximaDose: proximaDose ? new Date(proximaDose) : undefined,
                animal: {
                    connect: { idAnimal: Number(idPet) }
                },
            },
        });

        return res.status(201).json({
            message: "Vacina registrada com sucesso!",
            vacina: novaVacina,
        });
    } catch (_error) {
        return res.status(500).json({ error: "Erro ao registrar vacina." });
    }
};

export const adicionarHistorico = async (req: CustomRequest, res: Response) => {
    try {
        const { idPet } = req.params;
        const { descricao } = req.body;
        const veterinarioId = req.usuarioLogado?.idUsuario;

        if (!descricao) {
            return res.status(400).json({ error: "A descrição do prontuário é obrigatória." });
        }

        // Garante que o Pet existe antes de tentar conectar
        const petExiste = await prisma.pet.findUnique({
            where: { idPet: Number(idPet) },
        });

        if (!petExiste) {
            return res.status(404).json({ error: `Pet com ID ${idPet} não foi encontrado.` });
        }

        const novoHistorico = await prisma.historicoClinico.create({
            data: {
                descricao,
                pet: {
                    connect: { idPet: Number(idPet) },
                },
                veterinarioId: veterinarioId ? Number(veterinarioId) : null,
            },
        });

        return res.status(201).json({
            message: "Prontuário adicionado ao histórico clínico com sucesso!",
            historico: novoHistorico,
        });
    } catch (error) {
        console.error("Erro detalhado no Prisma:", error);
        return res.status(500).json({ error: "Erro ao adicionar histórico clínico." });
    }
};

export const buscarFichaPet = async (req: CustomRequest, res: Response) => {
    try {
        const { idPet } = req.params;

        const pet = await prisma.pet.findUnique({
            where: { idPet: Number(idPet) },
            include: {
                vacinas: { orderBy: { dataAplicacao: "desc" } },
                historicoClinico: { orderBy: { data: "desc" } },
            },
        });

        if (!pet) {
            return res.status(404).json({ error: "Pet não encontrado." });
        }

        return res.status(200).json(pet);
    } catch (_error) {
        return res.status(500).json({ error: "Erro ao buscar ficha do pet." });
    }
};