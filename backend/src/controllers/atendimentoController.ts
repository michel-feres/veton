import { Response } from "express";
import { CustomRequest } from "../middlewares/authMiddleware";
import { prisma } from "../database";

export const atualizarStatusAnimal = async (req: CustomRequest, res: Response) => {
    try {
        const { idAnimal } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: "O campo 'status' é obrigatório." });
        }

        const animalAtualizado = await prisma.animal.update({
            where: { idAnimal: Number(idAnimal) },
            data: { status },
        });

        return res.status(200).json({
            message: "Status do animal atualizado com sucesso!",
            animal: animalAtualizado,
        });
    } catch (_error) {
        return res.status(500).json({ error: "Erro ao atualizar status do animal." });
    }
};

export const registrarVacina = async (req: CustomRequest, res: Response) => {
    try {
        const { idAnimal } = req.params;
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
                    connect: { idAnimal: Number(idAnimal) }
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
        const { idAnimal } = req.params;
        const { descricao, tratamento } = req.body;
        const usuarioId = req.usuarioLogado?.idUsuario;

        if (!descricao) {
            return res.status(400).json({ error: "A descrição do prontuário é obrigatória." });
        }

        const animalExiste = await prisma.animal.findUnique({
            where: { idAnimal: Number(idAnimal) },
        });

        if (!animalExiste) {
            return res.status(404).json({ error: `Animal com ID ${idAnimal} não foi encontrado.` });
        }

        let idVeterinario: number | null = null;
        if (usuarioId) {
            const vet = await prisma.veterinario.findUnique({
                where: { idUsuario: Number(usuarioId) },
            });
            if (vet) {
                idVeterinario = vet.idVeterinario;
            }
        }

        const novoHistorico = await prisma.historicoMedico.create({
            data: {
                descricao,
                tratamento: tratamento || null,
                data: new Date(),
                animal: {
                    connect: { idAnimal: Number(idAnimal) },
                },
                ...(idVeterinario && {
                    veterinario: { connect: { idVeterinario } },
                }),
            },
        });

        return res.status(201).json({
            message: "Prontuário adicionado ao histórico médico com sucesso!",
            historico: novoHistorico,
        });
    } catch (error) {
        console.error("Erro detalhado no Prisma:", error);
        return res.status(500).json({ error: "Erro ao adicionar histórico médico." });
    }
};

export const buscarFichaAnimal = async (req: CustomRequest, res: Response) => {
    try {
        const { idAnimal } = req.params;

        const animal = await prisma.animal.findUnique({
            where: { idAnimal: Number(idAnimal) },
            include: {
                vacinas: { orderBy: { dataAplicacao: "desc" } },
                historicoMedico: { orderBy: { data: "desc" } },
            },
        });

        if (!animal) {
            return res.status(404).json({ error: "Animal não encontrado." });
        }

        return res.status(200).json(animal);
    } catch (_error) {
        return res.status(500).json({ error: "Erro ao buscar ficha do animal." });
    }
};