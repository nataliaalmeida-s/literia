import {
  useEffect,
  useState,
} from "react";

import {
  AlertTriangle,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router";

import {
  apiRequest,
} from "../../services/api";

import {
  useAuth,
} from "../../contexts/AuthContext";

import "./Profile.css";

function formatAccountDate(dateValue) {
  if (!dateValue) {
    return "Data não informada";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(date);
}

export default function Profile() {
  const navigate = useNavigate();

  const {
    updateCurrentUser,
    deleteAccount,
    clearCurrentUser,
  } = useAuth();

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  /* =====================================================
     NOME
  ===================================================== */

  const [name, setName] =
    useState("");

  const [
    isSavingName,
    setIsSavingName,
  ] = useState(false);

  const [
    nameMessage,
    setNameMessage,
  ] = useState("");

  const [
    nameError,
    setNameError,
  ] = useState("");

  /* =====================================================
     E-MAIL
  ===================================================== */

  const [newEmail, setNewEmail] =
    useState("");

  const [
    emailPassword,
    setEmailPassword,
  ] = useState("");

  const [
    showEmailPassword,
    setShowEmailPassword,
  ] = useState(false);

  const [
    isSavingEmail,
    setIsSavingEmail,
  ] = useState(false);

  const [
    emailMessage,
    setEmailMessage,
  ] = useState("");

  const [
    emailError,
    setEmailError,
  ] = useState("");

  /* =====================================================
     SENHA
  ===================================================== */

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    isSavingPassword,
    setIsSavingPassword,
  ] = useState(false);

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  /* =====================================================
     EXCLUSÃO DA CONTA
  ===================================================== */

  const [
    isDeleteModalOpen,
    setIsDeleteModalOpen,
  ] = useState(false);

  const [
    deletePassword,
    setDeletePassword,
  ] = useState("");

  const [
    deleteConfirmation,
    setDeleteConfirmation,
  ] = useState("");

  const [
    showDeletePassword,
    setShowDeletePassword,
  ] = useState(false);

  const [
    deleteError,
    setDeleteError,
  ] = useState("");

  const [
    isDeletingAccount,
    setIsDeletingAccount,
  ] = useState(false);

  /* =====================================================
     CARREGAMENTO
  ===================================================== */

  async function loadProfile() {
    setIsLoading(true);
    setLoadError("");

    try {
      const data = await apiRequest(
        "/api/profile",
      );

      setProfile(data.user);
      setName(data.user.name);
      setNewEmail(data.user.email);
    } catch (requestError) {
      setLoadError(
        requestError.message ||
          "Não foi possível carregar o perfil.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  /* =====================================================
     ALTERAR NOME
  ===================================================== */

  async function handleSaveName(event) {
    event.preventDefault();

    const normalizedName =
      name.trim();

    setNameError("");
    setNameMessage("");

    if (
      normalizedName.length < 2 ||
      normalizedName.length > 80
    ) {
      setNameError(
        "O nome deve possuir entre 2 e 80 caracteres.",
      );

      return;
    }

    if (
      normalizedName === profile?.name
    ) {
      return;
    }

    setIsSavingName(true);

    try {
      const data = await apiRequest(
        "/api/profile/name",
        {
          method: "PATCH",

          body: JSON.stringify({
            name: normalizedName,
          }),
        },
      );

      setProfile(data.user);
      setName(data.user.name);

      updateCurrentUser(data.user);

      setNameMessage(
        "Nome atualizado com sucesso.",
      );
    } catch (requestError) {
      setNameError(
        requestError.message ||
          "Não foi possível atualizar o nome.",
      );
    } finally {
      setIsSavingName(false);
    }
  }

  /* =====================================================
     ALTERAR E-MAIL
  ===================================================== */

  async function handleSaveEmail(event) {
    event.preventDefault();

    const normalizedEmail =
      newEmail
        .trim()
        .toLowerCase();

    setEmailError("");
    setEmailMessage("");

    if (!normalizedEmail) {
      setEmailError(
        "Informe o novo e-mail.",
      );

      return;
    }

    if (!emailPassword) {
      setEmailError(
        "Digite sua senha atual para confirmar.",
      );

      return;
    }

    if (
      normalizedEmail === profile?.email
    ) {
      setEmailError(
        "O novo e-mail é igual ao e-mail atual.",
      );

      return;
    }

    setIsSavingEmail(true);

    try {
      const data = await apiRequest(
        "/api/profile/email",
        {
          method: "PATCH",

          body: JSON.stringify({
            email: normalizedEmail,
            password: emailPassword,
          }),
        },
      );

      setProfile(data.user);
      setNewEmail(data.user.email);
      setEmailPassword("");

      updateCurrentUser(data.user);

      setEmailMessage(
        "E-mail atualizado com sucesso.",
      );
    } catch (requestError) {
      setEmailError(
        requestError.message ||
          "Não foi possível atualizar o e-mail.",
      );
    } finally {
      setIsSavingEmail(false);
    }
  }

  /* =====================================================
     ALTERAR SENHA
  ===================================================== */

  async function handleSavePassword(
    event,
  ) {
    event.preventDefault();

    setPasswordError("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        "Preencha todos os campos de senha.",
      );

      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "A nova senha deve possuir pelo menos 8 caracteres.",
      );

      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setPasswordError(
        "A confirmação da nova senha não corresponde.",
      );

      return;
    }

    setIsSavingPassword(true);

    try {
      await apiRequest(
        "/api/profile/password",
        {
          method: "PATCH",

          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        },
      );

      clearCurrentUser();

      navigate("/login", {
        replace: true,

        state: {
          passwordChanged: true,
        },
      });
    } catch (requestError) {
      setPasswordError(
        requestError.message ||
          "Não foi possível atualizar a senha.",
      );
    } finally {
      setIsSavingPassword(false);
    }
  }

  /* =====================================================
     EXCLUIR CONTA
  ===================================================== */

  function openDeleteModal() {
    setDeletePassword("");
    setDeleteConfirmation("");
    setDeleteError("");
    setShowDeletePassword(false);
    setIsDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    if (isDeletingAccount) {
      return;
    }

    setIsDeleteModalOpen(false);
    setDeletePassword("");
    setDeleteConfirmation("");
    setDeleteError("");
  }

  async function handleDeleteAccount(
    event,
  ) {
    event.preventDefault();

    setDeleteError("");

    if (!deletePassword) {
      setDeleteError(
        "Digite sua senha atual.",
      );

      return;
    }

    if (
      deleteConfirmation.trim() !==
      "EXCLUIR"
    ) {
      setDeleteError(
        'Digite exatamente "EXCLUIR" para confirmar.',
      );

      return;
    }

    setIsDeletingAccount(true);

    try {
      await deleteAccount({
        password: deletePassword,
        confirmation:
          deleteConfirmation.trim(),
      });

      navigate("/login", {
        replace: true,

        state: {
          accountDeleted: true,
        },
      });
    } catch (requestError) {
      setDeleteError(
        requestError.message ||
          "Não foi possível excluir a conta.",
      );
    } finally {
      setIsDeletingAccount(false);
    }
  }

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <span />
          <strong>
            Carregando perfil...
          </strong>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="profile-page">
        <div className="profile-feedback profile-feedback--error">
          <p>{loadError}</p>

          <button
            type="button"
            onClick={loadProfile}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <section className="profile-section">
        <header className="profile-header">
          <div>
            <span className="profile-eyebrow">
              Sua conta no LiterIA
            </span>

            <h1>Meu perfil</h1>

            <p>
              Atualize seus dados pessoais e
              proteja o acesso à sua conta.
            </p>
          </div>

          <span
            className="profile-header-icon"
            aria-hidden="true"
          >
            <UserRound size={35} />
          </span>
        </header>

        <div className="profile-overview">
          <span className="profile-overview-avatar">
            <UserRound size={31} />
          </span>

          <div>
            <span>Conta ativa</span>
            <h2>{profile.name}</h2>
            <p>{profile.email}</p>
          </div>

          <div className="profile-created-at">
            <CalendarDays size={17} />

            <span>
              Conta criada em{" "}
              {formatAccountDate(
                profile.createdAt,
              )}
            </span>
          </div>
        </div>

        <div className="profile-grid">
          {/* NOME */}
          <form
            className="profile-card"
            onSubmit={handleSaveName}
          >
            <header className="profile-card-header">
              <span className="profile-card-icon">
                <UserRound size={22} />
              </span>

              <div>
                <span>Dados pessoais</span>
                <h2>Nome de exibição</h2>
              </div>
            </header>

            <label className="profile-field">
              <span>Nome</span>

              <input
                type="text"
                value={name}
                maxLength={80}
                onChange={(event) => {
                  setName(
                    event.target.value,
                  );

                  setNameError("");
                  setNameMessage("");
                }}
              />

              <small>
                Esse nome aparecerá na
                barra lateral.
              </small>
            </label>

            {nameError && (
              <p className="profile-form-error">
                {nameError}
              </p>
            )}

            {nameMessage && (
              <p className="profile-form-success">
                <Check size={16} />
                {nameMessage}
              </p>
            )}

            <footer className="profile-card-actions">
              <button
                type="submit"
                disabled={
                  !name.trim() ||
                  name.trim() ===
                    profile.name ||
                  isSavingName
                }
              >
                <Save size={17} />

                {isSavingName
                  ? "Salvando..."
                  : "Salvar nome"}
              </button>
            </footer>
          </form>

          {/* E-MAIL */}
          <form
            className="profile-card"
            onSubmit={handleSaveEmail}
          >
            <header className="profile-card-header">
              <span className="profile-card-icon profile-card-icon--email">
                <Mail size={22} />
              </span>

              <div>
                <span>Contato</span>
                <h2>Alterar e-mail</h2>
              </div>
            </header>

            <label className="profile-field">
              <span>Novo e-mail</span>

              <input
                type="email"
                value={newEmail}
                maxLength={254}
                autoComplete="email"
                onChange={(event) => {
                  setNewEmail(
                    event.target.value,
                  );

                  setEmailError("");
                  setEmailMessage("");
                }}
              />
            </label>

            <label className="profile-field">
              <span>
                Confirme sua senha atual
              </span>

              <div className="profile-password-wrap">
                <input
                  type={
                    showEmailPassword
                      ? "text"
                      : "password"
                  }
                  value={emailPassword}
                  autoComplete="current-password"
                  onChange={(event) => {
                    setEmailPassword(
                      event.target.value,
                    );

                    setEmailError("");
                  }}
                  placeholder="Digite sua senha"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowEmailPassword(
                      (currentValue) =>
                        !currentValue,
                    )
                  }
                  aria-label={
                    showEmailPassword
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >
                  {showEmailPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            {emailError && (
              <p className="profile-form-error">
                {emailError}
              </p>
            )}

            {emailMessage && (
              <p className="profile-form-success">
                <Check size={16} />
                {emailMessage}
              </p>
            )}

            <footer className="profile-card-actions">
              <button
                type="submit"
                disabled={
                  !newEmail.trim() ||
                  !emailPassword ||
                  newEmail
                    .trim()
                    .toLowerCase() ===
                    profile.email ||
                  isSavingEmail
                }
              >
                <Save size={17} />

                {isSavingEmail
                  ? "Atualizando..."
                  : "Atualizar e-mail"}
              </button>
            </footer>
          </form>
        </div>

        {/* SENHA */}
        <form
          className="profile-card profile-security-card"
          onSubmit={handleSavePassword}
        >
          <header className="profile-card-header">
            <span className="profile-card-icon profile-card-icon--security">
              <ShieldCheck size={22} />
            </span>

            <div>
              <span>Segurança</span>
              <h2>Alterar senha</h2>
            </div>
          </header>

          <div className="profile-password-grid">
            <label className="profile-field">
              <span>Senha atual</span>

              <div className="profile-password-wrap">
                <input
                  type={
                    showCurrentPassword
                      ? "text"
                      : "password"
                  }
                  value={currentPassword}
                  autoComplete="current-password"
                  onChange={(event) => {
                    setCurrentPassword(
                      event.target.value,
                    );

                    setPasswordError("");
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrentPassword(
                      (currentValue) =>
                        !currentValue,
                    )
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            <label className="profile-field">
              <span>Nova senha</span>

              <div className="profile-password-wrap">
                <input
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  value={newPassword}
                  minLength={8}
                  autoComplete="new-password"
                  onChange={(event) => {
                    setNewPassword(
                      event.target.value,
                    );

                    setPasswordError("");
                  }}
                  placeholder="Mínimo de 8 caracteres"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(
                      (currentValue) =>
                        !currentValue,
                    )
                  }
                >
                  {showNewPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            <label className="profile-field">
              <span>
                Confirmar nova senha
              </span>

              <div className="profile-password-wrap">
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  minLength={8}
                  autoComplete="new-password"
                  onChange={(event) => {
                    setConfirmPassword(
                      event.target.value,
                    );

                    setPasswordError("");
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (currentValue) =>
                        !currentValue,
                    )
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>
          </div>

          {passwordError && (
            <p className="profile-form-error">
              {passwordError}
            </p>
          )}

          <footer className="profile-card-actions">
            <button
              type="submit"
              disabled={
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                isSavingPassword
              }
            >
              <KeyRound size={17} />

              {isSavingPassword
                ? "Alterando..."
                : "Alterar senha"}
            </button>
          </footer>
        </form>

        {/* EXCLUSÃO */}
        <section className="profile-danger-section">
          <div className="profile-danger-main">
            <span className="profile-danger-icon">
              <AlertTriangle size={23} />
            </span>

            <div>
              <span>
                Zona sensível
              </span>

              <h2>Encerrar conta</h2>

              <p>
                Exclui permanentemente sua conta,
                resumos, configurações e
                notificações.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="profile-delete-account-button"
            onClick={openDeleteModal}
          >
            <Trash2 size={17} />
            Excluir minha conta
          </button>
        </section>
      </section>

      {isDeleteModalOpen && (
        <div
          className="profile-delete-backdrop"
          role="presentation"
          onMouseDown={closeDeleteModal}
        >
          <form
            className="profile-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-delete-title"
            onSubmit={
              handleDeleteAccount
            }
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="profile-delete-modal-header">
              <div>
                <span>Zona sensível</span>

                <h2 id="profile-delete-title">
                  Excluir conta
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={
                  isDeletingAccount
                }
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </header>

            <div className="profile-delete-warning">
              <AlertTriangle size={22} />

              <p>
                Esta ação é permanente e
                não poderá ser desfeita.
              </p>
            </div>

            <label className="profile-field">
              <span>Senha atual</span>

              <div className="profile-password-wrap">
                <input
                  type={
                    showDeletePassword
                      ? "text"
                      : "password"
                  }
                  value={deletePassword}
                  autoComplete="current-password"
                  onChange={(event) => {
                    setDeletePassword(
                      event.target.value,
                    );

                    setDeleteError("");
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowDeletePassword(
                      (currentValue) =>
                        !currentValue,
                    )
                  }
                >
                  {showDeletePassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            <label className="profile-field">
              <span>
                Digite EXCLUIR para confirmar
              </span>

              <input
                type="text"
                value={deleteConfirmation}
                autoComplete="off"
                onChange={(event) => {
                  setDeleteConfirmation(
                    event.target.value,
                  );

                  setDeleteError("");
                }}
                placeholder="EXCLUIR"
              />
            </label>

            {deleteError && (
              <p className="profile-form-error">
                {deleteError}
              </p>
            )}

            <footer className="profile-delete-actions">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={
                  isDeletingAccount
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  !deletePassword ||
                  deleteConfirmation.trim() !==
                    "EXCLUIR" ||
                  isDeletingAccount
                }
              >
                <Trash2 size={17} />

                {isDeletingAccount
                  ? "Excluindo..."
                  : "Excluir definitivamente"}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}