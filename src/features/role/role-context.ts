// Persisted role override. The landing H1 reads "Designer and Engineer"
// by default with a document title of "Product Designer & Design
// Engineer". Visiting `/de` overrides both to "Design Engineer";
// visiting `/pd` overrides both to "Product Designer". Either choice
// persists in localStorage so subsequent visits to `/` keep the
// override. No TTL — the override holds until the visitor explicitly
// switches via the other route.

const KEY = 'role-context';

export type Role = 'de' | 'pd';

// H1 phrase in the landing headline ("a {ROLE_LABEL} with…").
export const ROLE_LABEL: Record<Role, string> = {
  de: 'Design Engineer',
  pd: 'Product Designer',
};

// Browser-tab title suffix ("C Stavridis — {ROLE_TITLE}").
export const ROLE_TITLE: Record<Role, string> = {
  de: 'Design Engineer',
  pd: 'Product Designer',
};

// Defaults shown when no role override is active.
export const DEFAULT_ROLE_LABEL = 'Designer and Engineer';
export const DEFAULT_ROLE_TITLE = 'Product Designer & Design Engineer';

// Role-specific résumé PDFs (served from /public/resume). The Resume nav
// link opens the one matching the visitor's active role; with no role
// override it opens the combined "Designer and Engineer" résumé.
export const ROLE_RESUME: Record<Role, string> = {
  de: '/resume/C-Stavridis-Resume-Design-Engineer.pdf',
  pd: '/resume/C-Stavridis-Resume-Product-Designer.pdf',
};
export const DEFAULT_ROLE_RESUME =
  '/resume/C-Stavridis-Resume-Designer-and-Engineer.pdf';

type StoredContext = { role: Role; storedAt: number };

function isRole(value: unknown): value is Role {
  return value === 'de' || value === 'pd';
}

export function getStoredRole(): Role | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredContext;
    if (!isRole(parsed.role)) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed.role;
  } catch {
    return null;
  }
}

export function setStoredRole(role: Role): void {
  try {
    const value: StoredContext = { role, storedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // localStorage unavailable — silently skip
  }
}

export function clearStoredRole(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
