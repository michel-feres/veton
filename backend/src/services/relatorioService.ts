import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../database";

const statusConsultas = [
  { valor: "Agendada", rotulo: "Agendada" },
  { valor: "Concluida", rotulo: "Concluída" },
  { valor: "Cancelada", rotulo: "Cancelada" },
] as const;

const statusAnimais = [
  { valor: "Saudavel", rotulo: "Saudável" },
  { valor: "EmTratamento", rotulo: "Em tratamento" },
  { valor: "Emergencia", rotulo: "Emergência" },
] as const;

const dataISOValida = (valor: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const data = new Date(`${valor}T00:00:00.000Z`);

  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
};

export const validarPeriodoConsulta = (
  inicio: unknown,
  fim: unknown
): { dataInicio?: Date; dataFim?: Date; erro?: string } => {
  if (inicio !== undefined && (typeof inicio !== "string" || !dataISOValida(inicio))) {
    return { erro: "Informe uma data inicial válida no formato AAAA-MM-DD." };
  }

  if (fim !== undefined && (typeof fim !== "string" || !dataISOValida(fim))) {
    return { erro: "Informe uma data final válida no formato AAAA-MM-DD." };
  }

  if (typeof inicio === "string" && typeof fim === "string" && inicio > fim) {
    return {
      erro: "A data inicial não pode ser posterior à data final.",
    };
  }

  const periodo: { dataInicio?: Date; dataFim?: Date } = {};

  if (typeof inicio === "string") {
    periodo.dataInicio = new Date(`${inicio}T00:00:00.000Z`);
  }

  if (typeof fim === "string") {
    periodo.dataFim = new Date(`${fim}T23:59:59.999Z`);
  }

  return periodo;
};

// Relatório de consultas por período e status
export const obterRelatorioConsultas = async (dataInicio?: Date, dataFim?: Date) => {
  const where: Prisma.ConsultaWhereInput = {};
  const filtroData: { gte?: Date; lte?: Date } = {};

  if (dataInicio) {
    filtroData.gte = dataInicio;
  }

  if (dataFim) {
    filtroData.lte = dataFim;
  }

  if (Object.keys(filtroData).length > 0) {
    where.dataConsulta = filtroData;
  }

  const agrupamentos = await prisma.consulta.groupBy({
    by: ["statusConsulta"],
    where,
    _count: {
      _all: true,
    },
  });

  const porStatus = statusConsultas.map((status) => ({
    status: status.rotulo,
    valor: status.valor,
    quantidade: agrupamentos.find((item) => item.statusConsulta === status.valor)?._count._all ?? 0,
  }));

  const totalConsultas = porStatus.reduce((total, item) => total + item.quantidade, 0);

  return {
    periodo: {
      dataInicio: dataInicio?.toISOString().slice(0, 10) ?? null,
      dataFim: dataFim?.toISOString().slice(0, 10) ?? null,
    },
    totalConsultas,
    porStatus,
  };
};

// Relatório de animais por situação de saúde e espécie
export const obterRelatorioAnimais = async () => {
  const [totalAnimais, agrupamentosStatus, agrupamentosEspecie] = await Promise.all([
    prisma.animal.count(),

    prisma.animal.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),

    prisma.animal.groupBy({
      by: ["especie"],
      _count: {
        _all: true,
      },
      orderBy: {
        especie: "asc",
      },
    }),
  ]);

  const porStatus = statusAnimais.map((status) => ({
    status: status.rotulo,
    valor: status.valor,
    quantidade: agrupamentosStatus.find((item) => item.status === status.valor)?._count._all ?? 0,
  }));

  const porEspecie = agrupamentosEspecie.map((item) => ({
    especie: item.especie,
    quantidade: item._count._all,
  }));

  return {
    totalAnimais,
    porStatus,
    porEspecie,
  };
};
