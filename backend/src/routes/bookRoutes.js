import {
  Router,
} from "express";

import {
  requireAuth,
} from "../middleware/requireAuth.js";

import {
  searchBookMetadata,
} from "../services/bookMetadataService.js";

const router = Router();

router.use(requireAuth);

/* =====================================================
   PESQUISAR OBRAS
===================================================== */

router.get(
  "/search",
  async (request, response) => {
    const title =
      typeof request.query?.title ===
      "string"
        ? request.query.title.trim()
        : "";

    const author =
      typeof request.query?.author ===
      "string"
        ? request.query.author.trim()
        : "";

    if (!title && !author) {
      return response.status(400).json({
        error:
          "Informe o título da obra ou o nome do autor.",
      });
    }

    if (title.length > 200) {
      return response.status(400).json({
        error:
          "O título da obra deve possuir no máximo 200 caracteres.",
      });
    }

    if (author.length > 160) {
      return response.status(400).json({
        error:
          "O nome do autor deve possuir no máximo 160 caracteres.",
      });
    }

    try {
      const books =
        await searchBookMetadata({
          title,
          author,
          limit: 3,
        });

      return response.status(200).json({
        query: {
          title,
          author,
        },

        books,
      });
    } catch (error) {
      console.error(
        "Erro ao pesquisar obras:",
        error,
      );

      return response.status(503).json({
        error:
          "Não foi possível consultar os catálogos de livros agora.",
      });
    }
  },
);

export default router;