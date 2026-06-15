import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function CustomStatusSelect({ options, value, onChange }) {
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

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="relative w-full text-left z-20" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center justify-between w-full bg-white px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm text-gray-800">{selectedOption.label}</span>
        <ChevronDownIcon 
          className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <div 
        className={`absolute left-0 right-0 mt-1 origin-top rounded-lg bg-white shadow-lg border border-gray-100 ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-200 ease-out z-50
          ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'}`}
      >
        <div className="py-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors
                ${option.value === value ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}
              `}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
