// Single place to configure the backend URL.
// - Dev: leave unset — Vite proxies /api/* to the backend (see vite.config.js).
// - Production: set VITE_API_URL (e.g. https://your-backend.onrender.com) in the frontend env.
export const API_BASE = import.meta.env.VITE_API_URL || "";
