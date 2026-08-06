import {
  createHash,
  randomBytes,
} from "node:crypto";

import {
  Resend,
} from "resend";

export const PASSWORD_RESET_EXPIRATION_MS =
  30 * 60 * 1000;

/* =====================================================
   TOKEN
===================================================== */

export function createPasswordResetToken() {
  return randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(
  token,
) {
  if (typeof token !== "string") {
    return "";
  }

  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export function createPasswordResetUrl(
  token,
) {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    "http://localhost:5173";

  const normalizedFrontendUrl =
    frontendUrl.replace(/\/+$/, "");

  return (
    `${normalizedFrontendUrl}` +
    `/redefinir-senha?token=` +
    encodeURIComponent(token)
  );
}

/* =====================================================
   UTILITÁRIOS DO E-MAIL
===================================================== */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getResendClient() {
  const apiKey =
    process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  /*
    Criamos o cliente somente quando a função
    é executada. Assim o dotenv já terá carregado
    as variáveis do arquivo .env.
  */
  return new Resend(apiKey);
}

function getSenderEmail() {
  const configuredSender =
    process.env.RESEND_FROM_EMAIL?.trim();

  if (configuredSender) {
    return configuredSender;
  }

  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    throw new Error(
      "RESEND_FROM_EMAIL não foi configurado.",
    );
  }

  return "LiterIA <onboarding@resend.dev>";
}

function logLocalResetLink({
  email,
  resetUrl,
}) {
  console.log("");
  console.log(
    "==========================================",
  );
  console.log(
    "LINK DE RECUPERAÇÃO DE SENHA — LITERIA",
  );
  console.log(`E-mail: ${email}`);
  console.log(`Link: ${resetUrl}`);
  console.log(
    "O link expira em 30 minutos.",
  );
  console.log(
    "==========================================",
  );
  console.log("");
}

/* =====================================================
   ENVIO DO E-MAIL
===================================================== */

export async function sendPasswordResetLink({
  email,
  resetUrl,
}) {
  const resend =
    getResendClient();

  /*
    Mantemos o modo terminal como fallback
    durante o desenvolvimento quando não houver
    uma chave configurada.
  */
  if (!resend) {
    if (
      process.env.NODE_ENV ===
      "production"
    ) {
      throw new Error(
        "RESEND_API_KEY não foi configurada.",
      );
    }

    logLocalResetLink({
      email,
      resetUrl,
    });

    return {
      mode: "console",
      id: null,
    };
  }

  const safeResetUrl =
    escapeHtml(resetUrl);

  const { data, error } =
    await resend.emails.send({
      from: getSenderEmail(),

      to: [
        email,
      ],

      subject:
        "Redefina sua senha no LiterIA",

      text: [
        "Olá!",
        "",
        "Recebemos uma solicitação para redefinir a senha da sua conta no LiterIA.",
        "",
        "Abra o link abaixo para criar uma nova senha:",
        resetUrl,
        "",
        "Este link expira em 30 minutos e pode ser utilizado apenas uma vez.",
        "",
        "Caso você não tenha solicitado a alteração, ignore esta mensagem.",
        "",
        "LiterIA",
      ].join("\n"),

      html: `
        <!doctype html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />

            <title>
              Redefinição de senha
            </title>
          </head>

          <body
            style="
              margin: 0;
              padding: 0;
              background: #f5efe8;
              font-family: Arial, Helvetica, sans-serif;
              color: #604b50;
            "
          >
            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              style="
                width: 100%;
                background: #f5efe8;
              "
            >
              <tr>
                <td
                  align="center"
                  style="
                    padding: 38px 18px;
                  "
                >
                  <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    style="
                      width: 100%;
                      max-width: 600px;
                      overflow: hidden;
                      border: 1px solid #e2cac4;
                      border-radius: 24px;
                      background: #fffdf9;
                      box-shadow: 0 20px 50px rgba(87, 57, 63, 0.12);
                    "
                  >
                    <tr>
                      <td
                        style="
                          padding: 28px 34px;
                          background: linear-gradient(
                            135deg,
                            #edcbc6,
                            #f7e5df 54%,
                            #e8deef
                          );
                        "
                      >
                        <div
                          style="
                            font-family: Georgia, 'Times New Roman', serif;
                            font-size: 25px;
                            font-weight: bold;
                            color: #68484e;
                          "
                        >
                          📖 LiterIA
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding: 38px 34px 34px;
                        "
                      >
                        <div
                          style="
                            margin-bottom: 10px;
                            color: #ae676d;
                            font-size: 11px;
                            font-weight: bold;
                            letter-spacing: 2px;
                            text-transform: uppercase;
                          "
                        >
                          Recuperação de acesso
                        </div>

                        <h1
                          style="
                            margin: 0 0 16px;
                            color: #574247;
                            font-family: Georgia, 'Times New Roman', serif;
                            font-size: 31px;
                            line-height: 1.2;
                          "
                        >
                          Crie uma nova senha
                        </h1>

                        <p
                          style="
                            margin: 0 0 16px;
                            color: #806b70;
                            font-size: 15px;
                            line-height: 1.7;
                          "
                        >
                          Recebemos uma solicitação para
                          redefinir a senha da sua conta
                          no LiterIA.
                        </p>

                        <p
                          style="
                            margin: 0 0 27px;
                            color: #806b70;
                            font-size: 15px;
                            line-height: 1.7;
                          "
                        >
                          Clique no botão abaixo para
                          criar uma nova senha.
                        </p>

                        <table
                          role="presentation"
                          cellspacing="0"
                          cellpadding="0"
                        >
                          <tr>
                            <td
                              style="
                                border-radius: 13px;
                                background: #ad6369;
                              "
                            >
                              <a
                                href="${safeResetUrl}"
                                style="
                                  display: inline-block;
                                  padding: 15px 24px;
                                  color: #ffffff;
                                  font-size: 14px;
                                  font-weight: bold;
                                  text-decoration: none;
                                "
                              >
                                Redefinir minha senha
                              </a>
                            </td>
                          </tr>
                        </table>

                        <div
                          style="
                            margin-top: 27px;
                            padding: 16px 18px;
                            border: 1px solid #ead7d2;
                            border-radius: 13px;
                            background: #fff8f5;
                          "
                        >
                          <p
                            style="
                              margin: 0;
                              color: #927a7f;
                              font-size: 12px;
                              line-height: 1.65;
                            "
                          >
                            Este link expira em
                            <strong>30 minutos</strong>
                            e pode ser utilizado apenas
                            uma vez.
                          </p>
                        </div>

                        <p
                          style="
                            margin: 25px 0 0;
                            color: #a18a8e;
                            font-size: 12px;
                            line-height: 1.65;
                          "
                        >
                          Caso você não tenha solicitado
                          esta alteração, ignore este
                          e-mail. Sua senha continuará
                          a mesma.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding: 20px 34px;
                          border-top: 1px solid #eee0dc;
                          color: #a28b8f;
                          font-size: 11px;
                          text-align: center;
                        "
                      >
                        LiterIA — Literatura e inteligência
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

  /*
    O SDK retorna o erro no próprio resultado,
    por isso precisamos verificá-lo explicitamente.
  */
  if (error) {
    console.error(
      "Erro retornado pelo Resend:",
      {
        name: error.name,
        message: error.message,
        statusCode:
          error.statusCode,
      },
    );

    throw new Error(
      "O serviço de e-mail não conseguiu enviar a mensagem.",
    );
  }

  console.log(
    "E-mail de recuperação enviado pelo Resend:",
    data?.id || "identificador não informado",
  );

  return {
    mode: "email",
    id: data?.id || null,
  };
}