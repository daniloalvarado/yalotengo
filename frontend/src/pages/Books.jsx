import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import Tooltip from '../components/Tooltip'
import toast from 'react-hot-toast'
import { BookOpenIcon, ShoppingCartIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import styled from 'styled-components'

const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })

export default function Books() {
    const navigate = useNavigate()
    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [addingToCart, setAddingToCart] = useState({})
    const [ownedIds, setOwnedIds] = useState(new Set())
    const [cartIds, setCartIds] = useState(new Set())

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const { data } = await api.get('/books')
                setBooks(data)

                const token = localStorage.getItem('token')
                if (token) {
                    const [purchasesRes, cartRes] = await Promise.all([
                        api.get('/books/my/purchases').catch(() => ({ data: [] })),
                        api.get('/books/cart').catch(() => ({ data: [] }))
                    ])

                    const owned = new Set(purchasesRes.data.map(p => p.boo_int_id))
                    const inCart = new Set(cartRes.data.map(p => p.boo_int_id))

                    setOwnedIds(owned)
                    setCartIds(inCart)
                }
            } catch (e) {
                setError('Error al cargar libros')
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchBooks()
    }, [])

    // Escuchar actualizaciones del carrito para refrescar estado
    useEffect(() => {
        const onCartUpdate = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            try {
                const { data } = await api.get('/books/cart')
                setCartIds(new Set(data.map(p => p.boo_int_id)))
            } catch (e) { console.error(e) }
        }
        window.addEventListener('cart:update', onCartUpdate)
        return () => window.removeEventListener('cart:update', onCartUpdate)
    }, [])

    const handleBuy = (book) => {
        const token = localStorage.getItem('token')
        if (!token) {
            navigate('/auth', { state: { from: '/books' } })
            return
        }
        navigate('/books/checkout', { state: { book } })
    }

    const handleAddToCart = async (book) => {
        const token = localStorage.getItem('token')
        if (!token) {
            navigate('/auth', { state: { from: '/books' } })
            return
        }

        setAddingToCart(prev => ({ ...prev, [book.boo_int_id]: true }))
        try {
            await api.post('/books/cart', { bookId: book.boo_int_id })
            toast.success('Libro añadido al carrito')
            window.dispatchEvent(new Event('cart:update'))
        } catch (e) {
            const msg = e.response?.data?.error || 'Error al añadir al carrito'
            toast.error(msg)
        } finally {
            setAddingToCart(prev => ({ ...prev, [book.boo_int_id]: false }))
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpenIcon className="w-8 h-8 text-emerald-600" />
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                            Libros Digitales
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        Descarga libros en formato PDF y EPUB para leer en cualquier dispositivo.
                    </p>
                </div>

                {error && (
                    <div className="text-center text-red-600 mb-6">{error}</div>
                )}

                {books.length === 0 && !loading && (
                    <div className="text-center text-gray-500 py-12">
                        No hay libros disponibles en este momento.
                    </div>
                )}

                {/* Books Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                    {books.map((book) => (
                        <StyledWrapper key={book.boo_int_id}>
                            <div className="book">
                                {/* LO QUE SE VE AL ABRIR (FONDO/INTERIOR) */}
                                <div className="pl-10 pr-4 py-4 flex flex-col h-full justify-between items-center text-center w-full">
                                    <div>
                                        <h3 className="font-bold text-sm text-gray-800 mb-1 line-clamp-2">
                                            {book.boo_txt_title}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-2">{book.boo_txt_author}</p>
                                        <p className="text-xs text-gray-600 line-clamp-3 mb-2">
                                            {book.boo_txt_desc}
                                        </p>
                                    </div>

                                    <div className="mt-auto w-full flex items-center justify-between px-1">
                                        <p className="text-lg font-bold text-emerald-600">
                                            {PEN.format(book.boo_dec_price)}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {ownedIds.has(book.boo_int_id) ? (
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                                    Adquirido
                                                </span>
                                            ) : cartIds.has(book.boo_int_id) ? (
                                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                                                    En carrito
                                                </span>
                                            ) : (
                                                <Tooltip text="Añadir al carrito" position="top">
                                                    <button
                                                        onClick={() => handleAddToCart(book)}
                                                        disabled={addingToCart[book.boo_int_id]}
                                                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <ShoppingCartIcon className="w-5 h-5" />
                                                    </button>
                                                </Tooltip>
                                            )}

                                            {!ownedIds.has(book.boo_int_id) && !cartIds.has(book.boo_int_id) && (
                                                <Tooltip text="Comprar ahora" position="top">
                                                    <button
                                                        onClick={() => handleBuy(book)}
                                                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                                                    >
                                                        <BanknotesIcon className="w-5 h-5" />
                                                    </button>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* PORTADA (LO QUE GIRA) */}
                                <div className="cover">
                                    {book.boo_txt_cover_image ? (
                                        <img
                                            src={
                                                book.boo_txt_cover_image.startsWith('http')
                                                    ? book.boo_txt_cover_image
                                                    : `${api.defaults.baseURL?.replace(/\/api\/?$/, '')}/uploads/books/${book.boo_txt_cover_image}`
                                            }
                                            onError={(e) => {
                                                // Fallback para imágenes antiguas en /libros
                                                if (!e.target.src.includes('/libros/')) {
                                                    e.target.src = `/libros/${book.boo_txt_cover_image}`
                                                }
                                            }}
                                            alt={book.boo_txt_title}
                                            className="w-full h-full object-cover rounded-[10px]"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50 text-emerald-800 p-4 text-center rounded-[10px]">
                                            <BookOpenIcon className="w-12 h-12 mb-2" />
                                            <span className="font-bold text-sm">{book.boo_txt_title}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </StyledWrapper>
                    ))}
                </div>
            </div>
        </div>
    )
}

const StyledWrapper = styled.div`
  .book {
    position: relative;
    border-radius: 10px;
    width: 220px;
    height: 300px;
    background-color: whitesmoke;
    -webkit-box-shadow: 1px 1px 12px #000;
    box-shadow: 1px 1px 12px rgba(0,0,0,0.3);
    -webkit-transform: preserve-3d;
    -ms-transform: preserve-3d;
    transform: preserve-3d;
    -webkit-perspective: 2000px;
    perspective: 2000px;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    color: #000;
  }

  .cover {
    top: 0;
    position: absolute;
    background-color: lightgray;
    width: 100%;
    height: 100%;
    border-radius: 10px;
    cursor: pointer;
    -webkit-transition: all 0.5s;
    transition: all 0.5s;
    -webkit-transform-origin: 0;
    -ms-transform-origin: 0;
    transform-origin: 0;
    -webkit-box-shadow: 1px 1px 12px rgba(0,0,0,0.3);
    box-shadow: 1px 1px 12px rgba(0,0,0,0.3);
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
  }

  .book:hover .cover {
    -webkit-transition: all 0.5s;
    transition: all 0.5s;
    -webkit-transform: rotatey(-80deg);
    -ms-transform: rotatey(-80deg);
    transform: rotatey(-80deg);
  }
`;