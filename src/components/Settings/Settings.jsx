import {
  useEffect,
  useState,
} from "react";

import {
  Bell,
  BookOpen,
  Check,
  Clock3,
  Heart,
  RotateCcw,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";

import {
  apiRequest,
} from "../../services/api";

import {
  notifyNotificationsChanged,
} from "../../utils/notificationEvents";

import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";

import "./Settings.css";

const DEFAULT_PREFERENCES = {
  notifyOnSave: true,
  notifyOnFavorite: true,
};

const EMPTY_COUNTS = {
  library: 0,
  history: 0,
  favorites: 0,
  notifications: 0,
};

const DATA_CONFIRMATIONS = {
  library: {
    eyebrow: "Minha biblioteca",
    title: "Limpar biblioteca?",
    message:
      "Todos os resumos salvos serão removidos da Biblioteca e dos Favoritos, mas continuarão disponíveis no Histórico.",
    confirmLabel: "Limpar biblioteca",
  },

  history: {
    eyebrow: "Histórico",
    title: "Excluir todo o histórico?",
    message:
      "Todos os resumos gerados serão excluídos definitivamente. Essa ação também esvaziará a Biblioteca e os Favoritos.",
    confirmLabel: "Excluir histórico",
  },

  favorites: {
    eyebrow: "Favoritos",
    title: "Remover todos os favoritos?",
    message:
      "Os resumos serão retirados dos Favoritos, mas continuarão salvos na sua Biblioteca.",
    confirmLabel: "Remover favoritos",
  },

  notifications: {
    eyebrow: "Central de avisos",
    title: "Limpar notificações?",
    message:
      "Todas as notificações da sua conta serão excluídas. Seus resumos, Biblioteca e Favoritos não serão alterados.",
    confirmLabel: "Limpar notificações",
  },
};

export default function Settings() {
  const [
    settings,
    setSettings,
  ] = useState(
    DEFAULT_PREFERENCES,
  );

  const [
    initialSettings,
    setInitialSettings,
  ] = useState(
    DEFAULT_PREFERENCES,
  );

  const [
    dataCounts,
    setDataCounts,
  ] = useState(
    EMPTY_COUNTS,
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    saved,
    setSaved,
  ] = useState(false);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    saveError,
    setSaveError,
  ] = useState("");

  const [
    processingAction,
    setProcessingAction,
  ] = useState("");

  const [
    pendingDataAction,
    setPendingDataAction,
  ] = useState(null);

  /* =====================================================
     CARREGAR CONFIGURAÇÕES
  ===================================================== */

  async function loadSettings() {
    setIsLoading(true);
    setLoadError("");

    try {
      const data = await apiRequest(
        "/api/settings",
      );

      const nextSettings = {
        notifyOnSave:
          data?.settings?.notifyOnSave !==
          false,

        notifyOnFavorite:
          data?.settings
            ?.notifyOnFavorite !== false,
      };

      setSettings(nextSettings);
      setInitialSettings(nextSettings);

      setDataCounts({
        library:
          Number(
            data?.counts?.library,
          ) || 0,

        history:
          Number(
            data?.counts?.history,
          ) || 0,

        favorites:
          Number(
            data?.counts?.favorites,
          ) || 0,

        notifications:
          Number(
            data?.counts?.notifications,
          ) || 0,
      });
    } catch (requestError) {
      setLoadError(
        requestError.message ||
        "Não foi possível carregar as configurações.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const hasChanges =
    settings.notifyOnSave !==
    initialSettings.notifyOnSave ||
    settings.notifyOnFavorite !==
    initialSettings.notifyOnFavorite;

  function updateSetting(
    settingName,
    value,
  ) {
    setSettings(
      (currentSettings) => ({
        ...currentSettings,
        [settingName]: value,
      }),
    );

    setSaved(false);
    setSaveError("");
  }

  /* =====================================================
     SALVAR PREFERÊNCIAS
  ===================================================== */

  async function handleSaveSettings(
    event,
  ) {
    event.preventDefault();

    if (!hasChanges) {
      return;
    }

    setIsSaving(true);
    setSaved(false);
    setSaveError("");

    try {
      const data = await apiRequest(
        "/api/settings",
        {
          method: "PATCH",

          body: JSON.stringify({
            notifyOnSave:
              settings.notifyOnSave,

            notifyOnFavorite:
              settings.notifyOnFavorite,
          }),
        },
      );

      const updatedSettings = {
        notifyOnSave:
          data.settings.notifyOnSave,

        notifyOnFavorite:
          data.settings
            .notifyOnFavorite,
      };

      setSettings(updatedSettings);
      setInitialSettings(
        updatedSettings,
      );

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 1800);
    } catch (requestError) {
      setSaveError(
        requestError.message ||
        "Não foi possível salvar as alterações.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleResetPreferences() {
    const confirmed = window.confirm(
      "Deseja restaurar as preferências de notificação para o padrão?",
    );

    if (!confirmed) {
      return;
    }

    setSettings({
      ...DEFAULT_PREFERENCES,
    });

    setSaved(false);
    setSaveError("");
  }

  /* =====================================================
     LIMPAR BIBLIOTECA
  ===================================================== */

  function requestDataAction(actionName) {
    if (processingAction) {
      return;
    }

    setPendingDataAction(actionName);
  }

  function closeDataActionDialog() {
    if (processingAction) {
      return;
    }

    setPendingDataAction(null);
  }

  async function confirmDataAction() {
    if (!pendingDataAction || processingAction) {
      return;
    }

    if (pendingDataAction === "library") {
      await handleClearLibrary();
      return;
    }

    if (pendingDataAction === "history") {
      await handleClearHistory();
      return;
    }

    if (pendingDataAction === "favorites") {
      await handleRemoveFavorites();
      return;
    }

    if (pendingDataAction === "notifications") {
      await handleClearNotifications();
    }
  }

  async function handleClearLibrary() {
    if (dataCounts.library === 0) {
      return;
    }

    setProcessingAction("library");

    try {
      await apiRequest(
        "/api/account/library",
        {
          method: "DELETE",
        },
      );

      setDataCounts(
        (currentCounts) => ({
          ...currentCounts,
          library: 0,
          favorites: 0,
        }),
      );

      setPendingDataAction(null);
    } catch (requestError) {
      window.alert(
        requestError.message ||
        "Não foi possível limpar a biblioteca.",
      );
    } finally {
      setProcessingAction("");
    }
  }

  /* =====================================================
     LIMPAR HISTÓRICO
  ===================================================== */

  async function handleClearHistory() {
    if (dataCounts.history === 0) {
      return;
    }

    setProcessingAction("history");

    try {
      await apiRequest(
        "/api/account/history",
        {
          method: "DELETE",
        },
      );

      setDataCounts(
        (currentCounts) => ({
          ...currentCounts,
          library: 0,
          history: 0,
          favorites: 0,
        }),
      );

      setPendingDataAction(null);
    } catch (requestError) {
      window.alert(
        requestError.message ||
        "Não foi possível limpar o histórico.",
      );
    } finally {
      setProcessingAction("");
    }
  }

  /* =====================================================
     REMOVER FAVORITOS
  ===================================================== */

  async function handleRemoveFavorites() {
    if (dataCounts.favorites === 0) {
      return;
    }

    setProcessingAction("favorites");

    try {
      await apiRequest(
        "/api/account/favorites/clear",
        {
          method: "PATCH",
        },
      );

      setDataCounts(
        (currentCounts) => ({
          ...currentCounts,
          favorites: 0,
        }),
      );

      setPendingDataAction(null);
    } catch (requestError) {
      window.alert(
        requestError.message ||
        "Não foi possível remover os favoritos.",
      );
    } finally {
      setProcessingAction("");
    }
  }

  /* =====================================================
     LIMPAR NOTIFICAÇÕES
  ===================================================== */

  async function handleClearNotifications() {
    if (
      dataCounts.notifications === 0
    ) {
      return;
    }

    setProcessingAction(
      "notifications",
    );

    try {
      await apiRequest(
        "/api/notifications",
        {
          method: "DELETE",
        },
      );

      setDataCounts(
        (currentCounts) => ({
          ...currentCounts,
          notifications: 0,
        }),
      );

      setPendingDataAction(null);

      notifyNotificationsChanged();
    } catch (requestError) {
      window.alert(
        requestError.message ||
        "Não foi possível limpar as notificações.",
      );
    } finally {
      setProcessingAction("");
    }
  }

  return (
    <div className="settings-page">
      <section className="settings-section">
        <header className="settings-header">
          <div>
            <span className="settings-eyebrow">
              Preferências do LiterIA
            </span>

            <h1>Configurações</h1>

            <p>
              Personalize os avisos e gerencie
              os dados armazenados na sua conta.
            </p>
          </div>

          <span
            className="settings-header-icon"
            aria-hidden="true"
          >
            <Settings2 size={34} />
          </span>
        </header>

        {isLoading ? (
          <div className="settings-loading">
            <span />

            <strong>
              Carregando configurações...
            </strong>
          </div>
        ) : loadError ? (
          <div className="settings-feedback settings-feedback--error">
            <p>{loadError}</p>

            <button
              type="button"
              onClick={loadSettings}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <form
              className="settings-preferences"
              onSubmit={
                handleSaveSettings
              }
            >
              <div className="settings-grid settings-grid--single">
                <section className="settings-card">
                  <header className="settings-card-header">
                    <span className="settings-card-icon settings-card-icon--bell">
                      <Bell size={22} />
                    </span>

                    <div>
                      <span>
                        Avisos internos
                      </span>

                      <h2>
                        Notificações
                      </h2>
                    </div>
                  </header>

                  <div className="settings-options">
                    <label className="settings-option">
                      <div>
                        <strong>
                          Resumo salvo
                        </strong>

                        <span>
                          Avisar quando um resumo
                          for adicionado à
                          biblioteca.
                        </span>
                      </div>

                      <span className="settings-switch-control">
                        <input
                          type="checkbox"
                          checked={
                            settings
                              .notifyOnSave
                          }
                          onChange={(
                            event,
                          ) =>
                            updateSetting(
                              "notifyOnSave",
                              event.target
                                .checked,
                            )
                          }
                        />

                        <span
                          className="settings-switch"
                          aria-hidden="true"
                        />
                      </span>
                    </label>

                    <label className="settings-option">
                      <div>
                        <strong>
                          Resumo favoritado
                        </strong>

                        <span>
                          Avisar quando um resumo
                          for adicionado aos
                          favoritos.
                        </span>
                      </div>

                      <span className="settings-switch-control">
                        <input
                          type="checkbox"
                          checked={
                            settings
                              .notifyOnFavorite
                          }
                          onChange={(
                            event,
                          ) =>
                            updateSetting(
                              "notifyOnFavorite",
                              event.target
                                .checked,
                            )
                          }
                        />

                        <span
                          className="settings-switch"
                          aria-hidden="true"
                        />
                      </span>
                    </label>
                  </div>
                </section>
              </div>

              {saveError && (
                <p
                  className="settings-feedback settings-feedback--error"
                  role="alert"
                >
                  {saveError}
                </p>
              )}

              <footer className="settings-save-bar">
                <button
                  type="button"
                  className="reset-settings-button"
                  onClick={
                    handleResetPreferences
                  }
                  disabled={isSaving}
                >
                  <RotateCcw size={17} />
                  Restaurar padrão
                </button>

                <button
                  type="submit"
                  className="save-settings-button"
                  disabled={
                    !hasChanges ||
                    isSaving
                  }
                >
                  {saved ? (
                    <Check size={18} />
                  ) : (
                    <Save size={18} />
                  )}

                  {isSaving
                    ? "Salvando..."
                    : saved
                      ? "Alterações salvas"
                      : "Salvar alterações"}
                </button>
              </footer>
            </form>

            <section className="settings-data-section">
              <header className="settings-data-header">
                <div>
                  <span>
                    Dados da conta
                  </span>

                  <h2>
                    Gerenciar dados
                  </h2>

                  <p>
                    Estes dados estão no banco
                    e pertencem exclusivamente
                    à sua conta.
                  </p>
                </div>
              </header>

              <div className="settings-data-grid">
                <article className="settings-data-item">
                  <span className="settings-data-icon">
                    <BookOpen size={21} />
                  </span>

                  <div className="settings-data-content">
                    <span>
                      Biblioteca
                    </span>

                    <strong>
                      {dataCounts.library}
                    </strong>

                    <small>
                      {dataCounts.library === 1
                        ? "resumo salvo"
                        : "resumos salvos"}
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      requestDataAction("library")
                    }
                    disabled={
                      dataCounts.library ===
                      0 ||
                      Boolean(
                        processingAction,
                      )
                    }
                    title="Limpar biblioteca"
                    aria-label="Limpar biblioteca"
                  >
                    <Trash2 size={17} />
                  </button>
                </article>

                <article className="settings-data-item">
                  <span className="settings-data-icon settings-data-icon--history">
                    <Clock3 size={21} />
                  </span>

                  <div className="settings-data-content">
                    <span>
                      Histórico
                    </span>

                    <strong>
                      {dataCounts.history}
                    </strong>

                    <small>
                      {dataCounts.history === 1
                        ? "registro"
                        : "registros"}
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      requestDataAction("history")
                    }
                    disabled={
                      dataCounts.history ===
                      0 ||
                      Boolean(
                        processingAction,
                      )
                    }
                    title="Limpar histórico"
                    aria-label="Limpar histórico"
                  >
                    <Trash2 size={17} />
                  </button>
                </article>

                <article className="settings-data-item">
                  <span className="settings-data-icon settings-data-icon--favorite">
                    <Heart size={21} />
                  </span>

                  <div className="settings-data-content">
                    <span>
                      Favoritos
                    </span>

                    <strong>
                      {dataCounts.favorites}
                    </strong>

                    <small>
                      {dataCounts.favorites === 1
                        ? "favorito"
                        : "favoritos"}
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      requestDataAction("favorites")
                    }
                    disabled={
                      dataCounts.favorites ===
                      0 ||
                      Boolean(
                        processingAction,
                      )
                    }
                    title="Remover favoritos"
                    aria-label="Remover favoritos"
                  >
                    <Trash2 size={17} />
                  </button>
                </article>

                <article className="settings-data-item">
                  <span className="settings-data-icon settings-data-icon--notification">
                    <Bell size={21} />
                  </span>

                  <div className="settings-data-content">
                    <span>
                      Notificações
                    </span>

                    <strong>
                      {
                        dataCounts.notifications
                      }
                    </strong>

                    <small>
                      {dataCounts.notifications ===
                        1
                        ? "aviso"
                        : "avisos"}
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      requestDataAction("notifications")
                    }
                    disabled={
                      dataCounts.notifications ===
                      0 ||
                      Boolean(
                        processingAction,
                      )
                    }
                    title="Limpar notificações"
                    aria-label="Limpar notificações"
                  >
                    <Trash2 size={17} />
                  </button>
                </article>
              </div>
            </section>
          </>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingDataAction)}
        eyebrow={
          pendingDataAction
            ? DATA_CONFIRMATIONS[pendingDataAction]
              .eyebrow
            : ""
        }
        title={
          pendingDataAction
            ? DATA_CONFIRMATIONS[pendingDataAction]
              .title
            : ""
        }
        message={
          pendingDataAction
            ? DATA_CONFIRMATIONS[pendingDataAction]
              .message
            : ""
        }
        confirmLabel={
          pendingDataAction
            ? DATA_CONFIRMATIONS[pendingDataAction]
              .confirmLabel
            : "Confirmar"
        }
        cancelLabel="Cancelar"
        isProcessing={Boolean(processingAction)}
        onConfirm={confirmDataAction}
        onClose={closeDataActionDialog}
      />
    </div>
  );
}