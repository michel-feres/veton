import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../database";

export interface CustomRequest extends Request {
  usuarioLogado?: {
    idUsuario: number;
    email: string;
    cargo: string;
  };
}

export const verificarToken = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Acesso negado. Token não fornecido.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        error: "Chave secreta do JWT não configurada no servidor!",
      });
    }

    const decoded = jwt.verify(token, secret) as {
      userId: number;
      email: string;
    };

    const usuario = await prisma.usuario.findUnique({
      where: {
        idUsuario: decoded.userId,
      },
      select: {
        idUsuario: true,
        email: true,
        tipoUsuario: true,
      },
    });

    if (!usuario) {
      return res.status(401).json({
        error: "Usuário não encontrado.",
      });
    }

    if (!usuario.tipoUsuario) {
      return res.status(403).json({
        error: "Cargo do usuário não informado.",
      });
    }

    req.usuarioLogado = {
      idUsuario: usuario.idUsuario,
      email: usuario.email,
      cargo: usuario.tipoUsuario,
    };

    next();
  } catch (error) {
    console.error("Erro na verificação do token:", error);

    return res.status(401).json({
      error: "Token inválido ou expirado.",
    });
  }
};