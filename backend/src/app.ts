import express from "express";
import { validarRequisicao } from "./middlewares/validacaoMiddleware";
import {
  registrarUsuario,
  loginUsuario,
  esqueciSenha,
  redefinirSenha,
} from "./controllers/authController";

import {
  buscarPerfil,
  atualizarPerfil,
  deletarPerfil,
  buscarLembretes,
} from "./controllers/usuarioController";

import {
  cadastrarAnimal,
  listarAnimais,
  buscarAnimal,
  atualizarAnimal,
  deletarAnimal,
} from "./controllers/animalController";

import {
  atualizarStatusAnimal,
  registrarVacina,
  adicionarHistorico,
  buscarFichaAnimal,
} from "./controllers/atendimentoController";

import {
  cadastrarClinica,
  listarClinicas,
  buscarClinica,
  atualizarClinica,
  deletarClinica,
} from "./controllers/clinicaController";

import {
  marcarConsulta,
  listarConsultas,
} from "./controllers/consultas/consultaAgendamentoController";

import {
  alterarHorarioConsulta,
  cancelarConsulta,
  excluirConsulta,
  reativarConsulta,
} from "./controllers/consultas/consultaGerenciamentoController";

import {
  consultarRelatorioConsultas,
  exportarRelatorioConsultas,
} from "./controllers/relatorios/consultasRelatorioController";

import {
  consultarRelatorioAnimais,
  exportarRelatorioAnimais,
} from "./controllers/relatorios/animaisRelatorioController";

import {
  registrarUsuarioSchema,
  loginSchema,
  esqueciSenhaSchema,
  redefinirSenhaSchema,
  atualizarPerfilSchema,
} from "./validations/authSchemas";

import {
  cadastrarAnimalSchema,
  atualizarAnimalSchema,
  animalIdParamsSchema,
  idAnimalParamsSchema,
} from "./validations/animalSchemas";

import {
  atualizarStatusAnimalSchema,
  registrarVacinaSchema,
  adicionarHistoricoSchema,
} from "./validations/atendimentoSchemas";

import {
  cadastrarClinicaSchema,
  atualizarClinicaSchema,
  clinicaIdParamsSchema,
} from "./validations/clinicaSchemas";

import {
  marcarConsultaSchema,
  listarConsultasQuerySchema,
  alterarHorarioConsultaSchema,
  consultaIdParamsSchema,
} from "./validations/consultaSchemas";

import {
  periodoRelatorioQuerySchema,
  exportarRelatorioConsultasQuerySchema,
  exportarRelatorioAnimaisQuerySchema,
} from "./validations/relatorioSchemas";

import { verificarToken } from "./middlewares/authMiddleware";
import { permitirCargos } from "./middlewares/roleMiddleware";

const app = express();
app.use(express.json());

// Autenticação
app.post("/auth/register", validarRequisicao({ body: registrarUsuarioSchema }), registrarUsuario);
app.post("/auth/login", validarRequisicao({ body: loginSchema }), loginUsuario);
app.post("/auth/esqueci-senha", validarRequisicao({ body: esqueciSenhaSchema }), esqueciSenha);
app.post(
  "/auth/redefinir-senha",
  validarRequisicao({ body: redefinirSenhaSchema }),
  redefinirSenha
);

// Usuário
app.get("/perfil", verificarToken, buscarPerfil);
app.put(
  "/perfil",
  verificarToken,
  validarRequisicao({ body: atualizarPerfilSchema }),
  atualizarPerfil
);
app.delete("/perfil", verificarToken, deletarPerfil);
app.get("/home", verificarToken, permitirCargos(["VETERINARIO"]), buscarLembretes);

// Animais
app.post(
  "/animais",
  verificarToken,
  validarRequisicao({ body: cadastrarAnimalSchema }),
  cadastrarAnimal
);
app.get("/animais", verificarToken, listarAnimais);
app.get(
  "/animais/:id",
  verificarToken,
  validarRequisicao({ params: animalIdParamsSchema }),
  buscarAnimal
);
app.put(
  "/animais/:id",
  verificarToken,
  validarRequisicao({
    params: animalIdParamsSchema,
    body: atualizarAnimalSchema,
  }),
  atualizarAnimal
);
app.delete(
  "/animais/:id",
  verificarToken,
  validarRequisicao({ params: animalIdParamsSchema }),
  deletarAnimal
);

// Ficha e atendimento dos animais
app.get(
  "/animais/:idAnimal/ficha",
  verificarToken,
  validarRequisicao({ params: idAnimalParamsSchema }),
  buscarFichaAnimal
);
app.patch(
  "/animais/:idAnimal/status",
  verificarToken,
  permitirCargos(["VETERINARIO"]),
  validarRequisicao({
    params: idAnimalParamsSchema,
    body: atualizarStatusAnimalSchema,
  }),
  atualizarStatusAnimal
);
app.post(
  "/animais/:idAnimal/vacinas",
  verificarToken,
  permitirCargos(["VETERINARIO"]),
  validarRequisicao({
    params: idAnimalParamsSchema,
    body: registrarVacinaSchema,
  }),
  registrarVacina
);
app.post(
  "/animais/:idAnimal/historico",
  verificarToken,
  permitirCargos(["VETERINARIO"]),
  validarRequisicao({
    params: idAnimalParamsSchema,
    body: adicionarHistoricoSchema,
  }),
  adicionarHistorico
);

// Clínicas
app.post(
  "/clinicas",
  verificarToken,
  permitirCargos(["VETERINARIO"]),
  validarRequisicao({ body: cadastrarClinicaSchema }),
  cadastrarClinica
);
app.get("/clinicas", verificarToken, permitirCargos(["VETERINARIO"]), listarClinicas);
app.get(
  "/clinicas/:id",
  verificarToken,
  permitirCargos(["VETERINARIO"]),
  validarRequisicao({ params: clinicaIdParamsSchema }),
  buscarClinica
);
app.put(
  "/clinicas/:id",
  verificarToken,
  permitirCargos(["VETERINARIO"]),
  validarRequisicao({
    params: clinicaIdParamsSchema,
    body: atualizarClinicaSchema,
  }),
  atualizarClinica
);
app.delete(
  "/clinicas/:id",
  verificarToken,
  permitirCargos(["VETERINARIO"]),
  validarRequisicao({ params: clinicaIdParamsSchema }),
  deletarClinica
);

// Consultas
app.post(
  "/consultas",
  verificarToken,
  validarRequisicao({ body: marcarConsultaSchema }),
  marcarConsulta
);
app.get(
  "/consultas",
  verificarToken,
  validarRequisicao({ query: listarConsultasQuerySchema }),
  listarConsultas
);
app.patch(
  "/consultas/:id/horario",
  verificarToken,
  validarRequisicao({
    params: consultaIdParamsSchema,
    body: alterarHorarioConsultaSchema,
  }),
  alterarHorarioConsulta
);
app.patch(
  "/consultas/:id/cancelar",
  verificarToken,
  validarRequisicao({ params: consultaIdParamsSchema }),
  cancelarConsulta
);
app.patch(
  "/consultas/:id/reativar",
  verificarToken,
  validarRequisicao({ params: consultaIdParamsSchema }),
  reativarConsulta
);
app.delete(
  "/consultas/:id",
  verificarToken,
  validarRequisicao({ params: consultaIdParamsSchema }),
  excluirConsulta
);

// Relatórios
app.get(
  "/relatorios/consultas",
  verificarToken,
  permitirCargos(["Veterinario"]),
  validarRequisicao({ query: periodoRelatorioQuerySchema }),
  consultarRelatorioConsultas
);
app.get(
  "/relatorios/consultas/exportar",
  verificarToken,
  permitirCargos(["Veterinario"]),
  validarRequisicao({
    query: exportarRelatorioConsultasQuerySchema,
  }),
  exportarRelatorioConsultas
);
app.get(
  "/relatorios/animais",
  verificarToken,
  permitirCargos(["Veterinario"]),
  consultarRelatorioAnimais
);
app.get(
  "/relatorios/animais/exportar",
  verificarToken,
  permitirCargos(["Veterinario"]),
  validarRequisicao({
    query: exportarRelatorioAnimaisQuerySchema,
  }),
  exportarRelatorioAnimais
);

export default app;
