import { BoltIcon } from '@heroicons/react/24/solid'
import { useEffect, useRef } from 'react'
import { uiState } from '../utils/uiState'

export default function Home() {
  // Usamos el estado en memoria. Si es F5, start=false. Si es navegación, start=true.
  const shouldAnimate = useRef(!uiState.introShown)

  useEffect(() => {
    // Marcar como visto para la próxima navegación dentro de la misma sesión
    uiState.introShown = true
  }, [])

  const getAnimClass = (base) => {
    return shouldAnimate.current ? `${base} animate-fade-in-up opacity-0` : base
  }

  const getAnimStyle = (delay) => {
    return shouldAnimate.current ? { animationDelay: delay } : {}
  }

  return (
    <div className="fixed inset-0 w-full h-screen overflow-hidden bg-black">

      {/* --- VIDEO DE FONDO --- */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          preload="auto"
        >
          <source src="/banner.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/65 to-black/80"></div>
      </div>

      {/* --- CONTENIDO --- */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4 text-center">

        {/* Badge */}
        <div
          className={getAnimClass("inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-3 md:mb-6")}
          style={getAnimStyle('0.1s')}
        >
          <BoltIcon className="w-3 h-3 md:w-4 md:h-4" /> Tecnología e Innovación
        </div>

        {/* Título Principal */}
        <h1
          className={getAnimClass("text-4xl sm:text-7xl md:text-9xl font-black text-white tracking-tighter leading-none mb-3 md:mb-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]")}
          style={getAnimStyle('0.3s')}
        >
          YA LO TENGO
        </h1>

        {/* Subtítulo */}
        <p
          className={getAnimClass("text-base sm:text-2xl md:text-4xl font-light text-slate-100 mb-4 md:mb-8 tracking-wide drop-shadow-md")}
          style={getAnimStyle('0.5s')}
        >
          <span className="font-bold text-emerald-400">INVESTIGACIÓN.</span> DESARROLLO. <span className="font-bold text-emerald-400">INNOVACIÓN.</span>
        </p>

        {/* Descripción */}
        <p
          className={getAnimClass("text-slate-200 text-xs sm:text-base md:text-xl max-w-lg md:max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-sm px-2")}
          style={getAnimStyle('0.7s')}
        >
          Transformamos la imaginación en ingeniería. El epicentro de la
          robótica y la educación tecnológica en un solo lugar.
        </p>

        {/* --- BUSCADOR ELIMINADO --- */}

      </div>

      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]"></div>
    </div>
  )
}