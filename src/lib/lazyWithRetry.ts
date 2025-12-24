import { lazy } from "react";

/**
 * Helps recover from stale cached chunks (common after deployments) by reloading once
 * when a dynamic import fails.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  key: string
) {
  return lazy(async () => {
    try {
      return await importer();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const shouldReload =
        message.includes("Importing a module script failed") ||
        message.includes("Failed to fetch dynamically imported module") ||
        message.includes("Importing a module script") ||
        message.includes("dynamically imported module");

      const reloadKey = `lazy_import_retried:${key}`;
      const hasRetried = sessionStorage.getItem(reloadKey) === "1";

      if (shouldReload && !hasRetried) {
        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
      }

      throw err;
    }
  });
}
