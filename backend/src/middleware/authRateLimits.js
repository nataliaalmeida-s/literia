import {
  rateLimit,
} from "express-rate-limit";

const FIFTEEN_MINUTES_MS =
  15 * 60 * 1000;

export const forgotPasswordLimiter =
  rateLimit({
    windowMs:
      FIFTEEN_MINUTES_MS,

    /*
      Até cinco e-mails de recuperação
      por endereço IP a cada 15 minutos.
    */
    limit: 5,

    standardHeaders: true,
    legacyHeaders: false,

    message: {
      error:
        "Muitas solicitações de recuperação foram realizadas. Aguarde alguns minutos e tente novamente.",
    },
  });

export const resetPasswordLimiter =
  rateLimit({
    windowMs:
      FIFTEEN_MINUTES_MS,

    /*
      Permite algumas tentativas adicionais
      para erros de digitação ou links expirados.
    */
    limit: 10,

    standardHeaders: true,
    legacyHeaders: false,

    message: {
      error:
        "Muitas tentativas de redefinição foram realizadas. Aguarde alguns minutos e tente novamente.",
    },
  });