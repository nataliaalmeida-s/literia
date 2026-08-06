import {
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import {
  BookOpen,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
  Sparkles,
} from "lucide-react";

import {
  useAuth,
} from "../contexts/AuthContext";

import "./Auth.css";

export default function LoginPage() {
  const {
    login,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(
    () => location.state?.email || "",
  );

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError(
        "Preencha o e-mail e a senha.",
      );

      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      const previousPath =
        location.state?.from?.pathname ||
        "/";

      navigate(previousPath, {
        replace: true,
      });
    } catch (requestError) {
      setError(requestError.message);
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
              Literatura e inteligência
            </span>

            <h1>
              Transforme leituras em compreensão.
            </h1>

            <p>
              Gere sínteses, organize seus resumos e
              reencontre suas leituras em um só lugar.
            </p>

            <div className="auth-feature">
              <Sparkles size={19} />

              <span>
                Resumos claros e acessíveis com IA
              </span>
            </div>
          </div>
        </aside>

        <div className="auth-form-panel">
          <header className="auth-form-header">
            <span>Bem-vindo(a)</span>

            <h2>Entre na sua conta</h2>

            <p>
              Acesse sua conta para continuar no LiterIA.
            </p>
          </header>

          {location.state?.accountCreated && (
            <p
              className="auth-success"
              role="status"
            >
              Conta criada com sucesso. Agora entre para acessar o LiterIA.
            </p>
          )}

          {location.state?.accountDeleted && (
            <p
              className="auth-success"
              role="status"
            >
              Sua conta foi encerrada com sucesso.
            </p>
          )}

          {location.state?.passwordChanged && (
            <p
              className="auth-success"
              role="status"
            >
              Senha alterada com sucesso. Entre novamente
              usando sua nova senha.
            </p>
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
                  }}
                  placeholder="seuemail@exemplo.com"
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Senha</span>

              <div className="auth-input">
                <LockKeyhole size={18} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => {
                    setPassword(
                      event.target.value,
                    );

                    setError("");
                  }}
                  placeholder="Digite sua senha"
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
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

            <div className="auth-form-helper">
              <Link
                to="/esqueci-senha"
                state={{
                  email: email.trim(),
                }}
                className="auth-forgot-password-link"
              >
                Esqueci minha senha
              </Link>
            </div>

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
              <LogIn size={18} />

              {isSubmitting
                ? "Entrando..."
                : "Entrar"}
            </button>
          </form>

          <p className="auth-switch-page">
            Ainda não possui uma conta?

            <Link to="/cadastro">
              Criar cadastro
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}