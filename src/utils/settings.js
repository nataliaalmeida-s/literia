export const SETTINGS_STORAGE_KEY =
  "literia:settings";

export const SETTINGS_UPDATED_EVENT =
  "literia:settings-updated";

export const DEFAULT_SETTINGS = {
  displayName: "leitora",
  notifyOnSave: true,
  notifyOnFavorite: true,
};

export function readSettings() {
  try {
    const storedSettings = JSON.parse(
      localStorage.getItem(
        SETTINGS_STORAGE_KEY,
      ) || "{}",
    );

    const safeSettings =
      storedSettings &&
      typeof storedSettings === "object"
        ? storedSettings
        : {};

    return {
      ...DEFAULT_SETTINGS,
      ...safeSettings,
    };
  } catch {
    return {
      ...DEFAULT_SETTINGS,
    };
  }
}

export function saveSettings(nextSettings) {
  const updatedSettings = {
    ...DEFAULT_SETTINGS,
    ...nextSettings,
  };

  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify(updatedSettings),
  );

  window.dispatchEvent(
    new CustomEvent(SETTINGS_UPDATED_EVENT, {
      detail: updatedSettings,
    }),
  );

  return updatedSettings;
}

export function resetSettings() {
  localStorage.removeItem(
    SETTINGS_STORAGE_KEY,
  );

  const defaultSettings = {
    ...DEFAULT_SETTINGS,
  };

  window.dispatchEvent(
    new CustomEvent(SETTINGS_UPDATED_EVENT, {
      detail: defaultSettings,
    }),
  );

  return defaultSettings;
}