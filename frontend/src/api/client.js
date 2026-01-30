// src/api/client.js
import axios from 'axios';

// ⚠️ Asegúrate de poner esto en tu .env del frontend:
// VITE_API_BASE=http://localhost:8000/api
const API = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// En vez de "lista de protegidas", es más seguro tener "lista de públicas"
// y mandar Authorization a todo lo demás.
const PUBLIC_PATHS = [
  /^\/auth\/login\b/,
  /^\/auth\/register\b/,
  /^\/auth\/oauth\b/,
  /^\/notify\b/,
  /^\/catalog\b/,
  /^\/status\b/,
  /^\/reservations\/slots\b/,
];

const api = axios.create({
  baseURL: API,
  withCredentials: false, // usa true si tu auth es por cookie
});

// Token inicial (si existe)
const boot = localStorage.getItem('token');
if (boot) api.defaults.headers.common.Authorization = 'Bearer ' + boot;

// Interceptor: añade Authorization a TODO lo que no sea público
api.interceptors.request.use((cfg) => {
  // Resuelve URL absoluta segura
  let path = '';
  try {
    // si cfg.url ya es absoluta, new URL la respeta; si es relativa, usa API
    path = new URL(cfg.url, API).pathname;
  } catch {
    path = cfg.url || '/';
  }

  const isPublic = PUBLIC_PATHS.some((re) => re.test(path));

  if (!isPublic) {
    const t = localStorage.getItem('token');
    if (t) {
      cfg.headers = cfg.headers || {};
      cfg.headers.Authorization = 'Bearer ' + t;
    }
  } else {
    // limpia header en rutas públicas por si acaso
    if (cfg.headers && 'Authorization' in cfg.headers) {
      delete cfg.headers.Authorization;
    }
  }

  return cfg;
});

// Helpers
export function setToken(t) {
  if (t) {
    localStorage.setItem('token', t);
    api.defaults.headers.common.Authorization = 'Bearer ' + t;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
  }
  window.dispatchEvent(new Event('auth:changed'));
}

export const clearToken = () => setToken(null);
export default api;
