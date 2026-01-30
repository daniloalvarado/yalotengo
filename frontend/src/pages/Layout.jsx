import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header'

export default function Layout() {
  const location = useLocation();

  // Verificamos si la ruta actual es exactamente la raíz "/"
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Si es el Home, renderizamos el Outlet directamente (Full Screen).
          Si NO es el Home, lo envolvemos en la caja de siempre.
      */}
      <main className="flex-1">
        {isHome ? (
          <Outlet />
        ) : (
          <div className="max-w-5xl mx-auto p-4">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  )
}