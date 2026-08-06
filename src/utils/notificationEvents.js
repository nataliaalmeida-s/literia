export const NOTIFICATIONS_REFRESH_EVENT =
  "literia:notifications-refresh";

export function notifyNotificationsChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      NOTIFICATIONS_REFRESH_EVENT,
    ),
  );
}