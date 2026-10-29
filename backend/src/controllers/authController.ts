import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../database";
import { enviarCodigoRecuperacao } from "../utils/email";
import { respostaErro, respostaSucesso } from "../utils/respostaApi";

const SALT_ROUNDS = 10;

// Registrar usuário
export const registrarUsuario = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      email,
      senha,
      nome,
      rg,
      cidade,
      estado,
      bairro,
      numero,
      cep,
      situacao,
      tipoUsuario,
      cpf,
      crmv,
      especialidade,
    } = req.body;

    if (!email || !senha || !nome || !tipoUsuario) {
      return respostaErro(res, 400, "E-mail, senha, nome e tipo de usuário são obrigatórios.");
    }

    if (!["Tutor", "Veterinario"].includes(tipoUsuario)) {
      return respostaErro(res, 400, "Tipo de usuário inválido.");
    }

    if (tipoUsuario === "Tutor" && !cpf) {
      return respostaErro(res, 400, "CPF é obrigatório para tutor.");
    }

    if (tipoUsuario === "Veterinario" && (!crmv || !especialidade)) {
      return respostaErro(res, 400, "CRMV e especialidade são obrigatórios para veterinário.");
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return respostaErro(res, 400, "Este e-mail já está em uso.");
    }

    const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);

    const resultado = await prisma.$transaction(async (tx) => {
      const novoUsuario = await tx.usuario.create({
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

      if (tipoUsuario === "Tutor") {
        await tx.tutor.create({
          data: {
            cpf,
            idUsuario: novoUsuario.idUsuario,
          },
        });
      }

      if (tipoUsuario === "Veterinario") {
        await tx.veterinario.create({
          data: {
            crmv,
            especialidade,
            idUsuario: novoUsuario.idUsuario,
          },
        });
      }

      return novoUsuario;
    });

    return respostaSucesso(res, 201, "Usuário cadastrado com sucesso!", {
      user: {
        id: resultado.idUsuario,
        email: resultado.email,
        nome: resultado.nome,
        tipoUsuario: resultado.tipoUsuario,
      },
    });
  } catch (error) {
    console.error("Erro no registro:", error);

    return respostaErro(res, 500, "Erro interno do servidor.");
  }
};

// Login
export const loginUsuario = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return respostaErro(res, 400, "E-mail e senha são obrigatórios.");
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return respostaErro(res, 401, "Credenciais inválidas.");
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return respostaErro(res, 401, "Credenciais inválidas.");
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return respostaErro(res, 500, "Chave secreta do JWT não configurada no servidor.");
    }

    const token = jwt.sign(
      {
        userId: usuario.idUsuario,
        email: usuario.email,
      },
      secret,
      { expiresIn: "1d" }
    );

    return respostaSucesso(res, 200, "Login realizado com sucesso!", {
      token,
      user: {
        id: usuario.idUsuario,
        email: usuario.email,
        name: usuario.nome,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);

    return respostaErro(res, 500, "Erro interno do servidor.");
  }
};

// Senha esquecida
export const esqueciSenha = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email } = req.body;

    if (!email) {
      return respostaErro(res, 400, "Informe o e-mail.");
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return respostaErro(res, 404, "Usuário não encontrado.");
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

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

    await enviarCodigoRecuperacao(usuario.email, codigo);

    return respostaSucesso(res, 200, "Código de recuperação gerado com sucesso.");
  } catch (error) {
    console.error("Erro ao solicitar recuperação de senha:", error);

    return respostaErro(res, 500, "Erro interno do servidor.");
  }
};

// Redefinir senha
export const redefinirSenha = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, codigo, novaSenha } = req.body;

    if (!email || !codigo || !novaSenha) {
      return respostaErro(res, 400, "E-mail, código e nova senha são obrigatórios.");
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return respostaErro(res, 404, "Usuário não encontrado.");
    }

    if (
      usuario.codigoRecuperacao !== codigo ||
      !usuario.expiraCodigo ||
      usuario.expiraCodigo < new Date()
    ) {
      return respostaErro(res, 400, "Código inválido ou expirado.");
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

    return respostaSucesso(res, 200, "Senha redefinida com sucesso!");
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);

    return respostaErro(res, 500, "Erro interno do servidor.");
  }
};
