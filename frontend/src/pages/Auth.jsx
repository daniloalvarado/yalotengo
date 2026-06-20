import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { setToken } from "../api/client";

import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { cascade } from "../utils/animations";

function Label({ children, htmlFor, className = "" }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-zinc-700 dark:text-zinc-300 ${className}`}
    >
      {children}
    </label>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141414] px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent ${className}`}
      {...props}
    />
  );
}

function OAuthButton({ onClick, children, icon }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141414] py-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 focus:ring-2 focus:ring-emerald-400 transition"
    >
      {icon}
      <span className="text-sm font-medium">{children}</span>
    </button>
  );
}

import { toast } from "react-hot-toast";

export default function Auth() {
  const nav = useNavigate();
  const [tab, setTab] = useState("login");
  // const [msg, setMsg] = useState(""); // Removed in favor of toast

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [documento, setDocumento] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
      // setMsg(err);
      toast.error(err);
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
      // setMsg(e?.response?.data?.error || "Error de login");
      toast.error(e?.response?.data?.error || "Error al iniciar sesión");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (documento && documento.length !== 8) {
      toast.error("El DNI debe tener 8 números.");
      return;
    }

    try {
      const { data } = await api.post("/auth/register", { nombres, apellidos, documento, email, password });
      setToken(data.token);
      toast.success("Cuenta creada exitosamente");
      nav("/");
    } catch (e) {
      // setMsg(e?.response?.data?.error || "Error de registro");
      toast.error(e?.response?.data?.error || "Error al registrarse");
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

  // Check for token immediately to prevent flash
  const searchParams = new URLSearchParams(window.location.search)
  const hasToken = searchParams.get('token')

  if (hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-[#141414] dark:via-[#1c1c1c] dark:to-[#141414]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Iniciando sesión...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-[#141414] dark:via-[#1c1c1c] dark:to-[#141414] p-6">
      <div className="w-full max-w-4xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1c] shadow-xl p-8">
        <div className="grid md:grid-cols-2 gap-10">
          <section className="hidden md:flex flex-col justify-center">
            <h1 {...cascade(0, "text-3xl font-semibold text-zinc-900 dark:text-white leading-tight")}>
              Bienvenido a <span className="text-emerald-600 dark:text-emerald-500">Yalotengo</span>
            </h1>
            <p {...cascade(1, "mt-4 text-zinc-600 dark:text-zinc-400")}>
              Crea tu cuenta o inicia sesión para acceder a tu carrito, pedidos y ofertas personalizadas.
            </p>
          </section>

          <section>
            <div {...cascade(2, "grid grid-cols-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 p-1 mb-6")}>
              <button
                onClick={() => setTab("login")}
                className={`py-2 rounded-md text-sm font-medium transition ${tab === "login" ? "bg-white dark:bg-[#141414] shadow text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => setTab("register")}
                className={`py-2 rounded-md text-sm font-medium transition ${tab === "register" ? "bg-white dark:bg-[#141414] shadow text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
              >
                Crear cuenta
              </button>
            </div>

            {tab === "login" ? (
              <form key="login" onSubmit={handleLogin} className="space-y-4">
                <div {...cascade(3)}>
                  <Label htmlFor="email">Correo</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div {...cascade(4, "relative")}>
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <button type="submit" {...cascade(5, "w-full rounded-lg bg-emerald-500 py-2.5 font-medium text-white hover:bg-emerald-400 dark:bg-emerald-600 dark:hover:bg-emerald-500")}>
                  Entrar
                </button>
                <div {...cascade(6, "relative py-2 text-center")}>
                  <span className="px-3 text-xs text-zinc-500 bg-white dark:bg-[#1c1c1c] relative z-10">o continúa con</span>
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-zinc-200 dark:bg-zinc-800" />
                </div>
                <div {...cascade(7, "flex flex-col gap-3")}>
                  <OAuthButton onClick={() => loginWith("google")} icon={GoogleIcon}>Google</OAuthButton>
                </div>
              </form>
            ) : (
              <form key="register" onSubmit={handleRegister} className="space-y-4">
                <div {...cascade(3, "grid sm:grid-cols-2 gap-4")}>
                  <div>
                    <Label htmlFor="nombres">Nombres</Label>
                    <Input value={nombres} onChange={(e) => setNombres(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="apellidos">Apellidos</Label>
                    <Input value={apellidos} onChange={(e) => setApellidos(e.target.value)} required />
                  </div>
                </div>
                <div {...cascade(4)}>
                  <Label htmlFor="documento">DNI (Opcional)</Label>
                  <Input
                    value={documento}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setDocumento(val);
                    }}
                    maxLength={8}
                  />
                </div>
                <div {...cascade(5)}>
                  <Label htmlFor="email">Correo</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div {...cascade(6, "relative")}>
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <button type="submit" {...cascade(7, "w-full rounded-lg bg-emerald-500 py-2.5 font-medium text-white hover:bg-emerald-400")}>
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
