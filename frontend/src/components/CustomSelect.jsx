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
    <div className="relative inline-block text-left z-10" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm hover:shadow hover:border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full sm:w-auto justify-between sm:justify-start"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {label && <span className="text-sm font-medium text-gray-500">{label}</span>}
          <span className="text-sm font-semibold text-gray-800">{value}</span>
        </div>
        <ChevronDownIcon 
          className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu con Animación de entrada y salida (usando Tailwind) */}
      <div 
        className={`absolute right-0 sm:left-0 mt-2 w-48 origin-top-right sm:origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-200 ease-out 
          ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'}`}
      >
        <div className="py-1 max-h-60 overflow-auto custom-scrollbar">
          {options.map((option) => (
            <button
              key={option}
              className={`group flex w-full items-center px-4 py-2.5 text-sm transition-colors
                ${option === value ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}
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
