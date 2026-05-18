import React, { useState, useEffect } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { PlusIcon, LanguageIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function AdminIdiomas() {
  const [idiomas, setIdiomas] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  
  // Para editar traducciones UI
  const [editingLang, setEditingLang] = useState(null) // El idioma seleccionado para editar UI
  const [uiTranslations, setUiTranslations] = useState([])

  useEffect(() => {
    fetchIdiomas()
  }, [])

  const fetchIdiomas = async () => {
    try {
      setLoading(true)
      const res = await api.get('/languages')
      setIdiomas(res.data)
    } catch (error) {
      toast.error('Error al cargar idiomas')
    } finally {
      setLoading(false)
    }
  }

  const handleAddIdioma = async (e) => {
    e.preventDefault()
    if (!newCode || !newName) return toast.error('Llene código y nombre')
    
    const loadingToast = toast.loading('Creando idioma y autotraduciendo interfaz...')
    try {
      await api.post('/languages', { code: newCode.toLowerCase(), name: newName })
      toast.success('Idioma creado con éxito', { id: loadingToast })
      setIsAdding(false)
      setNewCode('')
      setNewName('')
      fetchIdiomas()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear idioma', { id: loadingToast })
    }
  }

  const handleToggleStatus = async (code, currentStatus) => {
    try {
      await api.put(`/languages/${code}`, { is_active: !currentStatus })
      toast.success('Estado actualizado')
      fetchIdiomas()
    } catch (error) {
      toast.error('Error al actualizar')
    }
  }

  const openTranslations = (idioma) => {
    setEditingLang(idioma)
    setUiTranslations(idioma.ui_translations || [])
  }

  const handleSaveTranslation = async (key, newValue) => {
    try {
      await api.put(`/languages/${editingLang.code}/ui/${key}`, { value: newValue })
      toast.success('Traducción guardada')
      // Actualizar estado local
      const updated = uiTranslations.map(t => t.key === key ? { ...t, value: newValue } : t)
      setUiTranslations(updated)
    } catch (error) {
      toast.error('Error al guardar')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-2xl shadow-lg text-white">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <LanguageIcon className="w-8 h-8 opacity-90" />
            Gestión de Idiomas
          </h1>
          <p className="text-emerald-100 mt-2">Agrega idiomas globales para el Micromuseo AR</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-white text-emerald-700 px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-emerald-50 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" /> Nuevo Idioma
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddIdioma} className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col sm:flex-row gap-4 items-end animate-fadeIn">
          <div className="w-full sm:w-1/3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Código ISO (ej. en, qu, zh)</label>
            <input 
              type="text" 
              value={newCode} 
              onChange={e => setNewCode(e.target.value)} 
              maxLength="5"
              className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
              placeholder="es" 
            />
          </div>
          <div className="w-full sm:w-1/3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre (ej. Alemán)</label>
            <input 
              type="text" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
              placeholder="Español" 
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2.5 text-gray-500 font-semibold hover:bg-gray-100 rounded-xl transition">Cancelar</button>
            <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition">Crear</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LISTA DE IDIOMAS */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <h2 className="font-black text-gray-700 p-4 border-b bg-gray-50 uppercase text-sm tracking-widest">Idiomas Habilitados</h2>
          {loading ? <div className="p-4 text-center text-gray-400">Cargando...</div> : (
            <ul className="divide-y divide-gray-100">
              {idiomas.map(idioma => (
                <li key={idioma.code} className={`p-4 hover:bg-gray-50 cursor-pointer transition ${editingLang?.code === idioma.code ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''}`} onClick={() => openTranslations(idioma)}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800">{idioma.name}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Código: {idioma.code}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleToggleStatus(idioma.code, idioma.is_active); }}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${idioma.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {idioma.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                </li>
              ))}
              {idiomas.length === 0 && <p className="p-4 text-gray-500 text-center">No hay idiomas registrados.</p>}
            </ul>
          )}
        </div>

        {/* EDITOR DE UI */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
          {editingLang ? (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                    <PencilIcon className="w-5 h-5 text-emerald-600" />
                    Traducciones de la App: {editingLang.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Estos textos aparecerán en los botones de la App de AR.</p>
                </div>
              </div>

              {uiTranslations.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 font-medium">No hay textos generados para este idioma aún.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {uiTranslations.map((trans) => (
                    <TranslationItem key={trans.id} trans={trans} onSave={handleSaveTranslation} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
              <LanguageIcon className="w-16 h-16 opacity-20 mb-4" />
              <p className="font-medium text-lg">Selecciona un idioma a la izquierda</p>
              <p className="text-sm">para editar los botones de la app</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TranslationItem({ trans, onSave }) {
  const [val, setVal] = useState(trans.value)
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = () => {
    onSave(trans.key, val)
    setIsEditing(false)
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors group gap-2">
      <div className="w-full sm:w-1/3">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{trans.key}</span>
      </div>
      <div className="w-full sm:w-2/3 flex items-center gap-2">
        {isEditing ? (
          <input 
            type="text" 
            value={val} 
            onChange={e => setVal(e.target.value)}
            className="flex-1 p-1.5 border border-emerald-400 rounded outline-none focus:ring-2 ring-emerald-200"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-gray-700 font-medium">{val}</span>
        )}
        
        {isEditing ? (
          <div className="flex gap-1">
            <button onClick={handleSave} className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"><CheckIcon className="w-4 h-4" /></button>
            <button onClick={() => { setVal(trans.value); setIsEditing(false) }} className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"><XMarkIcon className="w-4 h-4" /></button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-emerald-600 transition-all"><PencilIcon className="w-4 h-4" /></button>
        )}
      </div>
    </div>
  )
}
