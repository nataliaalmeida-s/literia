import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router";

import {
  BookOpen,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
  UserPlus,
} from "lucide-react";

import {
  useAuth,
} from "../contexts/AuthContext";

import "./Auth.css";

export default function RegisterPage() {
  const {
    register,
  } = useAuth();

  const navigate = useNavigate();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

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

  const [error, setError] =
    useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError(
        "Preencha todos os campos.",
      );

      return;
    }

    if (password.length < 8) {
      setError(
        "A senha deve possuir pelo menos 8 caracteres.",
      );

      return;
    }

    if (password !== confirmPassword) {
      setError(
        "As senhas informadas não coincidem.",
      );

      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigate("/login", {
        replace: true,

        state: {
          accountCreated: true,
          email: email.trim(),
        },
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
              Sua jornada literária
            </span>

            <h1>
              Uma biblioteca de ideias feita para você.
            </h1>

            <p>
              Crie sua conta para salvar, favoritar e
              acompanhar todos os resumos gerados.
            </p>

            <div className="auth-feature">
              <Sparkles size={19} />

              <span>
                Seus resumos protegidos por conta
              </span>
            </div>
          </div>
        </aside>

        <div className="auth-form-panel">
          <header className="auth-form-header">
            <span>Comece agora</span>

            <h2>Crie sua conta</h2>

            <p>
              Preencha seus dados para entrar no LiterIA.
            </p>
          </header>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <label className="auth-field">
              <span>Nome</span>

              <div className="auth-input">
                <UserRound size={18} />

                <input
                  type="text"
                  value={name}
                  maxLength={80}
                  autoComplete="name"
                  onChange={(event) => {
                    setName(
                      event.target.value,
                    );

                    setError("");
                  }}
                  placeholder="Como deseja ser chamado(a)?"
                />
              </div>
            </label>

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
                  autoComplete="new-password"
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

            <label className="auth-field">
              <span>Confirmar senha</span>

              <div className="auth-input">
                <LockKeyhole size={18} />

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
              <UserPlus size={18} />

              {isSubmitting
                ? "Criando conta..."
                : "Criar conta"}
            </button>
          </form>

          <p className="auth-switch-page">
            Já possui uma conta?

            <Link to="/login">
              Entrar
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}