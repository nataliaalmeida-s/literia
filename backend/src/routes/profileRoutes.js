import {
  Router,
} from "express";

import bcrypt from "bcryptjs";

import {
  prisma,
} from "../lib/prisma.js";

import {
  requireAuth,
} from "../middleware/requireAuth.js";

import {
  getClearSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "../lib/session.js";

const router = Router();

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

router.use(requireAuth);

/* =====================================================
   CARREGAR PERFIL
===================================================== */

router.get(
  "/",
  async (request, response) => {
    try {
      const user =
        await prisma.user.findUnique({
          where: {
            id: request.user.id,
          },

          select: publicUserSelect,
        });

      if (!user) {
        return response.status(404).json({
          error: "Conta não encontrada.",
        });
      }

      return response.status(200).json({
        user,
      });
    } catch (error) {
      console.error(
        "Erro ao carregar perfil:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível carregar o perfil.",
      });
    }
  },
);

/* =====================================================
   ALTERAR NOME
===================================================== */

router.patch(
  "/name",
  async (request, response) => {
    const name =
      typeof request.body?.name === "string"
        ? request.body.name.trim()
        : "";

    if (!name) {
      return response.status(400).json({
        error:
          "Informe o nome que deseja utilizar.",
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

    try {
      const user = await prisma.user.update({
        where: {
          id: request.user.id,
        },

        data: {
          name,
        },

        select: publicUserSelect,
      });

      return response.status(200).json({
        message:
          "Nome atualizado com sucesso.",

        user,
      });
    } catch (error) {
      console.error(
        "Erro ao atualizar nome:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível atualizar o nome.",
      });
    }
  },
);

/* =====================================================
   ALTERAR E-MAIL
===================================================== */

router.patch(
  "/email",
  async (request, response) => {
    const email =
      typeof request.body?.email === "string"
        ? request.body.email
            .trim()
            .toLowerCase()
        : "";

    const password =
      typeof request.body?.password ===
      "string"
        ? request.body.password
        : "";

    if (!email || !password) {
      return response.status(400).json({
        error:
          "Informe o novo e-mail e sua senha atual.",
      });
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(email) ||
      email.length > 254
    ) {
      return response.status(400).json({
        error:
          "Informe um endereço de e-mail válido.",
      });
    }

    try {
      const currentUser =
        await prisma.user.findUnique({
          where: {
            id: request.user.id,
          },

          select: {
            id: true,
            email: true,
            passwordHash: true,
          },
        });

      if (!currentUser) {
        return response.status(404).json({
          error:
            "Conta não encontrada.",
        });
      }

      const passwordMatches =
        await bcrypt.compare(
          password,
          currentUser.passwordHash,
        );

      if (!passwordMatches) {
        return response.status(401).json({
          error:
            "A senha atual está incorreta.",
        });
      }

      if (email === currentUser.email) {
        return response.status(400).json({
          error:
            "O novo e-mail é igual ao e-mail atual.",
        });
      }

      const existingUser =
        await prisma.user.findUnique({
          where: {
            email,
          },

          select: {
            id: true,
          },
        });

      if (
        existingUser &&
        existingUser.id !== currentUser.id
      ) {
        return response.status(409).json({
          error:
            "Já existe uma conta cadastrada com este e-mail.",
        });
      }

      const user = await prisma.user.update({
        where: {
          id: currentUser.id,
        },

        data: {
          email,
        },

        select: publicUserSelect,
      });

      return response.status(200).json({
        message:
          "E-mail atualizado com sucesso.",

        user,
      });
    } catch (error) {
      console.error(
        "Erro ao atualizar e-mail:",
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
          "Não foi possível atualizar o e-mail.",
      });
    }
  },
);

/* =====================================================
   ALTERAR SENHA
===================================================== */

router.patch(
  "/password",
  async (request, response) => {
    const currentPassword =
      typeof request.body?.currentPassword ===
      "string"
        ? request.body.currentPassword
        : "";

    const newPassword =
      typeof request.body?.newPassword ===
      "string"
        ? request.body.newPassword
        : "";

    const confirmPassword =
      typeof request.body?.confirmPassword ===
      "string"
        ? request.body.confirmPassword
        : "";

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return response.status(400).json({
        error:
          "Preencha todos os campos de senha.",
      });
    }

    if (newPassword.length < 8) {
      return response.status(400).json({
        error:
          "A nova senha deve possuir pelo menos 8 caracteres.",
      });
    }

    if (
      Buffer.byteLength(
        newPassword,
        "utf8",
      ) > 72
    ) {
      return response.status(400).json({
        error:
          "A nova senha informada é muito longa.",
      });
    }

    if (
      newPassword !== confirmPassword
    ) {
      return response.status(400).json({
        error:
          "A confirmação da nova senha não corresponde.",
      });
    }

    try {
      const currentUser =
        await prisma.user.findUnique({
          where: {
            id: request.user.id,
          },

          select: {
            id: true,
            passwordHash: true,
          },
        });

      if (!currentUser) {
        return response.status(404).json({
          error:
            "Conta não encontrada.",
        });
      }

      const currentPasswordMatches =
        await bcrypt.compare(
          currentPassword,
          currentUser.passwordHash,
        );

      if (!currentPasswordMatches) {
        return response.status(401).json({
          error:
            "A senha atual está incorreta.",
        });
      }

      const newPasswordIsCurrent =
        await bcrypt.compare(
          newPassword,
          currentUser.passwordHash,
        );

      if (newPasswordIsCurrent) {
        return response.status(400).json({
          error:
            "A nova senha deve ser diferente da senha atual.",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          newPassword,
          12,
        );

      await prisma.user.update({
        where: {
          id: currentUser.id,
        },

        data: {
          passwordHash,
        },
      });

      response.clearCookie(
        SESSION_COOKIE_NAME,
        getClearSessionCookieOptions(),
      );

      return response.status(200).json({
        message:
          "Senha atualizada com sucesso. Entre novamente utilizando sua nova senha.",
      });
    } catch (error) {
      console.error(
        "Erro ao atualizar senha:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível atualizar a senha.",
      });
    }
  },
);

export default router;