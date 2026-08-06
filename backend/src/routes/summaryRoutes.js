import {
  Router,
} from "express";

import {
  prisma,
} from "../lib/prisma.js";

import {
  requireAuth,
} from "../middleware/requireAuth.js";

import {
  generateLiterarySummary,
} from "../services/geminiService.js";

const router = Router();

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return UUID_PATTERN.test(value);
}

const BOOK_METADATA_SOURCES =
  new Set([
    "google-books",
    "open-library",
  ]);

function normalizeOptionalString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeOptionalYear(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const year = Number(value);

  if (!Number.isInteger(year)) {
    return null;
  }

  return year;
}

function serializeSummary(summary) {
  return {
    id: summary.id,

    /*
      "title" continua sendo o nome personalizado
      dado ao resumo quando ele é salvo.
    */
    title: summary.title || "",

    /*
      Dados bibliográficos da obra.
    */
    workTitle:
      summary.workTitle || "",

    author:
      summary.author || "",

    coverUrl:
      summary.coverUrl || null,

    firstPublicationYear:
      summary.firstPublicationYear ?? null,

    editionPublishedDate:
      summary.editionPublishedDate || null,

    isbn:
      summary.isbn || null,

    externalBookId:
      summary.externalBookId || null,

    metadataSource:
      summary.metadataSource || null,

    originalText:
      summary.originalText,

    /*
      O frontend utiliza o nome "summary".
      Por isso convertemos summaryText.
    */
    summary:
      summary.summaryText,

    saved: summary.saved,
    favorite: summary.favorite,

    createdAt:
      summary.createdAt,

    updatedAt:
      summary.updatedAt,
  };
}

/*
  Todas as rotas abaixo exigem autenticação.
  requireAuth adiciona request.user.
*/
router.use(requireAuth);

/* =====================================================
   GERAR E REGISTRAR NO HISTÓRICO
===================================================== */

router.post(
  "/generate",
  async (request, response) => {
    const text =
      typeof request.body?.text === "string"
        ? request.body.text.trim()
        : "";

    const book =
      request.body?.book &&
        typeof request.body.book === "object" &&
        !Array.isArray(request.body.book)
        ? request.body.book
        : {};

    const workTitle =
      normalizeOptionalString(
        book.workTitle ??
        request.body?.workTitle,
      );

    const author =
      normalizeOptionalString(
        book.author ??
        request.body?.author,
      );

    const coverUrl =
      normalizeOptionalString(
        book.coverUrl,
      );

    const firstPublicationYear =
      normalizeOptionalYear(
        book.firstPublicationYear,
      );

    const editionPublishedDate =
      normalizeOptionalString(
        book.editionPublishedDate,
      );

    const isbn =
      normalizeOptionalString(
        book.isbn,
      );

    const externalBookId =
      normalizeOptionalString(
        book.externalBookId,
      );

    const metadataSource =
      normalizeOptionalString(
        book.metadataSource,
      );

    if (!text) {
      return response.status(400).json({
        error:
          "Cole ou digite um trecho antes de gerar o resumo.",
      });
    }

    if (text.length < 20) {
      return response.status(400).json({
        error:
          "O trecho precisa possuir pelo menos 20 caracteres.",
      });
    }

    if (text.length > 30000) {
      return response.status(400).json({
        error:
          "O trecho ultrapassa o limite de 30.000 caracteres.",
      });
    }

    try {
      const summaryText =
        await generateLiterarySummary(text);

      const createdSummary =
        await prisma.summary.create({
          data: {
            userId:
              request.user.id,

            originalText:
              text,

            summaryText,

            /*
              Os campos continuam opcionais.
              Um resumo pode ser gerado sem identificar a obra.
            */
            workTitle:
              workTitle || null,

            author:
              author || null,

            coverUrl:
              coverUrl || null,

            firstPublicationYear,

            editionPublishedDate:
              editionPublishedDate || null,

            isbn:
              isbn || null,

            externalBookId:
              externalBookId || null,

            metadataSource:
              metadataSource || null,
          },
        });

      return response.status(201).json({
        message:
          "Resumo gerado com sucesso.",

        summary:
          serializeSummary(
            createdSummary,
          ),
      });
    } catch (error) {
      console.error(
        "Erro ao gerar resumo:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível gerar o resumo.",
      });
    }
  },
);

/* =====================================================
   HISTÓRICO
===================================================== */

router.get(
  "/history",
  async (request, response) => {
    try {
      const summaries =
        await prisma.summary.findMany({
          where: {
            userId: request.user.id,

            hiddenFromHistory: false,
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      return response.status(200).json({
        summaries:
          summaries.map(
            serializeSummary,
          ),
      });
    } catch (error) {
      console.error(
        "Erro ao carregar histórico:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível carregar o histórico.",
      });
    }
  },
);

/* =====================================================
   REMOVER UM REGISTRO DO HISTÓRICO
===================================================== */

router.patch(
  "/history/:summaryId/hide",
  async (request, response) => {
    const {
      summaryId,
    } = request.params;

    if (!isValidUuid(summaryId)) {
      return response.status(400).json({
        error:
          "Identificador de resumo inválido.",
      });
    }

    try {
      const updateResult =
        await prisma.summary.updateMany({
          where: {
            id: summaryId,
            userId: request.user.id,
            hiddenFromHistory: false,
          },

          data: {
            hiddenFromHistory: true,
          },
        });

      if (updateResult.count === 0) {
        return response.status(404).json({
          error:
            "Registro do histórico não encontrado.",
        });
      }

      return response.status(200).json({
        message:
          "Registro removido do histórico com sucesso.",
      });
    } catch (error) {
      console.error(
        "Erro ao remover registro do histórico:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível remover o registro do histórico.",
      });
    }
  },
);

/* =====================================================
   LIMPAR HISTÓRICO
===================================================== */

router.patch(
  "/history/clear",
  async (request, response) => {
    try {
      const updateResult =
        await prisma.summary.updateMany({
          where: {
            userId: request.user.id,
            hiddenFromHistory: false,
          },

          data: {
            hiddenFromHistory: true,
          },
        });

      return response.status(200).json({
        message:
          "Histórico limpo com sucesso.",

        hiddenCount:
          updateResult.count,
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
   BIBLIOTECA
===================================================== */

router.get(
  "/library",
  async (request, response) => {
    try {
      const summaries =
        await prisma.summary.findMany({
          where: {
            userId: request.user.id,
            saved: true,
          },

          orderBy: {
            updatedAt: "desc",
          },
        });

      return response.status(200).json({
        summaries:
          summaries.map(
            serializeSummary,
          ),
      });
    } catch (error) {
      console.error(
        "Erro ao carregar biblioteca:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível carregar a biblioteca.",
      });
    }
  },
);

/* =====================================================
   FAVORITOS
===================================================== */

router.get(
  "/favorites",
  async (request, response) => {
    try {
      const summaries =
        await prisma.summary.findMany({
          where: {
            userId: request.user.id,
            saved: true,
            favorite: true,
          },

          orderBy: {
            updatedAt: "desc",
          },
        });

      return response.status(200).json({
        summaries:
          summaries.map(
            serializeSummary,
          ),
      });
    } catch (error) {
      console.error(
        "Erro ao carregar favoritos:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível carregar os favoritos.",
      });
    }
  },
);

/* =====================================================
   ATUALIZAR TÍTULO, SALVAMENTO OU FAVORITO
===================================================== */

router.patch(
  "/:summaryId",
  async (request, response) => {
    const {
      summaryId,
    } = request.params;

    if (!isValidUuid(summaryId)) {
      return response.status(400).json({
        error:
          "Identificador de resumo inválido.",
      });
    }

    try {
      const currentSummary =
        await prisma.summary.findFirst({
          where: {
            id: summaryId,
            userId: request.user.id,
          },
        });

      if (!currentSummary) {
        return response.status(404).json({
          error:
            "Resumo não encontrado.",
        });
      }

      const updateData = {};

      if (
        Object.hasOwn(
          request.body,
          "title",
        )
      ) {
        const title =
          typeof request.body.title ===
            "string"
            ? request.body.title.trim()
            : "";

        if (title.length > 120) {
          return response.status(400).json({
            error:
              "O título deve possuir no máximo 120 caracteres.",
          });
        }

        updateData.title =
          title || null;
      }

      if (
        Object.hasOwn(
          request.body,
          "author",
        )
      ) {
        const author =
          typeof request.body.author ===
            "string"
            ? request.body.author.trim()
            : "";

        if (author.length > 120) {
          return response.status(400).json({
            error:
              "O nome do autor deve possuir no máximo 120 caracteres.",
          });
        }

        updateData.author =
          author || null;
      }

      if (
        typeof request.body?.saved ===
        "boolean"
      ) {
        updateData.saved =
          request.body.saved;
      }

      if (
        typeof request.body?.favorite ===
        "boolean"
      ) {
        updateData.favorite =
          request.body.favorite;
      }

      /*
        Um favorito sempre precisa estar salvo.
      */
      if (updateData.favorite === true) {
        updateData.saved = true;
      }

      /*
        Ao remover da biblioteca, removemos também
        a marcação de favorito.
      */
      if (updateData.saved === false) {
        updateData.favorite = false;
      }

      const finalSaved =
        updateData.saved ??
        currentSummary.saved;

      const finalTitle =
        updateData.title !== undefined
          ? updateData.title
          : currentSummary.title;

      if (
        finalSaved &&
        !finalTitle?.trim()
      ) {
        return response.status(400).json({
          error:
            "Informe um título antes de salvar o resumo.",
        });
      }

      if (
        Object.keys(updateData).length ===
        0
      ) {
        return response.status(400).json({
          error:
            "Nenhuma alteração foi informada.",
        });
      }

      const shouldNotifySaved =
        updateData.saved === true &&
        currentSummary.saved === false;

      const shouldNotifyFavorite =
        updateData.favorite === true &&
        currentSummary.favorite === false;

      const notificationSummaryTitle =
        finalTitle?.trim() ||
        "Resumo literário";

      const updatedSummary =
        await prisma.$transaction(
          async (transaction) => {
            const changedSummary =
              await transaction.summary.update({
                where: {
                  id: currentSummary.id,
                },

                data: updateData,
              });

            const userSettings =
              await transaction.userSettings.findUnique({
                where: {
                  userId: request.user.id,
                },

                select: {
                  notifyOnSave: true,
                  notifyOnFavorite: true,
                },
              });

            const notifyOnSave =
              userSettings?.notifyOnSave ?? true;

            const notifyOnFavorite =
              userSettings?.notifyOnFavorite ?? true;

            if (
              shouldNotifySaved &&
              notifyOnSave
            ) {
              await transaction.notification.create({
                data: {
                  userId: request.user.id,
                  summaryId:
                    changedSummary.id,

                  type: "saved",
                  title: "Resumo salvo",

                  message:
                    `“${notificationSummaryTitle}” foi adicionado à sua biblioteca.`,
                },
              });
            }

            if (
              shouldNotifyFavorite &&
              notifyOnFavorite
            ) {
              await transaction.notification.create({
                data: {
                  userId: request.user.id,
                  summaryId:
                    changedSummary.id,

                  type: "favorite",
                  title:
                    "Resumo favoritado",

                  message:
                    `“${notificationSummaryTitle}” foi adicionado aos favoritos.`,
                },
              });
            }

            return changedSummary;
          },
        );

      return response.status(200).json({
        message:
          "Resumo atualizado com sucesso.",

        summary:
          serializeSummary(
            updatedSummary,
          ),
      });
    } catch (error) {
      console.error(
        "Erro ao atualizar resumo:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível atualizar o resumo.",
      });
    }
  },
);

/* =====================================================
   EXCLUIR
===================================================== */

router.delete(
  "/:summaryId",
  async (request, response) => {
    const {
      summaryId,
    } = request.params;

    if (!isValidUuid(summaryId)) {
      return response.status(400).json({
        error:
          "Identificador de resumo inválido.",
      });
    }

    try {
      const deletionResult =
        await prisma.summary.deleteMany({
          where: {
            id: summaryId,
            userId: request.user.id,
          },
        });

      if (deletionResult.count === 0) {
        return response.status(404).json({
          error:
            "Resumo não encontrado.",
        });
      }

      return response.status(200).json({
        message:
          "Resumo excluído com sucesso.",
      });
    } catch (error) {
      console.error(
        "Erro ao excluir resumo:",
        error,
      );

      return response.status(500).json({
        error:
          "Não foi possível excluir o resumo.",
      });
    }
  },
);

export default router;