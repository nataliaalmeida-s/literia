import {
  useState,
} from "react";

import {
  Link,
  useLocation,
} from "react-router";

import {
  ArrowLeft,
  BookOpen,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  apiRequest,
} from "../services/api";

import "./Auth.css";

export default function ForgotPasswordPage() {
  const location = useLocation();

  const [
    email,
    setEmail,
  ] = useState(
    () =>
      location.state?.email || "",
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanEmail =
      email.trim();

    setError("");
    setMessage("");

    if (!cleanEmail) {
      setError(
        "Informe o e-mail associado à sua conta.",
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const data = await apiRequest(
        "/api/auth/forgot-password",
        {
          method: "POST",

          body: JSON.stringify({
            email: cleanEmail,
          }),
        },
      );

      setMessage(
        data?.message ||
          "Se existir uma conta associada a este e-mail, enviaremos as instruções para redefinir a senha.",
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Não foi possível solicitar a recuperação da senha.",
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
              Recuperação segura
            </span>

            <h1>
              Volte às suas leituras com tranquilidade.
            </h1>

            <p>
              Solicite um link temporário para criar uma
              nova senha e recuperar o acesso à sua
              biblioteca.
            </p>

            <div className="auth-feature">
              <ShieldCheck size={19} />

              <span>
                Link protegido e de uso único
              </span>
            </div>
          </div>
        </aside>

        <div className="auth-form-panel">
          <header className="auth-form-header">
            <span>Recupere seu acesso</span>

            <h2>Esqueceu sua senha?</h2>

            <p>
              Informe o e-mail utilizado no cadastro.
            </p>
          </header>

          {message && (
            <div
              className="auth-recovery-message"
              role="status"
            >
              <span className="auth-recovery-message-icon">
                <Sparkles size={20} />
              </span>

              <div>
                <strong>
                  Solicitação recebida
                </strong>

                <p>{message}</p>
              </div>
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <label className="auth-field">
              <span>E-mail</span>

              <div className="auth-input">
                <Mail size={18} />

                <input
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={(event) => {
                    setEmail(
                      event.target.value,
                    );

                    setError("");
                    setMessage("");
                  }}
                  placeholder="seuemail@exemplo.com"
                />
              </div>
            </label>

            {error && (
              <p
                className="auth-error"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="auth-submit-button"
              disabled={isSubmitting}
            >
              <Send size={18} />

              {isSubmitting
                ? "Enviando..."
                : message
                  ? "Enviar novamente"
                  : "Enviar instruções"}
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