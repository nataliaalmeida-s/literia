import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import authRoutes from "./src/routes/authRoutes.js";
import summaryRoutes from "./src/routes/summaryRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import settingsRoutes from "./src/routes/settingsRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import accountRoutes from "./src/routes/accountRoutes.js";
import bookRoutes from "./src/routes/bookRoutes.js";

const app = express();

const isProduction =
  process.env.NODE_ENV ===
  "production";

const PORT =
  Number(process.env.PORT) || 3000;

const primaryFrontendUrl = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
).replace(/\/+$/, "");

const additionalFrontendUrls = (
  process.env
    .ADDITIONAL_FRONTEND_URLS ||
  ""
)
  .split(",")
  .map((url) =>
    url.trim().replace(/\/+$/, ""),
  )
  .filter(Boolean);

const allowedOrigins =
  new Set([
    primaryFrontendUrl,
    ...additionalFrontendUrls,
  ]);

/*
  Hospedagens normalmente colocam o Express
  atrás de um proxy reverso.

  Isso também permite que o limitador de
  requisições reconheça corretamente o IP.
*/
if (isProduction) {
  const configuredProxyHops =
    Number(
      process.env
        .TRUST_PROXY_HOPS ||
      1,
    );

  app.set(
    "trust proxy",
    Number.isInteger(
      configuredProxyHops,
    ) &&
      configuredProxyHops > 0
      ? configuredProxyHops
      : 1,
  );
}

/*
  Remove o cabeçalho que identifica
  automaticamente o Express.
*/
app.disable("x-powered-by");

/*
  Adiciona cabeçalhos de segurança.
*/
app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      /*
        Requisições sem Origin incluem
        PowerShell, curl e comunicação
        entre servidores.
      */
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.has(origin)
      ) {
        return callback(null, true);
      }

      return callback(null, false);
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
    ],
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(cookieParser());

/* =====================================================
   ROTAS
===================================================== */

app.use(
  "/api/auth",
  authRoutes,
);

app.use(
  "/api/summaries",
  summaryRoutes,
);

app.use(
  "/api/notifications",
  notificationRoutes,
);

app.use(
  "/api/settings",
  settingsRoutes,
);

app.use(
  "/api/profile",
  profileRoutes,
);

app.use(
  "/api/account",
  accountRoutes,
);

app.use("/api/books", bookRoutes);

/* =====================================================
   TESTE DA API
===================================================== */

app.get(
  "/api/health",
  (request, response) => {
    response.status(200).json({
      status: "ok",
      application: "LiterIA API",
      timestamp:
        new Date().toISOString(),
    });
  },
);

/* =====================================================
   ROTA NÃO ENCONTRADA
===================================================== */

app.use((request, response) => {
  response.status(404).json({
    error:
      "Rota não encontrada.",
  });
});

/* =====================================================
   TRATAMENTO DE ERRO INESPERADO
===================================================== */

app.use(
  (
    error,
    request,
    response,
    next,
  ) => {
    console.error(
      "Erro inesperado na API:",
      error,
    );

    return response.status(500).json({
      error:
        "Ocorreu um erro inesperado no servidor.",
    });
  },
);

app.listen(PORT, () => {
  console.log(
    `LiterIA API rodando em http://localhost:${PORT}`,
  );
});