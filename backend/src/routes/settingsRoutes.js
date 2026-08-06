import {
  Router,
} from "express";

import {
  prisma,
} from "../lib/prisma.js";

import {
  requireAuth,
} from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

/* =====================================================
   CARREGAR PERFIL, PREFERÊNCIAS E CONTADORES
===================================================== */

router.get(
  "/",
  async (request, response) => {
    try {
      const [
        settings,
        libraryCount,
        historyCount,
        favoritesCount,
        notificationsCount,
      ] = await Promise.all([
        prisma.userSettings.upsert({
          where: {
            userId: request.user.id,
          },

          create: {
            userId: request.user.id,
          },

          update: {},

          select: {
            notifyOnSave: true,
            notifyOnFavorite: true,
          },
        }),

        prisma.summary.count({
          where: {
            userId: request.user.id,
            saved: true,
          },
        }),

        prisma.summary.count({
          where: {
            userId: request.user.id,
          },
        }),

        prisma.summary.count({
          where: {
            userId: request.user.id,
            saved: true,
            favorite: true,
          },
        }),

        prisma.notification.count({
          where: {
            userId: request.user.id,
          },
        }),
      ]);

      return response.status(200).json({
        profile: {
          id: request.user.id,
          name: request.user.name,
          email: request.user.email,
        },

        settings,

        counts: {
          library: libraryCount,
          history: historyCount,
          favorites: favoritesCount,
          notifications: notificationsCount,
        },
      });
    } catch (error) {
      console.error(
        "Erro ao carregar configurações:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível carregar as configurações.",
      });
    }
  },
);

/* =====================================================
   ATUALIZAR PREFERÊNCIAS
===================================================== */

router.patch(
  "/",
  async (request, response) => {
    const updateData = {};

    if (
      typeof request.body?.notifyOnSave ===
      "boolean"
    ) {
      updateData.notifyOnSave =
        request.body.notifyOnSave;
    }

    if (
      typeof request.body?.notifyOnFavorite ===
      "boolean"
    ) {
      updateData.notifyOnFavorite =
        request.body.notifyOnFavorite;
    }

    if (
      Object.keys(updateData).length === 0
    ) {
      return response.status(400).json({
        error:
          "Nenhuma preferência válida foi informada.",
      });
    }

    try {
      const settings =
        await prisma.userSettings.upsert({
          where: {
            userId: request.user.id,
          },

          create: {
            userId: request.user.id,
            ...updateData,
          },

          update: updateData,

          select: {
            notifyOnSave: true,
            notifyOnFavorite: true,
          },
        });

      return response.status(200).json({
        message:
          "Preferências atualizadas com sucesso.",

        settings,
      });
    } catch (error) {
      console.error(
        "Erro ao atualizar configurações:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível atualizar as preferências.",
      });
    }
  },
);

export default router;