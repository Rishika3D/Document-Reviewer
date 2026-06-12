// Single place to configure the backend URL.
// In production set VITE_API_URL (e.g. https://your-backend.onrender.com) in the frontend env.
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";
