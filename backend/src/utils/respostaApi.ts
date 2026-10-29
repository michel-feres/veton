import { Response } from "express";

export const respostaSucesso = (
  res: Response,
  status: number,
  message: string,
  data: unknown = null
): Response => {
  return res.status(status).json({
    success: true,
    message,
    data,
    errors: null,
  });
};

export const respostaErro = (
  res: Response,
  status: number,
  message: string,
  errors: unknown = null
): Response => {
  return res.status(status).json({
    success: false,
    message,
    data: null,
    errors,
  });
};
