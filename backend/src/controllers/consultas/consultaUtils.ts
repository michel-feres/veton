import { prisma } from "../../database";

export const detalhesConsulta = {
  animal: {
    select: {
      idAnimal: true,
      nome: true,
      especie: true,
    },
  },
  clinica: {
    select: {
      idClinica: true,
      nomeClinica: true,
      telefone: true,
      endereco: true,
    },
  },
  veterinario: {
    select: {
      idVeterinario: true,
      crmv: true,
      especialidade: true,
      usuario: {
        select: {
          idUsuario: true,
          nome: true,
          email: true,
        },
      },
    },
  },
} as const;

export const dataISOValida = (valor: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const data = new Date(`${valor}T00:00:00.000Z`);

  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
};

export const buscarUsuarioConsulta = (idUsuario: number) => {
  return prisma.usuario.findUnique({
    where: { idUsuario },
    include: {
      tutor: {
        select: {
          idTutor: true,
        },
      },
      veterinario: {
        select: {
          idVeterinario: true,
        },
      },
    },
  });
};

export const possuiAcessoConsulta = (
  tipoUsuario: string | null,
  idTutorUsuario: number | undefined,
  idVeterinarioUsuario: number | undefined,
  idTutorConsulta: number,
  idVeterinarioConsulta: number
): boolean => {
  if (tipoUsuario === "Tutor") {
    return idTutorUsuario === idTutorConsulta;
  }

  if (tipoUsuario === "Veterinario") {
    return idVeterinarioUsuario === idVeterinarioConsulta;
  }

  return false;
};
