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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return UUID_PATTERN.test(value);
}

function serializeNotification(
  notification,
) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,

    relatedId:
      notification.summaryId,

    read: notification.read,
    createdAt:
      notification.createdAt,
  };
}

/*
  Todas as rotas exigem uma sessão válida.
*/
router.use(requireAuth);

/* =====================================================
   LISTAR NOTIFICAÇÕES
===================================================== */

router.get(
  "/",
  async (request, response) => {
    try {
      const notifications =
        await prisma.notification.findMany({
          where: {
            userId: request.user.id,
          },

          orderBy: {
            createdAt: "desc",
          },

          take: 100,
        });

      return response.status(200).json({
        notifications:
          notifications.map(
            serializeNotification,
          ),
      });
    } catch (error) {
      console.error(
        "Erro ao carregar notificações:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível carregar as notificações.",
      });
    }
  },
);

/* =====================================================
   CONTADOR DE NÃO LIDAS
===================================================== */

router.get(
  "/unread-count",
  async (request, response) => {
    try {
      const count =
        await prisma.notification.count({
          where: {
            userId: request.user.id,
            read: false,
          },
        });

      return response.status(200).json({
        count,
      });
    } catch (error) {
      console.error(
        "Erro ao contar notificações:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível contar as notificações.",
      });
    }
  },
);

/* =====================================================
   MARCAR UMA COMO LIDA
===================================================== */

router.patch(
  "/:notificationId/read",
  async (request, response) => {
    const {
      notificationId,
    } = request.params;

    if (!isValidUuid(notificationId)) {
      return response.status(400).json({
        error:
          "Identificador de notificação inválido.",
      });
    }

    try {
      const result =
        await prisma.notification.updateMany({
          where: {
            id: notificationId,
            userId: request.user.id,
          },

          data: {
            read: true,
          },
        });

      if (result.count === 0) {
        return response.status(404).json({
          error:
            "Notificação não encontrada.",
        });
      }

      return response.status(200).json({
        message:
          "Notificação marcada como lida.",
      });
    } catch (error) {
      console.error(
        "Erro ao atualizar notificação:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível atualizar a notificação.",
      });
    }
  },
);

/* =====================================================
   MARCAR TODAS COMO LIDAS
===================================================== */

router.patch(
  "/read-all",
  async (request, response) => {
    try {
      const result =
        await prisma.notification.updateMany({
          where: {
            userId: request.user.id,
            read: false,
          },

          data: {
            read: true,
          },
        });

      return response.status(200).json({
        message:
          "Todas as notificações foram marcadas como lidas.",

        updatedCount: result.count,
      });
    } catch (error) {
      console.error(
        "Erro ao atualizar notificações:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível atualizar as notificações.",
      });
    }
  },
);

/* =====================================================
   EXCLUIR UMA NOTIFICAÇÃO
===================================================== */

router.delete(
  "/:notificationId",
  async (request, response) => {
    const {
      notificationId,
    } = request.params;

    if (!isValidUuid(notificationId)) {
      return response.status(400).json({
        error:
          "Identificador de notificação inválido.",
      });
    }

    try {
      const result =
        await prisma.notification.deleteMany({
          where: {
            id: notificationId,
            userId: request.user.id,
          },
        });

      if (result.count === 0) {
        return response.status(404).json({
          error:
            "Notificação não encontrada.",
        });
      }

      return response.status(200).json({
        message:
          "Notificação excluída com sucesso.",
      });
    } catch (error) {
      console.error(
        "Erro ao excluir notificação:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível excluir a notificação.",
      });
    }
  },
);

/* =====================================================
   LIMPAR TODAS
===================================================== */

router.delete(
  "/",
  async (request, response) => {
    try {
      const result =
        await prisma.notification.deleteMany({
          where: {
            userId: request.user.id,
          },
        });

      return response.status(200).json({
        message:
          "Notificações excluídas com sucesso.",

        deletedCount: result.count,
      });
    } catch (error) {
      console.error(
        "Erro ao limpar notificações:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível limpar as notificações.",
      });
    }
  },
);

export default router;