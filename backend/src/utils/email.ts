import nodemailer from "nodemailer";

const emailUser = process.env.EMAIL_USER;
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

if (!emailUser || !clientId || !clientSecret || !refreshToken) {
  throw new Error("Credenciais OAuth do Gmail não configuradas.");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: emailUser,
    clientId,
    clientSecret,
    refreshToken,
  },
});

export const enviarCodigoRecuperacao = async (
  emailDestino: string,
  codigo: string
): Promise<void> => {
  await transporter.sendMail({
    from: `"VetOn" <${emailUser}>`,
    to: emailDestino,
    subject: "Recuperação de senha - VetOn",
    text: `Seu código de recuperação de senha é: ${codigo}. Este código é válido por 15 minutos.`,
  });
};
