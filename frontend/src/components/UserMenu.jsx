import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightOnRectangleIcon, TicketIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import api from '../api/client'

export default function UserMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const menuRef = useRef(null)

  // Detectar clic fuera para cerrar menú
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuRef])

  // --- LÓGICA INTELIGENTE (ESTO ES LO NUEVO) ---
  // Busca el nombre en cualquier formato que venga del backend
  const name = user?.use_txt_nombres || user?.nombres || user?.first || ''
  const surname = user?.use_txt_apellidos || user?.apellidos || user?.last || ''

  // Busca la foto en cualquier formato
  // Busca la foto en cualquier formato y ajusta la URL
  let avatarUrl = user?.use_txt_avatar || user?.avatar || null
  if (avatarUrl && !avatarUrl.startsWith('http')) {
    const base = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')
    avatarUrl = `${base}/uploads/avatars/${avatarUrl}`
  }

  // Si no hay foto, usa la inicial
  const initial = name ? name[0].toUpperCase() : 'U'

  // Nombre completo
  const fullName = `${name} ${surname}`.trim() || 'Usuario'
  // ---------------------------------------------

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white/50 bg-zinc-800 text-zinc-100 hover:border-emerald-500 transition-colors focus:outline-none"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Perfil"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; // Imagen default bonita
            }}
          />
        ) : (
          <span className="text-lg font-bold">{initial}</span>
        )}
      </button>

      {/* MENÚ DESPLEGABLE */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right divide-y divide-zinc-700 rounded-xl bg-zinc-900 border border-zinc-700 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50">

          {/* Cabecera con datos del usuario */}
          <div className="px-4 py-3">
            <p className="truncate text-sm font-bold text-white uppercase">{fullName}</p>
            <p className="truncate text-xs text-zinc-500">{user?.email}</p>
            {user?.role === 'admin' && (
              <span className="mt-1 inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                Admin
              </span>
            )}
          </div>

          {/* Opciones */}
          <div className="py-1">
            <button
              onClick={() => { setIsOpen(false); navigate('/profile'); }}
              className="group flex w-full items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <UserCircleIcon
                className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-emerald-400"
                aria-hidden="true"
              />
              Mi Perfil
            </button>

            <button
              onClick={() => { setIsOpen(false); navigate('/help'); }}
              className="group flex w-full items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <QuestionMarkCircleIcon
                className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-emerald-400"
                aria-hidden="true"
              />
              Ayuda
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => { setIsOpen(false); navigate('/admin-dashboard'); }}
                className="group flex w-full items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                <TicketIcon className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-indigo-400" aria-hidden="true" />
                Panel Admin
              </button>
            )}
          </div>

          {/* Botón Salir */}
          <div className="py-1">
            <button
              onClick={() => { setIsOpen(false); onLogout(); }}
              className="group flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-red-500 group-hover:text-red-400" aria-hidden="true" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}