import { Response } from "express";
import { CustomRequest } from "../../middlewares/authMiddleware";
import { obterRelatorioAnimais } from "../../services/relatorioService";
import { gerarExcel, gerarPDF } from "../../services/exportacaoRelatorioService";

// Dados para o painel de animais
export const consultarRelatorioAnimais = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  try {
    const relatorio = await obterRelatorioAnimais();

    return res.status(200).json(relatorio);
  } catch (error) {
    console.error("Erro ao gerar relatório de animais:", error);

    return res.status(500).json({
      error: "Erro ao gerar relatório de animais.",
    });
  }
};

// Exportar relatório de animais
export const exportarRelatorioAnimais = async (
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

    const relatorio = await obterRelatorioAnimais();

    if (formato === "pdf") {
      const arquivo = await gerarPDF("Relatório de animais", [
        {
          titulo: "Resumo geral",
          linhas: [`Total de animais cadastrados: ${relatorio.totalAnimais}`],
        },
        {
          titulo: "Animais por situação de saúde",
          linhas: relatorio.porStatus.map((item) => `${item.status}: ${item.quantidade}`),
        },
        {
          titulo: "Animais por espécie",
          linhas: relatorio.porEspecie.map((item) => `${item.especie}: ${item.quantidade}`),
        },
      ]);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="relatorio-animais.pdf"');

      return res.status(200).send(arquivo);
    }

    const arquivo = await gerarExcel("Relatório de animais", [
      {
        nome: "Resumo",
        cabecalhos: ["Informação", "Quantidade"],
        linhas: [["Total de animais cadastrados", relatorio.totalAnimais]],
      },
      {
        nome: "Por situacao",
        cabecalhos: ["Situação de saúde", "Quantidade"],
        linhas: relatorio.porStatus.map((item) => [item.status, item.quantidade]),
      },
      {
        nome: "Por espécie",
        cabecalhos: ["Espécie", "Quantidade"],
        linhas: relatorio.porEspecie.map((item) => [item.especie, item.quantidade]),
      },
    ]);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="relatorio-animais.xlsx"');

    return res.status(200).send(arquivo);
  } catch (error) {
    console.error("Erro ao exportar relatório de animais:", error);

    return res.status(500).json({
      error: "Erro ao exportar relatório de animais.",
    });
  }
};
