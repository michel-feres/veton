import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { respostaErro } from "../utils/respostaApi";

type EsquemasRequisicao = {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
};

export const validarRequisicao = (esquemas: EsquemasRequisicao) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const erros: {
      campo: string;
      mensagem: string;
    }[] = [];

    for (const campo of ["body", "params", "query"] as const) {
      const esquema = esquemas[campo];

      if (!esquema) {
        continue;
      }

      const dados = campo === "body" ? req.body : campo === "params" ? req.params : req.query;

      const resultado = esquema.safeParse(dados);

      if (!resultado.success) {
        erros.push(
          ...resultado.error.issues.map((erro) => ({
            campo: [campo, ...erro.path.map(String)].join("."),
            mensagem: erro.message,
          }))
        );

        continue;
      }

      if (campo === "body") {
        req.body = resultado.data;
      }
    }

    if (erros.length > 0) {
      return respostaErro(res, 400, "Dados inválidos.", erros);
    }

    return next();
  };
};
