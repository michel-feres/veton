import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../database";

const SALT_ROUNDS = 10;

export const registrarUsuario = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, senha, nome } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return res.status(400).json({ error: "Este e-mail já está em uso." });
    }

    const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);

    const novoUsuario = await prisma.usuario.create({
      data: {
        email,
        nome,
        senha: hashedPassword,
      },
    });

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
      user: { id: novoUsuario.idUsuario, email: novoUsuario.email, nome: novoUsuario.nome },
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const loginUsuario = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Chave secreta do JWT não configurada no servidor!" });
    }

    const token = jwt.sign({ userId: usuario.idUsuario, email: usuario.email }, secret, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      message: "Login realizado com sucesso!",
      token,
      user: { id: usuario.idUsuario, email: usuario.email, name: usuario.nome },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};
