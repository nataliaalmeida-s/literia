import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  Heart,
  Save,
  Trash2,
} from "lucide-react";

import {
  useNavigate,
} from "react-router";

import {
  apiRequest,
} from "../../services/api";

import {
  notifyNotificationsChanged,
} from "../../utils/notificationEvents";

import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";

import "./Notifications.css";

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "Data não informada";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(date);
}

function NotificationTypeIcon({
  type,
}) {
  if (type === "favorite") {
    return <Heart size={22} />;
  }

  if (type === "saved") {
    return <Save size={22} />;
  }

  return <Bell size={22} />;
}

export default function Notifications() {
  const navigate = useNavigate();

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    activeFilter,
    setActiveFilter,
  ] = useState("all");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    processingNotificationId,
    setProcessingNotificationId,
  ] = useState(null);

  const [
    isMarkingAll,
    setIsMarkingAll,
  ] = useState(false);

  const [
    isClearing,
    setIsClearing,
  ] = useState(false);

  const [
    isClearDialogOpen,
    setIsClearDialogOpen,
  ] = useState(false);

  async function loadNotifications() {
    setIsLoading(true);
    setLoadError("");

    try {
      const data = await apiRequest(
        "/api/notifications",
      );

      setNotifications(
        Array.isArray(
          data?.notifications,
        )
          ? data.notifications
          : [],
      );
    } catch (requestError) {
      setLoadError(
        requestError.message ||
        "Não foi possível carregar as notificações.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !notification.read,
      ).length,
    [notifications],
  );

  const filteredNotifications =
    useMemo(() => {
      if (activeFilter === "unread") {
        return notifications.filter(
          (notification) =>
            !notification.read,
        );
      }

      return notifications;
    }, [
      notifications,
      activeFilter,
    ]);

  async function markAsRead(
    notificationId,
  ) {
    const currentNotification =
      notifications.find(
        (notification) =>
          notification.id ===
          notificationId,
      );

    if (
      !currentNotification ||
      currentNotification.read
    ) {
      return;
    }

    setProcessingNotificationId(
      notificationId,
    );

    try {
      await apiRequest(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        },
      );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (notification) =>
              notification.id ===
                notificationId
                ? {
                  ...notification,
                  read: true,
                }
                : notification,
          ),
      );

      notifyNotificationsChanged();
    } catch (requestError) {
      window.alert(
        requestError.message ||
        "Não foi possível marcar a notificação como lida.",
      );
    } finally {
      setProcessingNotificationId(
        null,
      );
    }
  }

  async function markAllAsRead() {
    if (unreadCount === 0) {
      return;
    }

    setIsMarkingAll(true);

    try {
      await apiRequest(
        "/api/notifications/read-all",
        {
          method: "PATCH",
        },
      );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (notification) => ({
              ...notification,
              read: true,
            }),
          ),
      );

      notifyNotificationsChanged();
    } catch (requestError) {
      window.alert(
        requestError.message ||
        "Não foi possível marcar as notificações como lidas.",
      );
    } finally {
      setIsMarkingAll(false);
    }
  }

  async function deleteNotification(
    notificationId,
  ) {
    setProcessingNotificationId(
      notificationId,
    );

    try {
      await apiRequest(
        `/api/notifications/${notificationId}`,
        {
          method: "DELETE",
        },
      );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.filter(
            (notification) =>
              notification.id !==
              notificationId,
          ),
      );

      notifyNotificationsChanged();
    } catch (requestError) {
      window.alert(
        requestError.message ||
        "Não foi possível excluir a notificação.",
      );
    } finally {
      setProcessingNotificationId(
        null,
      );
    }
  }

  function requestClearNotifications() {
    if (notifications.length === 0) {
      return;
    }

    setIsClearDialogOpen(true);
  }

  function closeClearNotificationsDialog() {
    if (isClearing) {
      return;
    }

    setIsClearDialogOpen(false);
  }

  async function clearNotifications() {
    if (notifications.length === 0) {
      return;
    }

    setIsClearing(true);

    try {
      await apiRequest(
        "/api/notifications",
        {
          method: "DELETE",
        },
      );

      setNotifications([]);
      setIsClearDialogOpen(false);

      notifyNotificationsChanged();
    } catch (requestError) {
      window.alert(
        requestError.message ||
        "Não foi possível limpar as notificações.",
      );
    } finally {
      setIsClearing(false);
    }
  }

  async function openLibrary(
    notification,
  ) {
    if (!notification.read) {
      await markAsRead(
        notification.id,
      );
    }

    navigate("/biblioteca");
  }

  return (
    <div className="notifications-page">
      <section className="notifications-section">
        <header className="notifications-header">
          <div>
            <span className="notifications-eyebrow">
              Central de avisos
            </span>

            <h1>Notificações</h1>

            <p>
              Acompanhe atividades importantes
              da sua biblioteca.
            </p>
          </div>

          <span
            className="notifications-header-icon"
            aria-hidden="true"
          >
            <Bell size={35} />

            {unreadCount > 0 && (
              <span className="notifications-header-count">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </span>
        </header>

        <div className="notifications-toolbar">
          <div className="notifications-filters">
            <button
              type="button"
              className={
                activeFilter === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("all")
              }
            >
              Todas

              <span>
                {notifications.length}
              </span>
            </button>

            <button
              type="button"
              className={
                activeFilter === "unread"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter(
                  "unread",
                )
              }
            >
              Não lidas

              <span>{unreadCount}</span>
            </button>
          </div>

          <div className="notifications-toolbar-actions">
            <button
              type="button"
              className="mark-all-read-button"
              onClick={markAllAsRead}
              disabled={
                unreadCount === 0 ||
                isMarkingAll
              }
            >
              <CheckCheck size={18} />

              {isMarkingAll
                ? "Marcando..."
                : "Marcar todas como lidas"}
            </button>

            <button
              type="button"
              className="clear-notifications-button"
              onClick={requestClearNotifications}
              disabled={
                notifications.length ===
                0 ||
                isClearing
              }
            >
              <Trash2 size={18} />

              {isClearing
                ? "Limpando..."
                : "Limpar"}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="notifications-empty">
            <span>
              <Bell size={31} />
            </span>

            <h2>
              Carregando notificações...
            </h2>

            <p>
              Buscando seus avisos no banco
              de dados.
            </p>
          </div>
        ) : loadError ? (
          <div className="notifications-empty">
            <span>
              <Bell size={31} />
            </span>

            <h2>
              Não foi possível carregar
            </h2>

            <p>{loadError}</p>

            <button
              type="button"
              onClick={loadNotifications}
            >
              Tentar novamente
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <span>
              <Bell size={31} />
            </span>

            <h2>
              Nenhuma notificação
            </h2>

            <p>
              Os avisos sobre resumos salvos
              e favoritos aparecerão aqui.
            </p>
          </div>
        ) : filteredNotifications.length ===
          0 ? (
          <div className="notifications-empty">
            <span>
              <CheckCheck size={31} />
            </span>

            <h2>
              Tudo lido por aqui
            </h2>

            <p>
              Você não possui notificações
              pendentes.
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map(
              (notification) => (
                <article
                  key={notification.id}
                  className={`notification-card ${notification.read
                    ? "is-read"
                    : "is-unread"
                    }`}
                >
                  <span
                    className={`notification-card-icon notification-card-icon--${notification.type}`}
                  >
                    <NotificationTypeIcon
                      type={
                        notification.type
                      }
                    />
                  </span>

                  <div className="notification-card-content">
                    <div className="notification-card-title">
                      <strong>
                        {notification.title}
                      </strong>

                      {!notification.read && (
                        <span
                          className="notification-unread-dot"
                          aria-label="Não lida"
                        />
                      )}
                    </div>

                    <p>
                      {notification.message}
                    </p>

                    <small>
                      {formatDateTime(
                        notification.createdAt,
                      )}
                    </small>
                  </div>

                  <div className="notification-card-actions">
                    {notification.relatedId && (
                      <button
                        type="button"
                        className="open-notification-button"
                        onClick={() =>
                          openLibrary(
                            notification,
                          )
                        }
                      >
                        <BookOpen size={17} />
                        Abrir biblioteca
                      </button>
                    )}

                    <button
                      type="button"
                      className="read-notification-button"
                      onClick={() =>
                        markAsRead(
                          notification.id,
                        )
                      }
                      disabled={
                        notification.read ||
                        processingNotificationId ===
                        notification.id
                      }
                      title={
                        notification.read
                          ? "Notificação lida"
                          : "Marcar como lida"
                      }
                      aria-label={
                        notification.read
                          ? "Notificação lida"
                          : "Marcar como lida"
                      }
                    >
                      <Check size={18} />
                    </button>

                    <button
                      type="button"
                      className="delete-notification-button"
                      onClick={() =>
                        deleteNotification(
                          notification.id,
                        )
                      }
                      disabled={
                        processingNotificationId ===
                        notification.id
                      }
                      title="Excluir notificação"
                      aria-label="Excluir notificação"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={isClearDialogOpen}
        eyebrow="Central de avisos"
        title="Limpar notificações?"
        message="Todas as notificações da sua conta serão excluídas. Essa ação não remove seus resumos, biblioteca ou favoritos."
        confirmLabel="Limpar notificações"
        cancelLabel="Cancelar"
        isProcessing={isClearing}
        onConfirm={clearNotifications}
        onClose={closeClearNotificationsDialog}
      />
    </div>
  );
}