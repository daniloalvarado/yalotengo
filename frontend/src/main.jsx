import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Layout from './pages/Layout'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Cart from './pages/Cart'
import Order from './pages/Order'
import { Toaster } from 'react-hot-toast'
import OrderDetail from './pages/OrderDetail'
import Admin from './pages/Admin'
import Purchases from './pages/Purchases'
import Reservation from './pages/Reservation'
import AdminReservations from './pages/AdminReservations'
import Models3D from './pages/Models3D'
import Models3DCheckout from './pages/Models3DCheckout'
import Books from './pages/Books'
import BooksCheckout from './pages/BooksCheckout'
import Courses from './pages/Courses'
import CoursesCheckout from './pages/CoursesCheckout'
import AdminDashboard from './pages/AdminDashboard'
import AdminModels3D from './pages/AdminModels3D'
import AdminBooks from './pages/AdminBooks'
import AdminCourses from './pages/AdminCourses'
import AdminUnityModels from './pages/AdminUnityModels'
import AdminIdiomas from './pages/AdminIdiomas'
import Profile from './pages/Profile'
import Help from './pages/Help'

function RequireAuth({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/auth" replace />
}

createRoot(document.getElementById('root')).render(
  <>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order/:id" element={<RequireAuth><Order /></RequireAuth>} />
          <Route path="/order/:ordId" element={<OrderDetail />} />
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
    </BrowserRouter>
    <Toaster position="top-right" />
  </>
)
