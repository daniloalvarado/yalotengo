import React, { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { Toaster } from 'react-hot-toast'

// Layout principal (Carga normal para mostrar la barra superior de inmediato)
import Layout from './pages/Layout'

// Páginas con carga diferida (Lazy Loading)
const Home = React.lazy(() => import('./pages/Home'))
const Auth = React.lazy(() => import('./pages/Auth'))
const Cart = React.lazy(() => import('./pages/Cart'))
const Order = React.lazy(() => import('./pages/Order'))
const OrderDetail = React.lazy(() => import('./pages/OrderDetail'))
const Admin = React.lazy(() => import('./pages/Admin'))
const Purchases = React.lazy(() => import('./pages/Purchases'))
const Reservation = React.lazy(() => import('./pages/Reservation'))
const AdminReservations = React.lazy(() => import('./pages/AdminReservations'))
const Models3D = React.lazy(() => import('./pages/Models3D'))
const Models3DCheckout = React.lazy(() => import('./pages/Models3DCheckout'))
const Books = React.lazy(() => import('./pages/Books'))
const BooksCheckout = React.lazy(() => import('./pages/BooksCheckout'))
const Courses = React.lazy(() => import('./pages/Courses'))
const CoursesCheckout = React.lazy(() => import('./pages/CoursesCheckout'))
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'))
const AdminModels3D = React.lazy(() => import('./pages/AdminModels3D'))
const AdminBooks = React.lazy(() => import('./pages/AdminBooks'))
const AdminCourses = React.lazy(() => import('./pages/AdminCourses'))
const AdminUnityModels = React.lazy(() => import('./pages/AdminUnityModels'))
const AdminIdiomas = React.lazy(() => import('./pages/AdminIdiomas'))
const Profile = React.lazy(() => import('./pages/Profile'))
const Help = React.lazy(() => import('./pages/Help'))

function RequireAuth({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/auth" replace />
}

// Componente simple de carga (Spinner o esqueleto)
function PageLoader() {
  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <>
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/order/:id" element={<RequireAuth><Order /></RequireAuth>} />
            <Route path="/order/:ordId" element={<OrderDetail />} />
            <Route path="/purchases" element={<RequireAuth><Purchases /></RequireAuth>} />
            <Route path="/admin_2EU32984Y3BJSFGADF_ASFADF" element={<Admin />} />
            <Route path="/reservations" element={<RequireAuth><Reservation /></RequireAuth>} />
            <Route path="/admin-reservas" element={<RequireAuth><AdminReservations /></RequireAuth>} />
            <Route path="/models3d" element={<Models3D />} />
            <Route path="/models3d/checkout" element={<RequireAuth><Models3DCheckout /></RequireAuth>} />
            <Route path="/books" element={<Books />} />
            <Route path="/books/checkout" element={<RequireAuth><BooksCheckout /></RequireAuth>} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/checkout" element={<RequireAuth><CoursesCheckout /></RequireAuth>} />
            {/* Admin pages */}
            <Route path="/admin-dashboard" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
            <Route path="/admin-models3d" element={<RequireAuth><AdminModels3D /></RequireAuth>} />
            <Route path="/admin-microscopicos" element={<RequireAuth><AdminUnityModels /></RequireAuth>} />
            <Route path="/admin-idiomas" element={<RequireAuth><AdminIdiomas /></RequireAuth>} />
            <Route path="/admin-books" element={<RequireAuth><AdminBooks /></RequireAuth>} />
            <Route path="/admin-courses" element={<RequireAuth><AdminCourses /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="/help" element={<Help />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
    <Toaster position="top-right" />
  </>
)
