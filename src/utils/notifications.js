import {
  readSettings,
} from "./settings";

export const NOTIFICATIONS_STORAGE_KEY =
  "literia:notifications";

export const NOTIFICATIONS_UPDATED_EVENT =
  "literia:notifications-updated";

const MAX_NOTIFICATIONS = 100;

export function readNotifications() {
  try {
    const storedNotifications = JSON.parse(
      localStorage.getItem(
        NOTIFICATIONS_STORAGE_KEY,
      ) || "[]",
    );

    return Array.isArray(storedNotifications)
      ? storedNotifications
      : [];
  } catch {
    return [];
  }
}

export function saveNotifications(notifications) {
  const safeNotifications = Array.isArray(notifications)
    ? notifications
    : [];

  localStorage.setItem(
    NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(safeNotifications),
  );

  /*
    O evento atualiza a Sidebar e a página de notificações
    imediatamente, mesmo dentro da mesma aba.
  */
  window.dispatchEvent(
    new CustomEvent(
      NOTIFICATIONS_UPDATED_EVENT,
    ),
  );

  return safeNotifications;
}

export function createNotification({
  type = "info",
  title,
  message,
  relatedId = null,
}) {

    const settings = readSettings();

  const notificationIsDisabled =
    (type === "saved" &&
      !settings.notifyOnSave) ||
    (type === "favorite" &&
      !settings.notifyOnFavorite);

  if (notificationIsDisabled) {
    return readNotifications();
  }
  
  const currentNotifications = readNotifications();

  const notification = {
    id:
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random()}`,

    type,
    title,
    message,
    relatedId,

    createdAt: new Date().toISOString(),
    read: false,
  };

  return saveNotifications(
    [
      notification,
      ...currentNotifications,
    ].slice(0, MAX_NOTIFICATIONS),
  );
}

export function markNotificationAsRead(
  notificationId,
) {
  const updatedNotifications =
    readNotifications().map((notification) =>
      notification.id === notificationId
        ? {
            ...notification,
            read: true,
          }
        : notification,
    );

  return saveNotifications(
    updatedNotifications,
  );
}

export function markAllNotificationsAsRead() {
  const updatedNotifications =
    readNotifications().map((notification) => ({
      ...notification,
      read: true,
    }));

  return saveNotifications(
    updatedNotifications,
  );
}

export function deleteNotification(
  notificationId,
) {
  const updatedNotifications =
    readNotifications().filter(
      (notification) =>
        notification.id !== notificationId,
    );

  return saveNotifications(
    updatedNotifications,
  );
}

export function clearNotifications() {
  return saveNotifications([]);
}

export function getUnreadNotificationsCount() {
  return readNotifications().filter(
    (notification) => !notification.read,
  ).length;
}