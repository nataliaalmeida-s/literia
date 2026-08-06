import jwt from "jsonwebtoken";

export const SESSION_COOKIE_NAME =
  "literia_session";

const SESSION_MAX_AGE_MS =
  7 * 24 * 60 * 60 * 1000;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET não foi definido ou é muito curto.",
    );
  }

  return secret;
}

export function createSessionToken(
  userId,
  sessionVersion = 0,
) {
  return jwt.sign(
    {
      /*
        A versão permite invalidar sessões
        criadas antes de uma troca de senha.
      */
      sv: sessionVersion,
    },
    getJwtSecret(),
    {
      algorithm: "HS256",
      subject: userId,
      expiresIn: "7d",
    },
  );
}

export function verifySessionToken(token) {
  return jwt.verify(
    token,
    getJwtSecret(),
    {
      algorithms: ["HS256"],
    },
  );
}

function getCookieSameSite() {
  const configuredValue =
    process.env
      .COOKIE_SAME_SITE
      ?.trim()
      .toLowerCase();

  if (
    configuredValue === "strict" ||
    configuredValue === "lax" ||
    configuredValue === "none"
  ) {
    return configuredValue;
  }

  /*
    Desenvolvimento local usa Lax.
    Em produção escolheremos conforme
    os domínios do frontend e da API.
  */
  return "lax";
}

export function getSessionCookieOptions() {
  const isProduction =
    process.env.NODE_ENV ===
    "production";

  return {
    httpOnly: true,

    /*
      Cookies Secure só são enviados
      por HTTPS.
    */
    secure: isProduction,

    sameSite:
      getCookieSameSite(),

    path: "/",

    maxAge:
      SESSION_MAX_AGE_MS,
  };
}

export function getClearSessionCookieOptions() {
  const {
    maxAge,
    ...cookieOptions
  } = getSessionCookieOptions();

  return cookieOptions;
}