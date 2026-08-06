import { prisma } from "../lib/prisma.js";

import {
  getClearSessionCookieOptions,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "../lib/session.js";

export async function requireAuth(
  request,
  response,
  next,
) {
  const token =
    request.cookies?.[SESSION_COOKIE_NAME];

  if (!token) {
    return response.status(401).json({
      error: "Autenticação necessária.",
    });
  }

  let decodedToken;

  try {
    decodedToken =
      verifySessionToken(token);
  } catch {
    response.clearCookie(
      SESSION_COOKIE_NAME,
      getClearSessionCookieOptions(),
    );

    return response.status(401).json({
      error:
        "Sua sessão é inválida ou expirou.",
    });
  }

  const userId =
    typeof decodedToken === "object" &&
      typeof decodedToken.sub === "string"
      ? decodedToken.sub
      : "";
  /*
    Tokens criados antes da implantação deste
    recurso não possuem "sv". Eles são tratados
    como versão 0, mantendo as sessões atuais.
  */
  const tokenSessionVersion =
    typeof decodedToken === "object" &&
      Number.isInteger(decodedToken.sv)
      ? decodedToken.sv
      : 0;

  if (!userId) {
    response.clearCookie(
      SESSION_COOKIE_NAME,
      getClearSessionCookieOptions(),
    );

    return response.status(401).json({
      error: "Sessão inválida.",
    });
  }

  try {
    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          name: true,
          email: true,
          sessionVersion: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    if (!user) {
      response.clearCookie(
        SESSION_COOKIE_NAME,
        getClearSessionCookieOptions(),
      );

      return response.status(401).json({
        error:
          "O usuário desta sessão não existe.",
      });
    }

    if (
      user.sessionVersion !==
      tokenSessionVersion
    ) {
      response.clearCookie(
        SESSION_COOKIE_NAME,
        getClearSessionCookieOptions(),
      );

      return response.status(401).json({
        error:
          "Sua sessão foi encerrada após uma alteração de senha.",
      });
    }

    const {
      sessionVersion,
      ...publicUser
    } = user;

    request.user = publicUser;

    return next();
  } catch (error) {
    console.error(
      "Erro ao verificar autenticação:",
      error,
    );

    return response.status(500).json({
      error:
        "Não foi possível verificar a sessão.",
    });
  }
}