import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Loading } from '@/components/common/Loading';
import { pageVariants } from '@/utils/animations';
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
const OrderDetail = lazy(() => import('@/pages/Orders/OrderDetail'));
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

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="page-wrapper"
  >
    {children}
  </motion.div>
);

const AppRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<Loading fullScreen text="Đang tải..." />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/products" element={<PageWrapper><ProductList /></PageWrapper>} />
          <Route path="/products/:slug" element={<PageWrapper><ProductDetail /></PageWrapper>} />
          <Route path="/cart" element={<PageWrapper><Cart /></PageWrapper>} />
          <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
          <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />

          {/* Auth Routes */}
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
          <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
          <Route path="/payment/callback" element={<PageWrapper><PaymentCallback /></PageWrapper>} />

          {/* Protected Routes */}
          <Route path="/checkout" element={
            <PrivateRoute>
              <PageWrapper><Checkout /></PageWrapper>
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <PageWrapper><Profile /></PageWrapper>
            </PrivateRoute>
          } />
          <Route path="/orders" element={
            <PrivateRoute>
              <PageWrapper><Orders /></PageWrapper>
            </PrivateRoute>
          } />
          <Route path="/orders/:id" element={
            <PrivateRoute>
              <PageWrapper><OrderDetail /></PageWrapper>
            </PrivateRoute>
          } />
          <Route path="/wishlist" element={
            <PrivateRoute>
              <PageWrapper><Wishlist /></PageWrapper>
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
          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};


export default AppRoutes;
