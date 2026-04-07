/**
 * Centralized authentication helpers for the listener flow.
 *
 * The listener side of the dashboard stores two things in localStorage:
 *   - listenerToken: the JWT used as Bearer auth on API requests
 *   - listenerData:  JSON-encoded { _id, name, email, ... } used by the UI
 *
 * If either is missing, malformed, or rejected by the backend (401), the
 * user must be sent back to /listener/login. These helpers exist so every
 * page and API call handles that case the same way.
 */

export interface ListenerData {
  _id: string;
  name: string;
  email: string;
  [key: string]: any;
}

export type AuthFailureReason = 'expired' | 'invalid';

const TOKEN_KEY = 'listenerToken';
const DATA_KEY = 'listenerData';

export const getListenerToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const getListenerData = (): ListenerData | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(DATA_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed._id === 'string') {
      return parsed as ListenerData;
    }
    return null;
  } catch {
    return null;
  }
};

export const clearListenerSession = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(DATA_KEY);
};

/**
 * Send the user to the listener login screen and clear any partial session.
 * The optional reason becomes a query param the login page reads to show
 * a contextual banner ("Your session has expired" / "Your session is invalid").
 * No reason = silent redirect, used for fresh visitors who were never logged in.
 */
export const redirectToListenerLogin = (reason?: AuthFailureReason): void => {
  if (typeof window === 'undefined') return;
  clearListenerSession();
  const path = reason ? `/listener/login?reason=${reason}` : '/listener/login';
  window.location.href = path;
};

/**
 * Validate that the listener has a usable session. Call this from page-level
 * components (typically inside a useEffect) before doing any data fetching.
 *
 * Returns { token, listenerData } if valid. Returns null after triggering a
 * redirect if the session is missing or corrupted; callers should bail out
 * immediately on null:
 *
 *   const auth = requireListenerAuth();
 *   if (!auth) return;
 *   // safe to use auth.token / auth.listenerData here
 */
export const requireListenerAuth = ():
  | { token: string; listenerData: ListenerData }
  | null => {
  const token = getListenerToken();
  const listenerData = getListenerData();

  if (!token && !listenerData) {
    // Fresh visitor or fully cleared session — no banner needed
    redirectToListenerLogin();
    return null;
  }

  if (!token || !listenerData) {
    // Half-state: token without data, or data without token / unparseable
    redirectToListenerLogin('invalid');
    return null;
  }

  return { token, listenerData };
};

/**
 * Inspect a fetch Response and trigger a login redirect if it's a 401.
 * Returns true when a redirect was started (caller should abort further work),
 * false when the response is fine to continue processing.
 *
 *   const response = await fetch(...);
 *   if (handleListenerUnauthorized(response)) {
 *     throw new Error('Authentication required');
 *   }
 */
export const handleListenerUnauthorized = (response: Response): boolean => {
  if (response.status === 401) {
    redirectToListenerLogin('expired');
    return true;
  }
  return false;
};
