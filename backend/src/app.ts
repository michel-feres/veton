import express from "express";
import { registrarUsuario, loginUsuario } from "./controllers/authController";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensagem: "API VetOn funcionando!",
  });
});

app.post("/auth/register", registrarUsuario);
app.post("/auth/login", loginUsuario);

export default app;
