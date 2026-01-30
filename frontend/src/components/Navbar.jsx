import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../api/client'

export default function Navbar() {
  const [count, setCount] = useState(0)
  const nav = useNavigate()
  const token = localStorage.getItem('token')

  useEffect(() => {
    async function load() {
      if (!token) return setCount(0)
      try {
        const { data } = await api.get('/cart')
        setCount((data.items || []).length)
      } catch { }
    }
    load()
  }, [token])

  function logout() {
    localStorage.removeItem('token')
    nav('/auth')
  }

  return (
    <div className="bg-white border-b">
      <div className="max-w-5xl mx-auto flex items-center justify-between p-3">
        <Link to="/" className="font-semibold">Yalotengo</Link>
        <div className="flex gap-4 items-center">
          <Link to="/cart" className="relative">Carrito
            <span className="ml-1 text-xs bg-slate-900 text-white px-2 py-0.5 rounded-full">{count}</span>
          </Link>
          {token ? <button onClick={logout} className="text-sm underline">Salir</button> : <Link to="/auth" className="text-sm underline">Entrar</Link>}
        </div>
      </div>
    </div>
  )
}
