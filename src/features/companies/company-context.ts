const KEY = 'company-context';
const TTL_MS = 90 * 24 * 60 * 60 * 1000;

type StoredContext = { slug: string; name: string; storedAt: number };

export function getStoredCompany(): StoredContext | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredContext;
    if (Date.now() - parsed.storedAt > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredCompany(slug: string, name: string): void {
  try {
    const value: StoredContext = { slug, name, storedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // localStorage unavailable (private browsing quota, etc.) — silently skip
  }
}

export function clearStoredCompany(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
