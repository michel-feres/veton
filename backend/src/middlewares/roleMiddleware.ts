import { Response, NextFunction } from "express";
import { CustomRequest } from "./authMiddleware";

export const permitirCargos = (cargosPermitidos: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    const usuario = req.usuarioLogado;

    if (!usuario) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    if (!cargosPermitidos.includes(usuario.cargo)) {
      return res.status(403).json({
        error: "Acesso negado. Você não tem permissão para acessar este recurso.",
      });
    }
    next();
  };
};
