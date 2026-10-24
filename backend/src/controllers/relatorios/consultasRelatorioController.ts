import { Response } from "express";
import { CustomRequest } from "../../middlewares/authMiddleware";
import { obterRelatorioConsultas, validarPeriodoConsulta } from "../../services/relatorioService";
import { gerarExcel, gerarPDF } from "../../services/exportacaoRelatorioService";

// Dados para o painel de consultas
export const consultarRelatorioConsultas = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  try {
    const periodo = validarPeriodoConsulta(req.query.dataInicio, req.query.dataFim);

    if (periodo.erro) {
      return res.status(400).json({ error: periodo.erro });
    }

    const relatorio = await obterRelatorioConsultas(periodo.dataInicio, periodo.dataFim);

    return res.status(200).json(relatorio);
  } catch (error) {
    console.error("Erro ao gerar relatório de consultas:", error);

    return res.status(500).json({
      error: "Erro ao gerar relatório de consultas.",
    });
  }
};

// Exportar relatório de consultas
export const exportarRelatorioConsultas = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  try {
    const formato = req.query.formato;

    if (formato !== "pdf" && formato !== "excel") {
      return res.status(400).json({
        error: "Informe formato=pdf ou formato=excel.",
      });
    }

    const periodo = validarPeriodoConsulta(req.query.dataInicio, req.query.dataFim);

    if (periodo.erro) {
      return res.status(400).json({ error: periodo.erro });
    }

    const relatorio = await obterRelatorioConsultas(periodo.dataInicio, periodo.dataFim);

    const dataInicio = relatorio.periodo.dataInicio ?? "Não informada";

    const dataFim = relatorio.periodo.dataFim ?? "Não informada";

    if (formato === "pdf") {
      const arquivo = await gerarPDF("Relatório de consultas", [
        {
          titulo: "Período analisado",
          linhas: [
            `Data inicial: ${dataInicio}`,
            `Data final: ${dataFim}`,
            `Total de consultas: ${relatorio.totalConsultas}`,
          ],
        },
        {
          titulo: "Consultas por status",
          linhas: relatorio.porStatus.map((item) => `${item.status}: ${item.quantidade}`),
        },
      ]);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="relatorio-consultas.pdf"');

      return res.status(200).send(arquivo);
    }

    const arquivo = await gerarExcel("Relatório de consultas", [
      {
        nome: "Resumo",
        cabecalhos: ["Informação", "Valor"],
        linhas: [
          ["Data inicial", dataInicio],
          ["Data final", dataFim],
          ["Total de consultas", relatorio.totalConsultas],
        ],
      },
      {
        nome: "Por status",
        cabecalhos: ["Status", "Quantidade"],
        linhas: relatorio.porStatus.map((item) => [item.status, item.quantidade]),
      },
    ]);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="relatorio-consultas.xlsx"');

    return res.status(200).send(arquivo);
  } catch (error) {
    console.error("Erro ao exportar relatório de consultas:", error);

    return res.status(500).json({
      error: "Erro ao exportar relatório de consultas.",
    });
  }
};
