// Global fetch wrapper that automatically injects JWT Bearer token on all /api/* requests
// and gracefully handles 401 session expiration across the entire app.

let isInstalled = false;

export function getAuthToken() {
  try {
    const raw = localStorage.getItem('siscontrol_auth_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Clear any leftover temporary demo session token
    if (parsed?.demoMode || parsed?.token === 'demo-jwt-token-importadora-rivero-2026') {
      localStorage.removeItem('siscontrol_auth_session');
      localStorage.removeItem('siscontrol_active_user');
      localStorage.removeItem('siscontrol_demo_state_v1');
      return null;
    }
    return parsed?.token || null;
  } catch {
    return null;
  }
}

export function setupAuthFetch() {
  if (isInstalled || typeof window === 'undefined' || !window.fetch) return;
  isInstalled = true;

  // Purge any leftover demo session on startup
  getAuthToken();

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const urlStr = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input?.url || '';

    const isApiCall =
      urlStr.startsWith('/api/') ||
      urlStr.startsWith(`${window.location.origin}/api/`);

    const isPublicLogin =
      urlStr.includes('/api/users/login') ||
      urlStr.includes('/api/health');

    if (!isApiCall) {
      return nativeFetch(input, init);
    }

    const token = getAuthToken();
    const headers = new Headers(
      init?.headers || (input instanceof Request ? input.headers : undefined)
    );

    if (token && !isPublicLogin && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await nativeFetch(input, { ...init, headers });

    if (response.status === 401 && !isPublicLogin) {
      try {
        localStorage.removeItem('siscontrol_auth_session');
        localStorage.removeItem('siscontrol_active_user');
      } catch {
        // ignore storage errors
      }
      window.dispatchEvent(new CustomEvent('siscontrol:session-expired'));
    }

    return response;
  };
}
