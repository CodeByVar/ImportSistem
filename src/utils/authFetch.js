// Global fetch wrapper that automatically injects JWT Bearer token on all /api/* requests,
// supports DEMO_MODE for frontend-only deploys (e.g. Vercel without backend),
// and gracefully falls back to mock JSON data if an endpoint returns HTML instead of JSON.

import { DEMO_MODE, handleDemoApiRequest } from '../config/demoMode';

let isInstalled = false;

export function getAuthToken() {
  try {
    const raw = localStorage.getItem('siscontrol_auth_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

export function setupAuthFetch() {
  if (isInstalled || typeof window === 'undefined' || !window.fetch) return;
  isInstalled = true;

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

    if (!isApiCall) {
      return nativeFetch(input, init);
    }

    // ========================================================================
    // 1. MODO DEMO ACTIVO: En Vercel (donde no hay backend) usa datos mock
    //    Si estás en localhost con el backend encendido, intenta el backend real
    //    y si falla o devuelve HTML (como en Vercel), usa el modo demo.
    // ========================================================================
    const isLocalBackend =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (DEMO_MODE && !isLocalBackend) {
      return handleDemoApiRequest(urlStr, init);
    }

    // ========================================================================
    // 2. LÓGICA ORIGINAL DE FETCH REAL (Con fallback automático a Demo si no hay API)
    // ========================================================================
    const isPublicLogin =
      urlStr.includes('/api/users/login') ||
      urlStr.includes('/api/health');

    const token = getAuthToken();
    const headers = new Headers(
      init?.headers || (input instanceof Request ? input.headers : undefined)
    );

    if (token && !isPublicLogin && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const response = await nativeFetch(input, { ...init, headers });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return handleDemoApiRequest(urlStr, init);
      }

      if (response.status === 401 && !isPublicLogin) {
        if (DEMO_MODE) {
          return handleDemoApiRequest(urlStr, init);
        }
        try {
          localStorage.removeItem('siscontrol_auth_session');
        } catch {
          // ignore storage errors
        }
        window.dispatchEvent(new CustomEvent('siscontrol:session-expired'));
      }

      return response;
    } catch (networkError) {
      return handleDemoApiRequest(urlStr, init);
    }
  };
}
