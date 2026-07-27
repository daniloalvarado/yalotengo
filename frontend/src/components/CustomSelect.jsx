import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function CustomSelect({ options, value, onChange, label = 'Filtrar:' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left z-50 w-full sm:w-auto" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center gap-2 bg-white dark:bg-[#1c1c1c] px-4 py-2 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow hover:border-gray-200 dark:hover:border-zinc-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full sm:w-auto justify-between sm:justify-start"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {label && <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">{label}</span>}
          <span className="text-sm font-semibold text-gray-800 dark:text-white">{value}</span>
        </div>
        <ChevronDownIcon 
          className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu con Animación de entrada y salida (usando Tailwind) */}
      <div 
        className={`absolute right-0 sm:left-0 mt-2 w-full origin-top-right sm:origin-top-left rounded-xl bg-white dark:bg-[#1c1c1c] shadow-lg ring-1 ring-black dark:ring-white/10 ring-opacity-5 focus:outline-none transition-all duration-200 ease-out z-50
          ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'}`}
      >
        <div className="py-1 max-h-60 overflow-auto custom-scrollbar">
          {options.map((option) => (
            <button
              key={option}
              className={`group flex w-full items-center px-4 py-2.5 text-sm transition-colors
                ${option === value ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'}
              `}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              <div className="flex items-center justify-between w-full">
                <span>{option}</span>
                {option === value && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
