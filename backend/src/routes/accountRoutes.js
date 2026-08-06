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

router.use(requireAuth);

/* =====================================================
   REMOVER TODOS DA BIBLIOTECA
===================================================== */

router.delete(
  "/library",
  async (request, response) => {
    try {
      const result =
        await prisma.summary.updateMany({
          where: {
            userId: request.user.id,
            saved: true,
          },

          data: {
            saved: false,
            favorite: false,
          },
        });

      return response.status(200).json({
        message:
          "Biblioteca esvaziada com sucesso.",

        updatedCount: result.count,
      });
    } catch (error) {
      console.error(
        "Erro ao limpar biblioteca:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível limpar a biblioteca.",
      });
    }
  },
);

/* =====================================================
   LIMPAR HISTÓRICO
===================================================== */

router.delete(
  "/history",
  async (request, response) => {
    try {
      const result =
        await prisma.summary.deleteMany({
          where: {
            userId: request.user.id,
          },
        });

      return response.status(200).json({
        message:
          "Histórico excluído com sucesso.",

        deletedCount: result.count,
      });
    } catch (error) {
      console.error(
        "Erro ao limpar histórico:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível limpar o histórico.",
      });
    }
  },
);

/* =====================================================
   REMOVER TODOS DOS FAVORITOS
===================================================== */

router.patch(
  "/favorites/clear",
  async (request, response) => {
    try {
      const result =
        await prisma.summary.updateMany({
          where: {
            userId: request.user.id,
            favorite: true,
          },

          data: {
            favorite: false,
          },
        });

      return response.status(200).json({
        message:
          "Favoritos removidos com sucesso.",

        updatedCount: result.count,
      });
    } catch (error) {
      console.error(
        "Erro ao remover favoritos:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível remover os favoritos.",
      });
    }
  },
);

/* =====================================================
   EXCLUIR A CONTA
===================================================== */

router.delete(
  "/",
  async (request, response) => {
    const password =
      typeof request.body?.password ===
      "string"
        ? request.body.password
        : "";

    const confirmation =
      typeof request.body?.confirmation ===
      "string"
        ? request.body.confirmation.trim()
        : "";

    if (!password) {
      return response.status(400).json({
        error:
          "Digite sua senha para excluir a conta.",
      });
    }

    if (confirmation !== "EXCLUIR") {
      return response.status(400).json({
        error:
          'Digite "EXCLUIR" para confirmar.',
      });
    }

    try {
      const user =
        await prisma.user.findUnique({
          where: {
            id: request.user.id,
          },

          select: {
            id: true,
            passwordHash: true,
          },
        });

      if (!user) {
        return response.status(404).json({
          error:
            "Conta não encontrada.",
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
            "A senha informada está incorreta.",
        });
      }

      await prisma.user.delete({
        where: {
          id: user.id,
        },
      });

      response.clearCookie(
        SESSION_COOKIE_NAME,
        getClearSessionCookieOptions(),
      );

      return response.status(200).json({
        message:
          "Conta excluída com sucesso.",
      });
    } catch (error) {
      console.error(
        "Erro ao excluir conta:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível excluir a conta.",
      });
    }
  },
);

export default router;