import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { setToken } from "../api/client";

function Label({ children, htmlFor, className = "" }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-zinc-700 ${className}`}
    >
      {children}
    </label>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent ${className}`}
      {...props}
    />
  );
}

function OAuthButton({ onClick, children, icon }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white py-2.5 text-zinc-700 hover:bg-zinc-50 focus:ring-2 focus:ring-emerald-400 transition"
    >
      {icon}
      <span className="text-sm font-medium">{children}</span>
    </button>
  );
}

export default function Auth() {
  const nav = useNavigate();
  const [tab, setTab] = useState("login");
  const [msg, setMsg] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [documento, setDocumento] = useState("");

  const API_BASE = useMemo(() => import.meta.env.VITE_API_BASE || "http://localhost:3000", []);
  const FRONT_REDIRECT = useMemo(() => `${window.location.origin}/auth`, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tok = params.get("token");
    const err = params.get("error");
    if (tok) {
      setToken(tok);
      window.history.replaceState({}, "", "/auth");
      nav("/");
    }
    if (err) {
      setMsg(err);
      window.history.replaceState({}, "", "/auth");
    }
  }, [nav]);

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setToken(data.token);
      nav("/");
    } catch (e) {
      setMsg(e?.response?.data?.error || "Error de login");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/register", { nombres, apellidos, documento, email, password });
      setToken(data.token);
      nav("/");
    } catch (e) {
      setMsg(e?.response?.data?.error || "Error de registro");
    }
  }

  function loginWith(provider) {
    const url = `${API_BASE}/auth/${provider}?redirect=${encodeURIComponent(FRONT_REDIRECT)}`;
    window.location.href = url;
  }

  const GoogleIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M21.35 11.1h-9.17v2.98h5.49c-.24 1.4-1.65 4.1-5.49 4.1-3.3 0-6-2.73-6-6.1s2.7-6.1 6-6.1c1.88 0 3.14.8 3.86 1.49l2.63-2.55C17.28 3.2 15.06 2.2 12.18 2.2 6.9 2.2 2.6 6.53 2.6 11.9s4.3 9.7 9.58 9.7c5.54 0 9.2-3.89 9.2-9.36 0-.63-.07-1.1-.13-1.55z" />
    </svg>
  );
  const FacebookIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M22 12.06C22 6.49 17.52 2 12 2S2 6.49 2 12.06c0 5.01 3.66 9.16 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.78 8.44-4.93 8.44-9.94z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-6">
      <div className="w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white shadow-xl p-8">
        <div className="grid md:grid-cols-2 gap-10">
          <section className="hidden md:flex flex-col justify-center">
            <h1 className="text-3xl font-semibold text-zinc-900 leading-tight">
              Bienvenido a <span className="text-emerald-600">Yalotengo</span>
            </h1>
            <p className="mt-4 text-zinc-600">
              Crea tu cuenta o inicia sesión para acceder a tu carrito, pedidos y ofertas personalizadas.
            </p>
          </section>

          <section>
            <div className="grid grid-cols-2 rounded-lg bg-zinc-100 p-1 mb-6">
              <button
                onClick={() => setTab("login")}
                className={`py-2 rounded-md text-sm font-medium transition ${tab === "login" ? "bg-white shadow text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                  }`}
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => setTab("register")}
                className={`py-2 rounded-md text-sm font-medium transition ${tab === "register" ? "bg-white shadow text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                  }`}
              >
                Crear cuenta
              </button>
            </div>

            {msg && (
              <div className="mb-4 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
                {msg}
              </div>
            )}

            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Correo</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="w-full rounded-lg bg-emerald-500 py-2.5 font-medium text-white hover:bg-emerald-400">
                  Entrar
                </button>
                <div className="relative py-2 text-center">
                  <span className="px-3 text-xs text-zinc-500 bg-white relative z-10">o continúa con</span>
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-zinc-200" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <OAuthButton onClick={() => loginWith("google")} icon={GoogleIcon}>Google</OAuthButton>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombres">Nombres</Label>
                    <Input value={nombres} onChange={(e) => setNombres(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="apellidos">Apellidos</Label>
                    <Input value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="documento">DNI</Label>
                  <Input value={documento} onChange={(e) => setDocumento(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="email">Correo</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="w-full rounded-lg bg-emerald-500 py-2.5 font-medium text-white hover:bg-emerald-400">
                  Registrarme
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
