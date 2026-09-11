import express from "express";
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
    buscarFichaAnimal
} from "./controllers/atendimentoController";
import {
    cadastrarClinica,
    listarClinicas,
    buscarClinica,
    atualizarClinica,
    deletarClinica,
} from "./controllers/clinicaController";
import {verificarToken} from "./middlewares/authMiddleware";
import {permitirCargos} from "./middlewares/roleMiddleware";

const app = express();
app.use(express.json());

//login
app.post("/auth/register", registrarUsuario);
app.post("/auth/login", loginUsuario);
app.post("/auth/esqueci-senha", esqueciSenha);
app.post("/auth/redefinir-senha", redefinirSenha);

//user
app.get("/perfil", verificarToken, buscarPerfil);
app.put("/perfil", verificarToken, atualizarPerfil);
app.delete("/perfil", verificarToken, deletarPerfil);
app.get("/home", verificarToken, permitirCargos(["VETERINARIO"]), buscarLembretes);

//animais
app.post("/animais", verificarToken, cadastrarAnimal);
app.get("/animais", verificarToken, listarAnimais);
app.get("/animais/:id", verificarToken, buscarAnimal);
app.put("/animais/:id", verificarToken, atualizarAnimal);
app.delete("/animais/:id", verificarToken, deletarAnimal);

//animal
app.get("/animais/:idAnimal/ficha", verificarToken, buscarFichaAnimal);
app.patch("/animais/:idAnimal/status", verificarToken, permitirCargos(["VETERINARIO"]), atualizarStatusAnimal);
app.post("/animais/:idAnimal/vacinas", verificarToken, permitirCargos(["VETERINARIO"]), registrarVacina);
app.post("/animais/:idAnimal/historico", verificarToken, permitirCargos(["VETERINARIO"]), adicionarHistorico);

app.post("/clinicas", verificarToken, permitirCargos(["VETERINARIO"]), cadastrarClinica);
app.get("/clinicas", verificarToken, permitirCargos(["VETERINARIO"]), listarClinicas);
app.get("/clinicas/:id", verificarToken, permitirCargos(["VETERINARIO"]), buscarClinica);
app.put("/clinicas/:id", verificarToken, permitirCargos(["VETERINARIO"]), atualizarClinica);
app.delete("/clinicas/:id", verificarToken, permitirCargos(["VETERINARIO"]), deletarClinica);

export default app;