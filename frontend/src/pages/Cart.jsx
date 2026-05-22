import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import toast from "react-hot-toast";
import Swal from 'sweetalert2';
import Tooltip from '../components/Tooltip';
import DigitalCartCheckout from '../components/DigitalCartCheckout';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  TrashIcon,
  CreditCardIcon,
  TicketIcon,
  CubeIcon,
  BookOpenIcon,
  AcademicCapIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";
import FadeInStagger from '../components/ui/FadeInStagger'

// --- HELPERS ---

// Formateador SIMPLE: Solo Dólares
const formatUSD = (amount) => {
  const value = Number(amount || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

const formatDate = (isoDate) => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
};

const formatTimeAMPM = (time24) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
};

// --- COMPONENTE TEMPORIZADOR ROBUSTO ---
function CountdownTimer({ createdAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(null);
  // Usamos una referencia para el callback para evitar problemas de "stale closures"
  const onExpireRef = useRef(onExpire);
  const hasNotifiedRef = useRef(false);

  // Mantiene la referencia del callback actualizada
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!createdAt) return;

    const created = new Date(createdAt).getTime();
    const expireTime = created + (15 * 60 * 1000); // 15 minutos

    const checkTime = () => {
      const now = Date.now();
      const diff = Math.floor((expireTime - now) / 1000);

      if (diff <= 0) {
        setTimeLeft(0);
        // Si llega a 0 y aún no hemos avisado, avisamos.
        if (!hasNotifiedRef.current) {
          hasNotifiedRef.current = true;
          if (onExpireRef.current) onExpireRef.current();
        }
      } else {
        setTimeLeft(diff);
      }
    };

    // Chequeo inicial
    checkTime();

    // Si ya expiró al cargar, no iniciamos el intervalo para no saturar,
    // pero si quieres que avise incluso al recargar, quita la siguiente línea.
    if (Date.now() > expireTime) return;

    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  if (timeLeft === null) return null;

  // Renderizado visual
  if (timeLeft <= 0) {
    return (
      <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded border border-red-100">
        Expirado
      </span>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isUrgent = minutes < 5;
  const colorClass = isUrgent
    ? "text-red-600 bg-red-50 border-red-100 animate-pulse"
    : "text-emerald-600 bg-emerald-50 border-emerald-100";

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass} transition-colors duration-300`}>
      <ClockIcon className="w-3.5 h-3.5" />
      <span>
        {minutes}:{seconds < 10 ? `0${seconds}` : seconds} min
      </span>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function Cart() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [models, setModels] = useState([]);
  const [books, setBooks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingIds, setLoadingIds] = useState({});
  const [errorMsg, setErrorMsg] = useState(null);
  const [loadingGlobal, setLoadingGlobal] = useState(true);

  const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

  async function load() {
    setErrorMsg(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setReservations([]);
      setModels([]);
      setBooks([]);
      setCourses([]);
      setLoadingGlobal(false);
      return;
    }

    try {
      // Cargar reservaciones
      const reservationsRes = await api.get("/reservations/my").catch(() => ({ data: { reservations: [] } }));
      const pending = (reservationsRes.data?.reservations || []).filter(r => r.status === 'PENDING');
      setReservations(pending);

      // Cargar productos del carrito
      const [modelsRes, booksRes, coursesRes] = await Promise.all([
        api.get("/models3d/cart").catch(() => ({ data: [] })),
        api.get("/books/cart").catch(() => ({ data: [] })),
        api.get("/courses/cart").catch(() => ({ data: [] }))
      ]);

      setModels(modelsRes.data || []);
      setBooks(booksRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (e) {
      console.error("Error cargando carrito:", e);
      setErrorMsg("No pudimos cargar tu carrito. Intenta recargar.");
    } finally {
      setLoadingGlobal(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleCompletePayment = (reservation) => {
    navigate('/reservations', { state: { pendingReservation: reservation } });
  };

  const handleCancelReservation = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar reserva?',
      text: "Liberaremos tu cupo para otros usuarios.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#e5e7eb',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: '<span class="text-gray-600">Cancelar</span>',
      focusCancel: true
    });

    if (!result.isConfirmed) return;

    setLoadingIds((m) => ({ ...m, [`res-${id}`]: true }));
    try {
      await api.delete(`/reservations/${id}`);
      setReservations((prev) => prev.filter((r) => r.id !== id));
      window.dispatchEvent(new Event("cart:update"));
      toast.success("Reserva eliminada");
    } catch (e) {
      toast.error("Error al eliminar la reserva");
      load();
    } finally {
      setLoadingIds((m) => ({ ...m, [`res-${id}`]: false }));
    }
  };

  // Manejador de expiración
  const handleReservationExpired = async () => {
    await load();
    window.dispatchEvent(new Event("cart:update"));
    toast.error("El tiempo de tu reserva ha expirado", { id: 'reservation-expired' });
  };

  // Eliminar producto del carrito
  const handleRemoveProduct = async (type, id) => {
    const endpoint = type === 'model' ? `/models3d/cart/${id}`
      : type === 'book' ? `/books/cart/${id}`
        : `/courses/cart/${id}`;

    setLoadingIds(prev => ({ ...prev, [`${type}-${id}`]: true }));
    try {
      await api.delete(endpoint);
      toast.success('Eliminado del carrito');
      await load();
      window.dispatchEvent(new Event('cart:update'));
    } catch (e) {
      toast.error('Error al eliminar');
    } finally {
      setLoadingIds(prev => ({ ...prev, [`${type}-${id}`]: false }));
    }
  };

  // Ir a checkout de producto
  const handleBuyProduct = (type, item) => {
    if (type === 'model') {
      navigate('/models3d/checkout', { state: { model: item.model } });
    } else if (type === 'book') {
      navigate('/books/checkout', { state: { book: item.book } });
    } else {
      navigate('/courses/checkout', { state: { course: item.course } });
    }
  };

  const handleUpdateQuantity = async (type, id, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;

    // Optimistic UI update (optional, but good)
    // For now, let's rely on loading state
    setLoadingIds(prev => ({ ...prev, [`${type}-${id}`]: true }));

    const endpoint = type === 'model'
      ? `/models3d/cart/${id}`
      : `/courses/cart/${id}`; // Courses supports quantity

    try {
      await api.put(endpoint, { quantity: newQty });
      // Update local state to reflect change immediately or reload
      // Reloading is safer for totals calculation
      await load();
      window.dispatchEvent(new Event('cart:update'));
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al actualizar cantidad');
    } finally {
      setLoadingIds(prev => ({ ...prev, [`${type}-${id}`]: false }));
    }
  };

  const totalProducts = models.length + books.length + courses.length;
  const totalItems = reservations.length + totalProducts;

  if (loadingGlobal) {
    return <div className="p-8 text-center text-gray-400 animate-pulse">Cargando carrito...</div>;
  }

  return (
    <FadeInStagger staggerDelay={100} className="max-w-4xl mx-auto">
      {/* Header del Carrito */}
      <div className="text-left mb-10">
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3 mt-4 md:mt-10">Tu Carrito</h2>
        <p className="text-gray-600">
          Tienes {totalItems} {totalItems === 1 ? 'item' : 'items'} en tu carrito
        </p>
      </div>


      {
        errorMsg && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {errorMsg}
          </div>
        )
      }

      {
        totalItems === 0 ? (
          // Estado Vacío
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
              <TicketIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Tu carrito está vacío</h3>
            <p className="text-gray-500 text-sm mb-6">No tienes productos ni reservas pendientes de pago.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {reservations.map((r) => {
              // Lógica de precio simplificada: Solo USD
              // Usamos precio del backend, o fallback de $5 por persona si no existe
              const finalPrice = r.price || (r.guests * 5);

              return (
                <div
                  key={r.id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  <div className="p-5 flex flex-col md:flex-row md:items-center gap-5">

                    {/* Columna Izquierda: Información Principal */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between md:justify-start gap-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                            Reserva #{r.id}
                          </span>
                          <CountdownTimer
                            createdAt={r.createdAt}
                            onExpire={handleReservationExpired}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                          <span className="capitalize">{formatDate(r.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          <span>{formatTimeAMPM(r.timeslot)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <UserGroupIcon className="w-4 h-4 text-gray-400" />
                          <span>{r.guests} {r.guests === 1 ? 'persona' : 'personas'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Separador móvil */}
                    <div className="h-px bg-gray-100 w-full md:hidden"></div>

                    {/* Columna Derecha: Precio y Acciones */}
                    <div className="flex items-center justify-between md:justify-end gap-6 md:w-auto">

                      {/* Precio: SOLO DÓLARES */}
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-0.5">Total a pagar</p>

                        <div className="text-xl font-bold text-gray-900 leading-none">
                          {formatUSD(finalPrice)}
                        </div>

                        <p className="text-[10px] font-medium mt-1 text-gray-500 flex items-center justify-end gap-1">
                          <CreditCardIcon className="w-3 h-3" /> USD
                        </p>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <button
                          onClick={() => handleCompletePayment(r)}
                          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-emerald-200 transition-colors"
                        >
                          Pagar Ahora
                        </button>
                        <button
                          onClick={() => handleCancelReservation(r.id)}
                          disabled={loadingIds[`res-${r.id}`]}
                          className="flex items-center justify-center gap-2 w-full px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                          {loadingIds[`res-${r.id}`] ? "..." : "Eliminar"}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}

            {/* === SECCIÓN DE PRODUCTOS DIGITALES === */}
            {totalProducts > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CubeIcon className="w-6 h-6 text-emerald-600" />
                  Productos Digitales ({totalProducts})
                </h3>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Columna Izquierda: Lista de Items */}
                  <div className="space-y-4">

                    {/* Modelos 3D */}
                    {models.map((item) => {
                      const isPrinted = item.model?.mod_txt_category === 'IMPRESO';
                      return (
                        <div key={`model-${item.pur_int_id}`} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4 relative z-0 hover:z-10 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <CubeIcon className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{item.model?.mod_txt_name || 'Modelo 3D'}</p>
                              <p className="text-xs text-gray-500">{isPrinted ? 'Impresión 3D' : 'Modelo 3D Digital'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {isPrinted && (
                              <div className="flex items-center border border-gray-200 rounded-lg">
                                <button
                                  onClick={() => handleUpdateQuantity('model', item.pur_int_id, item.pur_int_quantity || 1, -1)}
                                  disabled={loadingIds[`model-${item.pur_int_id}`] || (item.pur_int_quantity || 1) <= 1}
                                  className="px-2 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                                >-</button>
                                <span className="px-2 text-sm font-medium text-gray-700 min-w-[20px] text-center">
                                  {item.pur_int_quantity || 1}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity('model', item.pur_int_id, item.pur_int_quantity || 1, 1)}
                                  disabled={loadingIds[`model-${item.pur_int_id}`]}
                                  className="px-2 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                                >+</button>
                              </div>
                            )}
                            <span className="font-bold text-gray-900">
                              {PEN.format(Number(item.pur_dec_amount) * (isPrinted ? (item.pur_int_quantity || 1) : 1))}
                            </span>
                            <Tooltip text="Eliminar" position="top">
                              <button
                                onClick={() => handleRemoveProduct('model', item.pur_int_id)}
                                disabled={loadingIds[`model-${item.pur_int_id}`]}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      )
                    })}

                    {/* Libros */}
                    {books.map((item) => (
                      <div key={`book-${item.bpu_int_id}`} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4 relative z-0 hover:z-10 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpenIcon className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.book?.boo_txt_title || 'Libro'}</p>
                            <p className="text-xs text-gray-500">Libro Digital</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-gray-900">{PEN.format(item.bpu_dec_amount)}</span>
                          <Tooltip text="Eliminar" position="top">
                            <button
                              onClick={() => handleRemoveProduct('book', item.bpu_int_id)}
                              disabled={loadingIds[`book-${item.bpu_int_id}`]}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    ))}

                    {/* Cursos */}
                    {courses.map((item) => (
                      <div key={`course-${item.cpu_int_id}`} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4 relative z-0 hover:z-10 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <AcademicCapIcon className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.course?.cou_txt_title || 'Curso'}</p>
                            <p className="text-xs text-gray-500">Curso Online</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center border border-gray-200 rounded-lg">
                            <button
                              onClick={() => handleUpdateQuantity('course', item.cpu_int_id, item.cpu_int_quantity || 1, -1)}
                              disabled={loadingIds[`course-${item.cpu_int_id}`] || (item.cpu_int_quantity || 1) <= 1}
                              className="px-2 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                            >-</button>
                            <span className="px-2 text-sm font-medium text-gray-700 min-w-[20px] text-center">
                              {item.cpu_int_quantity || 1}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity('course', item.cpu_int_id, item.cpu_int_quantity || 1, 1)}
                              disabled={loadingIds[`course-${item.cpu_int_id}`]}
                              className="px-2 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                            >+</button>
                          </div>
                          <span className="font-bold text-gray-900">
                            {PEN.format(Number(item.cpu_dec_amount) * (item.cpu_int_quantity || 1))}
                          </span>
                          <Tooltip text="Eliminar" position="top">
                            <button
                              onClick={() => handleRemoveProduct('course', item.cpu_int_id)}
                              disabled={loadingIds[`course-${item.cpu_int_id}`]}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Columna Derecha: Checkout Unificado */}
                  <div>
                    <DigitalCartCheckout
                      items={[
                        ...models.map(m => ({ ...m, model: m.model })),
                        ...books.map(b => ({ ...b, book: b.book })),
                        ...courses.map(c => ({ ...c, course: c.course }))
                      ]}
                      onPaymentSuccess={() => {
                        load();
                        window.dispatchEvent(new Event('cart:update'));
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }
    </FadeInStagger>
  );
}