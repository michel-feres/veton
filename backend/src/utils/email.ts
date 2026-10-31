import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const enviarCodigoRecuperacao = async (
  emailDestino: string,
  codigo: string
): Promise<void> => {
  await transporter.sendMail({
    from: `"VetOn" <${process.env.EMAIL_USER}>`,
    to: emailDestino,
    subject: "Recuperação de senha - VetOn",
    text: `Seu código de recuperação de senha é: ${codigo}. Este código é válido por 15 minutos.`,
  });
};
