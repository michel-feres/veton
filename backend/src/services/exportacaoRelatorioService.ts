import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

interface SecaoPDF {
  titulo: string;
  linhas: string[];
}

interface AbaExcel {
  nome: string;
  cabecalhos: string[];
  linhas: (string | number)[][];
}

export const gerarPDF = (titulo: string, secoes: SecaoPDF[]): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const documento = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const partes: Buffer[] = [];

    documento.on("data", (parte: Buffer) => {
      partes.push(parte);
    });

    documento.on("end", () => {
      resolve(Buffer.concat(partes));
    });

    documento.on("error", reject);

    documento.fontSize(18).text(titulo, { align: "center" });
    documento.moveDown();

    documento
      .fontSize(9)
      .fillColor("gray")
      .text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`);

    documento.fillColor("black");

    for (const secao of secoes) {
      documento.moveDown();
      documento.fontSize(13).text(secao.titulo);
      documento.moveDown(0.3);
      documento.fontSize(10);

      if (secao.linhas.length === 0) {
        documento.text("Nenhum registro encontrado.");
      } else {
        for (const linha of secao.linhas) {
          documento.text(`- ${linha}`);
        }
      }
    }

    documento.end();
  });
};

export const gerarExcel = async (titulo: string, abas: AbaExcel[]): Promise<Buffer> => {
  const planilha = new ExcelJS.Workbook();

  planilha.creator = "VetOn";
  planilha.created = new Date();

  for (const aba of abas) {
    const pagina = planilha.addWorksheet(aba.nome.slice(0, 31));

    pagina.addRow([titulo]);
    pagina.mergeCells(1, 1, 1, aba.cabecalhos.length);
    pagina.getRow(1).font = {
      bold: true,
      size: 14,
    };

    pagina.addRow(aba.cabecalhos);
    pagina.getRow(2).font = {
      bold: true,
    };

    pagina.getRow(2).eachCell((celula) => {
      celula.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9EAF7" },
      };
    });

    for (const linha of aba.linhas) {
      pagina.addRow(linha);
    }

    pagina.columns = aba.cabecalhos.map((cabecalho, indice) => {
      const maiorConteudo = Math.max(
        cabecalho.length,
        ...aba.linhas.map((linha) => String(linha[indice] ?? "").length)
      );

      return {
        width: Math.max(14, Math.min(maiorConteudo + 3, 40)),
      };
    });

    pagina.views = [{ state: "frozen", ySplit: 2 }];
  }

  const arquivo = await planilha.xlsx.writeBuffer();

  return Buffer.from(arquivo);
};
