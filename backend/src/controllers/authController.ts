import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../database";

const SALT_ROUNDS = 10;

//Registro de usuário
export const registrarUsuario = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, senha, nome, rg, cidade, estado, bairro, numero, cep, situacao, tipoUsuario } =
      req.body;

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
        rg,
        cidade,
        estado,
        bairro,
        numero,
        cep,
        situacao,
        tipoUsuario,
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

//Login
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

//Senha esquecida
export const esqueciSenha = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Informe o e-mail.",
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return res.status(404).json({
        error: "Usuário não encontrado.",
      });
    }

    // Gera um código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Código expira em 15 minutos
    const expiraCodigo = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.usuario.update({
      where: {
        idUsuario: usuario.idUsuario,
      },
      data: {
        codigoRecuperacao: codigo,
        expiraCodigo,
      },
    });

    console.log("RECUPERAÇÃO DE SENHA");
    console.log("E-mail:", usuario.email);
    console.log("Código:", codigo);

    return res.status(200).json({
      message: "Código de recuperação gerado com sucesso.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro interno do servidor.",
    });
  }
};

//Redefini a senha
export const redefinirSenha = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, codigo, novaSenha } = req.body;

    if (!email || !codigo || !novaSenha) {
      return res.status(400).json({
        error: "E-mail, código e nova senha são obrigatórios.",
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return res.status(404).json({
        error: "Usuário não encontrado.",
      });
    }

    if (
      usuario.codigoRecuperacao !== codigo ||
      !usuario.expiraCodigo ||
      usuario.expiraCodigo < new Date()
    ) {
      return res.status(400).json({
        error: "Código inválido ou expirado.",
      });
    }

    const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);

    await prisma.usuario.update({
      where: {
        idUsuario: usuario.idUsuario,
      },
      data: {
        senha: senhaHash,
        codigoRecuperacao: null,
        expiraCodigo: null,
      },
    });

    return res.status(200).json({
      message: "Senha redefinida com sucesso!",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro interno do servidor.",
    });
  }
};
