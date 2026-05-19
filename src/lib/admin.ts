// Admin authentication (client-side PIN, not secure for sensitive data)
const ADMIN_STORAGE_KEY = "wc2026_admin_auth";

// Simple PIN (change to your preference in production)
const VALID_PIN = "2026";

export function checkAdminPin(pin: string): boolean {
  return pin === VALID_PIN;
}

export function isAdmin(): boolean {
  try {
    return localStorage.getItem(ADMIN_STORAGE_KEY) === "true";
  } catch { return false; }
}

export function setAdmin(active: boolean) {
  try {
    if (active) localStorage.setItem(ADMIN_STORAGE_KEY, "true");
    else localStorage.removeItem(ADMIN_STORAGE_KEY);
  } catch { /* ignore */ }
}

export function logoutAdmin() {
  setAdmin(false);
}
