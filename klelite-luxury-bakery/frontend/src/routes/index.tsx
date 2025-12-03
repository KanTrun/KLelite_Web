import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Loading } from '@/components/common/Loading';
import PrivateRoute from './PrivateRoute';
import AdminRoute from './AdminRoute';
import ManagerRoute from './ManagerRoute';

// Lazy load pages
const Home = lazy(() => import('@/pages/Home'));
const ProductList = lazy(() => import('@/pages/Products/ProductList'));
const ProductDetail = lazy(() => import('@/pages/Products/ProductDetail'));
const Cart = lazy(() => import('@/pages/Cart'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const Login = lazy(() => import('@/pages/Auth/Login'));
const Register = lazy(() => import('@/pages/Auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/Auth/ForgotPassword'));
const Profile = lazy(() => import('@/pages/Profile'));
const Orders = lazy(() => import('@/pages/Orders'));
const Wishlist = lazy(() => import('@/pages/Wishlist'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const PaymentCallback = lazy(() => import('@/pages/Payment/PaymentCallback'));

// Admin pages
const AdminDashboard = lazy(() => import('@/pages/Admin/Dashboard'));
const AdminProducts = lazy(() => import('@/pages/Admin/Products'));
const AdminOrders = lazy(() => import('@/pages/Admin/Orders'));
const AdminUsers = lazy(() => import('@/pages/Admin/Users'));
const AdminCategories = lazy(() => import('@/pages/Admin/Categories'));

// Manager pages
const ManagerDashboard = lazy(() => import('@/pages/Manager'));

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<Loading fullScreen text="Đang tải..." />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />
        
        {/* Protected Routes */}
        <Route path="/checkout" element={
          <PrivateRoute>
            <Checkout />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/orders" element={
          <PrivateRoute>
            <Orders />
          </PrivateRoute>
        } />
        <Route path="/wishlist" element={
          <PrivateRoute>
            <Wishlist />
          </PrivateRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/products" element={
          <AdminRoute>
            <AdminProducts />
          </AdminRoute>
        } />
        <Route path="/admin/orders" element={
          <AdminRoute>
            <AdminOrders />
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        } />
        <Route path="/admin/categories" element={
          <AdminRoute>
            <AdminCategories />
          </AdminRoute>
        } />
        
        {/* Manager Routes */}
        <Route path="/manager" element={
          <ManagerRoute>
            <ManagerDashboard />
          </ManagerRoute>
        } />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
