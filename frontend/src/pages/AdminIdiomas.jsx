import React, { useState, useEffect } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, CheckIcon, LanguageIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function AdminIdiomas() {
  const [idiomas, setIdiomas] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [isOtro, setIsOtro] = useState(false)
  
  // Para editar traducciones UI
  const [editingLang, setEditingLang] = useState(null)
  const [uiTranslations, setUiTranslations] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCats, setExpandedCats] = useState({})

  const filteredTranslations = uiTranslations.filter(t =>
    t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const categorizeTranslations = (translations) => {
    const categories = {
      'Temáticas (Filtros de App)': [],
      'App: Autenticación': [],
      'App: Navegación y Ajustes': [],
      'App: Realidad Aumentada': [],
      'App: Datos y Taxonomía': [],
      'App: Alertas y Sistema': [],
      'Otros Textos': []
    };

    translations.forEach(t => {
      const key = t.key.toLowerCase();
      if (key.startsWith('tema_')) categories['Temáticas (Filtros de App)'].push(t);
      else if (key.startsWith('txtlogin')) categories['App: Autenticación'].push(t);
      else if (key.startsWith('txtbienv') || key.startsWith('txttemas') || key.startsWith('txtajustes')) categories['App: Navegación y Ajustes'].push(t);
      else if (key.startsWith('txtar') || key.startsWith('txtgaleria') || key.startsWith('txteliminar') || key.startsWith('txtexito')) categories['App: Realidad Aumentada'].push(t);
      else if (key.startsWith('lbl_') || key.includes('nombre') || key.includes('todos')) categories['App: Datos y Taxonomía'].push(t);
      else if (key.startsWith('msg')) categories['App: Alertas y Sistema'].push(t);
      else categories['Otros Textos'].push(t);
    });

    return Object.entries(categories).filter(([_, items]) => items.length > 0);
  };

  const groupedTranslations = categorizeTranslations(filteredTranslations);

  const toggleCategory = (catName) => {
    setExpandedCats(prev => ({ ...prev, [catName]: !prev[catName] }))
  }

  // Cuando cambia el idioma, expandimos por defecto "Temáticas" y colapsamos el resto para no saturar
  useEffect(() => {
    if (editingLang) {
      setExpandedCats({ 'Temáticas (Filtros de App)': true })
    }
  }, [editingLang])

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
    let finalCode = newCode;
    if (isOtro) {
        finalCode = newName.trim().substring(0, 3).toLowerCase().padEnd(3, 'a');
    }
    if (!finalCode || !newName) return toast.error('Llene todos los campos')
    
    const loadingToast = toast.loading('Creando idioma y autotraduciendo interfaz...')
    try {
      await api.post('/languages', { code: finalCode, name: newName })
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
    setSearchTerm('')
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

  const handleSyncUI = async () => {
    const loadingToast = toast.loading('Sincronizando base de datos, por favor espera...')
    try {
      const res = await api.post('/languages/sync-ui')
      toast.success(res.data.message || 'Sincronización completada', { id: loadingToast, duration: 4000 })
      
      const idiomasRes = await api.get('/languages')
      setIdiomas(idiomasRes.data)
      
      if (editingLang) {
        const updatedLang = idiomasRes.data.find(i => i.code === editingLang.code)
        if (updatedLang) {
          setEditingLang(updatedLang)
          setUiTranslations(updatedLang.ui_translations || [])
        }
      }
    } catch (error) {
      toast.error('Error al sincronizar claves', { id: loadingToast })
    }
  }

  return (
    <div className="relative max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3 w-full lg:w-auto">
          <button onClick={() => window.history.back()} className="p-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-full transition-colors self-start" title="Volver">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="mt-1 sm:mt-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <LanguageIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
              Gestión de Idiomas
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Agrega idiomas globales para el Micromuseo AR</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={handleSyncUI}
            className="flex items-center justify-center gap-2 px-4 py-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg shadow-sm border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors w-full sm:w-auto font-medium"
            title="Añadir nuevas claves y limpiar las obsoletas en todos los idiomas"
          >
            <ArrowPathIcon className="w-5 h-5" /> Sincronizar Claves
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-emerald-600 rounded-lg shadow-sm hover:bg-emerald-700 transition-colors w-full sm:w-auto"
          >
            <PlusIcon className="w-5 h-5" /> Nuevo Idioma
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddIdioma} className="bg-white dark:bg-[#1c1c1c] p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 items-end animate-fadeIn">
          <div className="w-full sm:w-1/3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Idioma Oficial</label>
            <select 
              value={isOtro ? 'otro' : newCode} 
              onChange={e => {
                  if (e.target.value === 'otro') {
                      setIsOtro(true);
                      setNewCode('');
                      setNewName('');
                  } else {
                      setIsOtro(false);
                      setNewCode(e.target.value);
                      if(e.target.value) setNewName(e.target.options[e.target.selectedIndex].text);
                  }
              }}
              className="w-full p-2.5 border border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-zinc-900 dark:text-white" 
            >
              <option value="">-- Selecciona un idioma --</option>
              <option value="en">Inglés</option>
              <option value="pt">Portugués</option>
              <option value="fr">Francés</option>
              <option value="de">Alemán</option>
              <option value="it">Italiano</option>
              <option value="zh">Chino</option>
              <option value="ja">Japonés</option>
              <option value="qu">Quechua</option>
              <option value="ay">Aymara</option>
              <option value="ru">Ruso</option>
              <option value="ar">Árabe</option>
              <option value="ko">Coreano</option>
              <option value="hi">Hindi</option>
              <option value="otro">Otro (Lengua Amazónica / Personalizada)</option>
            </select>
          </div>
          
          <div className="w-full sm:w-1/3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre (Editable)</label>
            <input 
              type="text" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              className="w-full p-2.5 border border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 dark:bg-zinc-800/50 dark:text-white" 
              placeholder="Ej. Holandés" 
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2.5 text-gray-500 dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition">Cancelar</button>
            <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition">Crear</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LISTA DE IDIOMAS */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <h2 className="font-black text-gray-700 dark:text-gray-300 p-4 border-b dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 uppercase text-sm tracking-widest">Idiomas Habilitados</h2>
          {loading ? <div className="p-4 text-center text-gray-400 dark:text-gray-500">Cargando...</div> : (
            <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
              {idiomas.map(idioma => (
                <li key={idioma.code} className={`p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/80 cursor-pointer transition ${editingLang?.code === idioma.code ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500' : ''}`} onClick={() => openTranslations(idioma)}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-200">{idioma.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Código: {idioma.code}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleToggleStatus(idioma.code, idioma.is_active); }}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${idioma.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}
                    >
                      {idioma.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                </li>
              ))}
              {idiomas.length === 0 && <p className="p-4 text-gray-500 dark:text-gray-400 text-center">No hay idiomas registrados.</p>}
            </ul>
          )}
        </div>

        {/* EDITOR DE UI */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6 min-h-[400px]">
          {editingLang ? (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <PencilIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                    Traducciones de la App: {editingLang.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Estos textos aparecerán en los botones de la App de AR.</p>
                </div>
              </div>

              {/* BUSCADOR */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Buscar por clave o texto..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 dark:bg-zinc-800/50 dark:text-white"
                />
                {searchTerm && (
                  <p className="text-xs text-gray-400 mt-1">
                    {filteredTranslations.length} resultado(s) de {uiTranslations.length} total
                  </p>
                )}
              </div>

              {uiTranslations.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No hay textos generados para este idioma aún.</p>
                </div>
              ) : filteredTranslations.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No se encontraron resultados para "{searchTerm}"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedTranslations.map(([catName, items]) => {
                    // Si hay término de búsqueda, expandimos todo automáticamente
                    const isExpanded = searchTerm ? true : expandedCats[catName];
                    return (
                      <div key={catName} className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#1c1c1c]">
                        <button
                          onClick={() => toggleCategory(catName)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-700 dark:text-gray-300">{catName}</span>
                            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">
                              {items.length}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUpIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          )}
                        </button>
                        
                        {isExpanded && (
                          <div className="p-4 space-y-3 border-t border-gray-200 dark:border-zinc-800">
                            {items.map((trans) => (
                              <TranslationItem key={trans.id} trans={trans} onSave={handleSaveTranslation} />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
              <LanguageIcon className="w-16 h-16 opacity-20 mb-4" />
              <p className="font-medium text-lg dark:text-gray-300">Selecciona un idioma a la izquierda</p>
              <p className="text-sm dark:text-gray-400">para editar los botones de la app</p>
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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg border border-gray-100 dark:border-zinc-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors group gap-2">
      <div className="w-full sm:w-1/3">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider break-all">{trans.key}</span>
      </div>
      <div className="w-full sm:w-2/3 flex items-center gap-2">
        {isEditing ? (
          <input 
            type="text" 
            value={val} 
            onChange={e => setVal(e.target.value)}
            className="flex-1 p-1.5 border border-emerald-400 dark:border-emerald-600 rounded outline-none focus:ring-2 ring-emerald-200 dark:ring-emerald-900 bg-white dark:bg-zinc-900 dark:text-white"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-gray-700 dark:text-gray-300 font-medium">{val}</span>
        )}
        
        {isEditing ? (
          <div className="flex gap-1">
            <button onClick={handleSave} className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/60"><CheckIcon className="w-4 h-4" /></button>
            <button onClick={() => { setVal(trans.value); setIsEditing(false) }} className="p-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/60"><XMarkIcon className="w-4 h-4" /></button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"><PencilIcon className="w-4 h-4" /></button>
        )}
      </div>
    </div>
  )
}
