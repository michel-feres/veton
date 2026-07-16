import express from "express";
import {
  registrarUsuario,
  loginUsuario,
  esqueciSenha,
  redefinirSenha,
} from "./controllers/authController";
import { verificarToken } from "./middlewares/authMiddleware";
import { permitirCargos } from "./middlewares/roleMiddleware";

const app = express();
app.use(express.json());

app.post("/auth/register", registrarUsuario);
app.post("/auth/login", loginUsuario);
app.post("/auth/esqueci-senha", esqueciSenha);
app.post("/auth/redefinir-senha", redefinirSenha);

app.get("/perfil", verificarToken, (req, res) => {
  res.json({ mensagem: "Bem-vindo ao seu perfil protegido!" });
});

app.post("/clinicas", verificarToken, permitirCargos(["VETERINARIO"]), (req, res) => {
  res.json({ mensagem: "Clínica cadastrada com sucesso!" });
});

export default app;
