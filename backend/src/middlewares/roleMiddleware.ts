import { Response, NextFunction } from "express";
import { CustomRequest } from "./authMiddleware";
import { respostaErro } from "../utils/respostaApi";

export const permitirCargos = (cargosPermitidos: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    const usuario = req.usuarioLogado;

    if (!usuario) {
      return respostaErro(res, 401, "Usuário não autenticado.");
    }

    if (!usuario.cargo) {
      return respostaErro(res, 403, "Cargo do usuário não informado.");
    }

    const cargoUsuario = usuario.cargo.toLowerCase();

    const possuiPermissao = cargosPermitidos.some((cargo) => cargo.toLowerCase() === cargoUsuario);

    if (!possuiPermissao) {
      return respostaErro(
        res,
        403,
        "Acesso negado. Você não tem permissão para acessar este recurso."
      );
    }

    return next();
  };
};
