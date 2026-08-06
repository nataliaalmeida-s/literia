import { Router } from "express";
import bcrypt from "bcryptjs";

import {
  createPasswordResetToken,
  createPasswordResetUrl,
  hashPasswordResetToken,
  PASSWORD_RESET_EXPIRATION_MS,
  sendPasswordResetLink,
} from "../services/passwordResetService.js";

import { prisma } from "../lib/prisma.js";

import {
  createSessionToken,
  getClearSessionCookieOptions,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "../lib/session.js";

import {
  requireAuth,
} from "../middleware/requireAuth.js";

import {
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from "../middleware/authRateLimits.js";

const router = Router();

const PASSWORD_RESET_GENERIC_MESSAGE =
  "Se existir uma conta associada a este e-mail, enviaremos as instruções para redefinir a senha.";

class InvalidPasswordResetTokenError
  extends Error {
  constructor() {
    super(
      "Token de recuperação inválido ou expirado.",
    );

    this.name =
      "InvalidPasswordResetTokenError";
  }
}

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

function normalizeName(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeEmail(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function normalizePassword(value) {
  return typeof value === "string"
    ? value
    : "";
}

function isValidEmail(email) {
  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return (
    emailPattern.test(email) &&
    email.length <= 254
  );
}

/* =====================================================
   CADASTRO
===================================================== */

router.post(
  "/register",
  async (request, response) => {
    const name = normalizeName(
      request.body?.name,
    );

    const email = normalizeEmail(
      request.body?.email,
    );

    const password = normalizePassword(
      request.body?.password,
    );

    if (!name || !email || !password) {
      return response.status(400).json({
        error:
          "Nome, e-mail e senha são obrigatórios.",
      });
    }

    if (
      name.length < 2 ||
      name.length > 80
    ) {
      return response.status(400).json({
        error:
          "O nome deve possuir entre 2 e 80 caracteres.",
      });
    }

    if (!isValidEmail(email)) {
      return response.status(400).json({
        error:
          "Informe um endereço de e-mail válido.",
      });
    }

    if (password.length < 8) {
      return response.status(400).json({
        error:
          "A senha deve possuir pelo menos 8 caracteres.",
      });
    }

    if (
      Buffer.byteLength(password, "utf8") >
      72
    ) {
      return response.status(400).json({
        error:
          "A senha informada é muito longa.",
      });
    }

    try {
      const existingUser =
        await prisma.user.findUnique({
          where: {
            email,
          },

          select: {
            id: true,
          },
        });

      if (existingUser) {
        return response.status(409).json({
          error:
            "Já existe uma conta cadastrada com este e-mail.",
        });
      }

      const passwordHash =
        await bcrypt.hash(password, 12);

      const user =
        await prisma.user.create({
          data: {
            name,
            email,
            passwordHash,

            settings: {
              create: {},
            },
          },

          select: publicUserSelect,
        });

      return response.status(201).json({
        message: "Conta criada com sucesso.",
        user,
      });
    } catch (error) {
      console.error(
        "Erro ao cadastrar usuário:",
        error,
      );

      if (error?.code === "P2002") {
        return response.status(409).json({
          error:
            "Já existe uma conta cadastrada com este e-mail.",
        });
      }

      return response.status(500).json({
        error:
          "Não foi possível criar a conta.",
      });
    }
  },
);

/* =====================================================
   LOGIN
===================================================== */

router.post(
  "/login",
  async (request, response) => {
    const email = normalizeEmail(
      request.body?.email,
    );

    const password = normalizePassword(
      request.body?.password,
    );

    if (!email || !password) {
      return response.status(400).json({
        error:
          "E-mail e senha são obrigatórios.",
      });
    }

    if (!isValidEmail(email)) {
      return response.status(400).json({
        error:
          "Informe um endereço de e-mail válido.",
      });
    }

    try {
      const user =
        await prisma.user.findUnique({
          where: {
            email,
          },

          select: {
            ...publicUserSelect,
            passwordHash: true,
            sessionVersion: true,
          },
        });

      /*
        A resposta é a mesma para e-mail inexistente
        e senha incorreta, evitando revelar contas.
      */
      if (!user) {
        return response.status(401).json({
          error:
            "E-mail ou senha inválidos.",
        });
      }

      const passwordMatches =
        await bcrypt.compare(
          password,
          user.passwordHash,
        );

      if (!passwordMatches) {
        return response.status(401).json({
          error:
            "E-mail ou senha inválidos.",
        });
      }

      const token = createSessionToken(
        user.id,
        user.sessionVersion,
      );

      response.cookie(
        SESSION_COOKIE_NAME,
        token,
        getSessionCookieOptions(),
      );

      const {
        passwordHash,
        sessionVersion,
        ...publicUser
      } = user;

      return response.status(200).json({
        message: "Login realizado com sucesso.",
        user: publicUser,
      });
    } catch (error) {
      console.error(
        "Erro ao realizar login:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível realizar o login.",
      });
    }
  },
);

/* =====================================================
   SOLICITAR RECUPERAÇÃO DE SENHA
===================================================== */

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  async (request, response) => {
    const email = normalizeEmail(
      request.body?.email,
    );

    if (!email || !isValidEmail(email)) {
      /*
        A resposta permanece neutra para não
        revelar quais endereços possuem conta.
      */
      return response.status(200).json({
        message:
          PASSWORD_RESET_GENERIC_MESSAGE,
      });
    }

    try {
      const user =
        await prisma.user.findUnique({
          where: {
            email,
          },

          select: {
            id: true,
            email: true,
          },
        });

      if (user) {
        const rawToken =
          createPasswordResetToken();

        const tokenHash =
          hashPasswordResetToken(
            rawToken,
          );

        const expiresAt =
          new Date(
            Date.now() +
            PASSWORD_RESET_EXPIRATION_MS,
          );

        /*
          Invalidamos links anteriores ainda não
          utilizados antes de criar o novo.
        */
        await prisma.$transaction(
          async (transaction) => {
            await transaction
              .passwordResetToken
              .deleteMany({
                where: {
                  userId: user.id,
                  usedAt: null,
                },
              });

            await transaction
              .passwordResetToken
              .create({
                data: {
                  userId: user.id,
                  tokenHash,
                  expiresAt,
                },
              });
          },
        );

        const resetUrl =
          createPasswordResetUrl(
            rawToken,
          );

        await sendPasswordResetLink({
          email: user.email,
          resetUrl,
        });
      }

      return response.status(200).json({
        message:
          PASSWORD_RESET_GENERIC_MESSAGE,
      });
    } catch (error) {
      console.error(
        "Erro ao solicitar recuperação de senha:",
        error,
      );

      /*
        A resposta continua neutra mesmo se o envio
        falhar, evitando revelar se o e-mail está
        associado a uma conta.
      */
      return response.status(200).json({
        message:
          PASSWORD_RESET_GENERIC_MESSAGE,
      });
    }
  },
);

/* =====================================================
   REDEFINIR SENHA
===================================================== */

router.post(
  "/reset-password",
  resetPasswordLimiter,
  async (request, response) => {
    const token =
      typeof request.body?.token ===
        "string"
        ? request.body.token.trim()
        : "";

    const password =
      normalizePassword(
        request.body?.password,
      );

    const confirmPassword =
      normalizePassword(
        request.body
          ?.confirmPassword,
      );

    if (
      !token ||
      !password ||
      !confirmPassword
    ) {
      return response.status(400).json({
        error:
          "Token, nova senha e confirmação são obrigatórios.",
      });
    }

    /*
      O token hexadecimal criado pelo serviço
      possui exatamente 64 caracteres.
    */
    if (
      !/^[0-9a-f]{64}$/i.test(token)
    ) {
      return response.status(400).json({
        error:
          "O link de recuperação é inválido ou expirou.",
      });
    }

    if (password.length < 8) {
      return response.status(400).json({
        error:
          "A senha deve possuir pelo menos 8 caracteres.",
      });
    }

    if (
      Buffer.byteLength(
        password,
        "utf8",
      ) > 72
    ) {
      return response.status(400).json({
        error:
          "A senha informada é muito longa.",
      });
    }

    if (
      password !==
      confirmPassword
    ) {
      return response.status(400).json({
        error:
          "As senhas informadas não coincidem.",
      });
    }

    const tokenHash =
      hashPasswordResetToken(token);

    try {
      const resetToken =
        await prisma
          .passwordResetToken
          .findUnique({
            where: {
              tokenHash,
            },

            select: {
              id: true,
              userId: true,
              expiresAt: true,
              usedAt: true,
            },
          });

      const now = new Date();

      if (
        !resetToken ||
        resetToken.usedAt ||
        resetToken.expiresAt <= now
      ) {
        return response.status(400).json({
          error:
            "O link de recuperação é inválido ou expirou.",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          12,
        );

      /*
        Todas as alterações são atômicas:
        ou senha, token e versão da sessão mudam
        juntos, ou nenhuma alteração é aplicada.
      */
      await prisma.$transaction(
        async (transaction) => {
          const claimResult =
            await transaction
              .passwordResetToken
              .updateMany({
                where: {
                  id: resetToken.id,
                  usedAt: null,

                  expiresAt: {
                    gt: now,
                  },
                },

                data: {
                  usedAt: now,
                },
              });

          /*
            Protege contra duas solicitações
            tentando utilizar o mesmo token
            simultaneamente.
          */
          if (
            claimResult.count !== 1
          ) {
            throw new InvalidPasswordResetTokenError();
          }

          await transaction.user.update({
            where: {
              id: resetToken.userId,
            },

            data: {
              passwordHash,

              sessionVersion: {
                increment: 1,
              },
            },
          });

          /*
            Invalida qualquer outro link ainda
            existente para a mesma conta.
          */
          await transaction
            .passwordResetToken
            .updateMany({
              where: {
                userId:
                  resetToken.userId,

                usedAt: null,
              },

              data: {
                usedAt: now,
              },
            });
        },
      );

      /*
        Caso o navegador possua uma sessão antiga,
        removemos também seu cookie.
      */
      response.clearCookie(
        SESSION_COOKIE_NAME,
        getClearSessionCookieOptions(),
      );

      return response.status(200).json({
        message:
          "Senha redefinida com sucesso.",
      });
    } catch (error) {
      if (
        error instanceof
        InvalidPasswordResetTokenError
      ) {
        return response.status(400).json({
          error:
            "O link de recuperação é inválido ou expirou.",
        });
      }

      console.error(
        "Erro ao redefinir senha:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível redefinir a senha.",
      });
    }
  },
);

/* =====================================================
   USUÁRIO AUTENTICADO
===================================================== */

router.get(
  "/me",
  requireAuth,
  (request, response) => {
    return response.status(200).json({
      user: request.user,
    });
  },
);

/* =====================================================
   LOGOUT
===================================================== */

router.post(
  "/logout",
  (request, response) => {
    response.clearCookie(
      SESSION_COOKIE_NAME,
      getClearSessionCookieOptions(),
    );

    return response.status(200).json({
      message: "Sessão encerrada com sucesso.",
    });
  },
);

export default router;