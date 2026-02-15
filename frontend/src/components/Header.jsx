import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import api, { setToken as setAuthToken } from "../api/client";
import UserMenu from './UserMenu';

export default function Header() {
  const nav = useNavigate();
  const loc = useLocation();

  const [count, setCount] = useState(0);
  const [token, setTokenState] = useState(() => localStorage.getItem("token"));
  const [authVersion, setAuthVersion] = useState(0); // Para forzar recarga de usuario
  const [loadingCart, setLoadingCart] = useState(false);
  const [user, setUser] = useState(null);

  const isAuthed = useMemo(() => Boolean(token && token !== ""), [token]);



  // --- PREVENIR PARPADEO AL CLICAR EN EL MISMO LINK ---
  const handleSamePageClick = (e, targetPath) => {
    // Si la ruta actual es igual al destino, evitamos la navegación
    if (loc.pathname === targetPath) {
      e.preventDefault();
    }
  };

  // Sincronizar token y detectar cambios de perfil
  useEffect(() => {
    const refresh = () => {
      setTokenState(localStorage.getItem("token"));
      setAuthVersion(v => v + 1);
    };
    window.addEventListener("auth:changed", refresh);
    const onStorage = (e) => { if (e.key === "token") refresh(); };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("auth:changed", refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Cargar usuario
  useEffect(() => {
    if (isAuthed) {
      api.get('/auth/me')
        .then(res => {
          const userData = res.data.user || res.data;
          setUser(userData);
        })
        .catch(() => setUser(null));
    } else {
      setUser(null);
    }
  }, [isAuthed, authVersion]); // Dependemos de authVersion para recargar

  // Carga de contadores (reservaciones + productos PENDING)
  const loadCounts = useCallback(async () => {
    if (!isAuthed) {
      setCount(0);
      return;
    }
    try {
      // Cargar reservaciones pendientes
      const reservationsRes = await api.get("/reservations/my").catch(() => ({ data: { reservations: [] } }));
      const reservationCount = (reservationsRes.data?.reservations || [])
        .filter(r => r.status === 'PENDING').length;

      // Cargar productos PENDING del carrito
      const [modelsRes, booksRes, coursesRes] = await Promise.all([
        api.get("/models3d/cart").catch(() => ({ data: [] })),
        api.get("/books/cart").catch(() => ({ data: [] })),
        api.get("/courses/cart").catch(() => ({ data: [] }))
      ]);

      const productsCount =
        (modelsRes.data?.length || 0) +
        (booksRes.data?.length || 0) +
        (coursesRes.data?.length || 0);

      setCount(reservationCount + productsCount);
    } catch (e) {
      console.error(e);
    }
  }, [isAuthed]);

  useEffect(() => {
    loadCounts();
    const onFocus = () => loadCounts();
    const onCartUpdate = () => loadCounts();
    window.addEventListener("focus", onFocus);
    window.addEventListener("cart:update", onCartUpdate);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("cart:update", onCartUpdate);
    };
  }, [loadCounts, loc.pathname]);

  function logout() {
    setAuthToken(null);
    setUser(null);
    nav("/auth");
  }

  const linkBase = "text-sm transition-colors";
  const linkActive = "text-emerald-400 font-medium";
  const linkIdle = "text-zinc-300 hover:text-emerald-500";

  // 👇 AQUÍ ESTÁ LA MAGIA CORREGIDA:
  // Si NO está logueado, el link apunta a "/auth".
  // Si YA está logueado, apunta a su panel correspondiente.
  let reservationsLink = "/auth";
  if (isAuthed) {
    reservationsLink = user?.use_txt_role === 'admin' ? "/admin-reservas" : "/reservations";
  }

  const reservationsLabel = user?.use_txt_role === 'admin' ? "Reservas" : "Reservas";

  // --- LÓGICA DE ACTIVACIÓN MANUAL ---
  // Esto evita problemas con redirecciones y estados intermedios
  const isHome = loc.pathname === '/';
  const isCart = isAuthed && loc.pathname === '/cart';
  const isPurchases = isAuthed && loc.pathname === '/purchases';

  // Reservas solo se activa si estás logueado Y en la ruta correcta
  const targetReservations = user?.use_txt_role === 'admin' ? "/admin-reservas" : "/reservations";
  const isReservations = isAuthed && loc.pathname === targetReservations;

  return (
    <header
      className={`sticky top-0 z-40 border-b border-zinc-900 bg-zinc-950/90 ${isHome ? 'animate-slide-down-slow opacity-0' : ''}`}
      style={isHome ? { animationDelay: '.8s' } : {}}
    >
      <div className="mx-auto max-w-7xl px-6 h-16 grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500 grid place-items-center text-zinc-900 font-black">T</div>
            <span className="hidden sm:block text-base font-semibold transition-colors text-white">Yalotengo</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center justify-center gap-6">
          {/* Dashboard - Solo para admins, primero */}
          {user?.use_txt_role === 'admin' && (
            <NavLink
              to="/admin-dashboard"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
            >
              Dashboard
            </NavLink>
          )}

          {/* Modelos 3D - Admin va a gestión, usuario normal a tienda */}
          <NavLink
            to={user?.use_txt_role === 'admin' ? "/admin-models3d" : "/models3d"}
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
          >
            Modelos 3D
          </NavLink>

          {/* Libros */}
          <NavLink
            to={user?.use_txt_role === 'admin' ? "/admin-books" : "/books"}
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
          >
            Libros
          </NavLink>

          {/* Cursos */}
          <NavLink
            to={user?.use_txt_role === 'admin' ? "/admin-courses" : "/courses"}
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
          >
            Cursos
          </NavLink>

          {/* Reservas */}
          <Link
            to={reservationsLink}
            className={isReservations ? `${linkBase} ${linkActive}` : `${linkBase} ${linkIdle}`}
            onClick={(e) => handleSamePageClick(e, reservationsLink)}
          >
            {reservationsLabel}
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center justify-end gap-3">
          {/* Cart y Purchases: Visibles, pero behavior distinto si no auth */}

          {user?.use_txt_role !== 'admin' && (
            <>
              {/* Cart Button: Always goes to /cart (public now) */}
              <Link
                to="/cart"
                className="relative inline-flex items-center gap-2 rounded-xl border px-3 h-10 transition-all border-white-800 bg-zinc-900/60 text-zinc-100 hover:bg-zinc-900"
                aria-label="Carrito"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Carrito</span>
                <span className={`ml-1 inline-flex items-center justify-center text-[10px] leading-none rounded-full min-w-5 h-5 px-1.5 font-semibold animate-in zoom-in duration-200 ${loadingCart ? 'bg-zinc-700 text-zinc-300' : 'bg-emerald-500 text-zinc-900'}`}>
                  {loadingCart ? "…" : count}
                </span>
              </Link>

              {/* Mis Compras: Requires Auth. If not auth, goes to /auth */}
              <Link
                to={isAuthed ? "/purchases" : "/auth"}
                className={isPurchases ? `${linkBase} ${linkActive}` : `${linkBase} ${linkIdle}`}
                onClick={(e) => handleSamePageClick(e, isAuthed ? '/purchases' : '/auth')}
              >
                Mis compras
              </Link>
            </>
          )}

          {isAuthed ? (
            <UserMenu user={user} onLogout={logout} />
          ) : (
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 h-10 text-zinc-900 hover:bg-emerald-400 font-medium">
              Entrar
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden border-t border-zinc-800">
        <nav className="mx-auto max-w-7xl px-6 py-2 flex items-center gap-5 overflow-auto text-sm">
          {/* Dashboard - Solo para admins, primero en móvil */}
          {user?.use_txt_role === 'admin' && (
            <NavLink
              to="/admin-dashboard"
              className={({ isActive }) => `${isActive ? "text-white font-medium" : "text-zinc-300 hover:text-white"}`}
            >
              Dashboard
            </NavLink>
          )}

          <NavLink
            to={user?.use_txt_role === 'admin' ? "/admin-models3d" : "/models3d"}
            className={({ isActive }) => `${isActive ? "text-white font-medium" : "text-zinc-300 hover:text-white"}`}
          >
            Modelos 3D
          </NavLink>

          <NavLink
            to={user?.use_txt_role === 'admin' ? "/admin-books" : "/books"}
            className={({ isActive }) => `${isActive ? "text-white font-medium" : "text-zinc-300 hover:text-white"}`}
          >
            Libros
          </NavLink>

          <NavLink
            to={user?.use_txt_role === 'admin' ? "/admin-courses" : "/courses"}
            className={({ isActive }) => `${isActive ? "text-white font-medium" : "text-zinc-300 hover:text-white"}`}
          >
            Cursos
          </NavLink>

          <NavLink
            to={reservationsLink}
            className={({ isActive }) => `${isActive ? "text-white font-medium" : "text-zinc-300 hover:text-white"}`}
          >
            {reservationsLabel}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}