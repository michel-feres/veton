import dotenv from "dotenv";

dotenv.config();

const iniciarServidor = async () => {
  const { default: app } = await import("./app");

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
};

iniciarServidor().catch((error) => {
  console.error("Erro ao iniciar servidor:", error);
  process.exit(1);
});
