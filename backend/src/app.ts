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
import { verificarToken } from "./middlewares/authMiddleware";
import { permitirCargos } from "./middlewares/roleMiddleware";

const app = express();
app.use(express.json());

app.post("/auth/register", registrarUsuario);
app.post("/auth/login", loginUsuario);
app.post("/auth/esqueci-senha", esqueciSenha);
app.post("/auth/redefinir-senha", redefinirSenha);

app.get("/perfil", verificarToken, buscarPerfil);
app.put("/perfil", verificarToken, atualizarPerfil);
app.delete("/perfil", verificarToken, deletarPerfil);
app.get("/home", verificarToken, permitirCargos(["VETERINARIO"]), buscarLembretes);

app.post("/clinicas", verificarToken, permitirCargos(["VETERINARIO"]), (req, res) => {
  res.json({ mensagem: "Clínica cadastrada com sucesso!" });
});

export default app;
