import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router";

import {
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import {
  apiRequest,
} from "../services/api";

import "./Auth.css";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [
    searchParameters,
  ] = useSearchParams();

  const token =
    searchParameters
      .get("token")
      ?.trim() || "";

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const tokenMissing =
    !token;

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!token) {
      setError(
        "O link de recuperação não possui um token válido.",
      );

      return;
    }

    if (
      !password ||
      !confirmPassword
    ) {
      setError(
        "Preencha a nova senha e a confirmação.",
      );

      return;
    }

    if (password.length < 8) {
      setError(
        "A senha deve possuir pelo menos 8 caracteres.",
      );

      return;
    }

    const passwordByteLength =
      new TextEncoder()
        .encode(password)
        .length;

    if (passwordByteLength > 72) {
      setError(
        "A senha informada é muito longa.",
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "As senhas informadas não coincidem.",
      );

      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest(
        "/api/auth/reset-password",
        {
          method: "POST",

          body: JSON.stringify({
            token,
            password,
            confirmPassword,
          }),
        },
      );

      navigate("/login", {
        replace: true,

        state: {
          passwordChanged: true,
        },
      });
    } catch (requestError) {
      setError(
        requestError.message ||
          "Não foi possível redefinir a senha.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <aside className="auth-presentation">
          <div className="auth-brand">
            <span>
              <BookOpen size={25} />
            </span>

            <strong>LiterIA</strong>
          </div>

          <div className="auth-presentation-content">
            <span className="auth-eyebrow">
              Novo acesso
            </span>

            <h1>
              Uma nova senha, o mesmo caminho de leitura.
            </h1>

            <p>
              Crie uma senha segura para voltar aos seus
              resumos, favoritos e registros literários.
            </p>

            <div className="auth-feature">
              <ShieldCheck size={19} />

              <span>
                Suas sessões anteriores serão encerradas
              </span>
            </div>
          </div>
        </aside>

        <div className="auth-form-panel">
          <header className="auth-form-header">
            <span>Redefinição de senha</span>

            <h2>Crie uma nova senha</h2>

            <p>
              Use pelo menos oito caracteres.
            </p>
          </header>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <label className="auth-field">
              <span>Nova senha</span>

              <div className="auth-input">
                <LockKeyhole size={18} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  autoComplete="new-password"
                  autoFocus
                  onChange={(event) => {
                    setPassword(
                      event.target.value,
                    );

                    setError("");
                  }}
                  placeholder="Mínimo de 8 caracteres"
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => {
                    setShowPassword(
                      (current) =>
                        !current,
                    );
                  }}
                  aria-label={
                    showPassword
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            <label className="auth-field">
              <span>Confirmar nova senha</span>

              <div className="auth-input">
                <KeyRound size={18} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  autoComplete="new-password"
                  onChange={(event) => {
                    setConfirmPassword(
                      event.target.value,
                    );

                    setError("");
                  }}
                  placeholder="Digite a senha novamente"
                />
              </div>
            </label>

            <p className="auth-password-guidance">
              O link pode ser utilizado apenas uma vez e
              expira após 30 minutos.
            </p>

            {(tokenMissing || error) && (
              <p
                className="auth-error"
                role="alert"
              >
                {tokenMissing
                  ? "Este link de recuperação está incompleto. Solicite um novo link."
                  : error}
              </p>
            )}

            <button
              type="submit"
              className="auth-submit-button"
              disabled={
                isSubmitting ||
                tokenMissing
              }
            >
              <KeyRound size={18} />

              {isSubmitting
                ? "Redefinindo..."
                : "Redefinir senha"}
            </button>
          </form>

          <Link
            to="/login"
            className="auth-back-link"
          >
            <ArrowLeft size={16} />

            Voltar ao login
          </Link>
        </div>
      </section>
    </main>
  );
}