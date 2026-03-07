/**
 * lib/auth.js
 * Frontend auth helpers — call these from your pages/components
 */

const API_BASE = import.meta.env.VITE_API_BASE || "https://salarypayslip-backend.onrender.com";

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getToken  = ()    => localStorage.getItem("admin_token");
export const getAdmin  = ()    => JSON.parse(localStorage.getItem("admin_info") || "null");
export const isLoggedIn = ()   => !!getToken();

export const clearAuth = () => {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_info");
};

// ─── Authenticated fetch wrapper ──────────────────────────────────────────────
// Use this instead of plain fetch() for all protected API calls
export const authFetch = async (url, options = {}) => {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // Token expired or invalid → redirect to login
  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    return null;
  }

  return res;
};

// ─── Verify token with backend (call on app load) ─────────────────────────────
export const verifyToken = async () => {
  const token = getToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = async () => {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* ignore network errors on logout */ }
  }
  clearAuth();
  window.location.href = "/login";
};

// ─── Route guard — call at top of protected pages ─────────────────────────────
// Usage: useEffect(() => { guardRoute(); }, []);
export const guardRoute = async () => {
  if (!isLoggedIn()) {
    window.location.href = "/login";
    return false;
  }
  const valid = await verifyToken();
  if (!valid) {
    clearAuth();
    window.location.href = "/login";
    return false;
  }
  return true;
};