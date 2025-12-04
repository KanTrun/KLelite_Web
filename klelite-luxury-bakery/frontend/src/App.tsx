import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { store } from '@/store';
import AppRoutes from '@/routes';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import '@/styles/global.scss';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Layout wrapper to conditionally show Header/Footer
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isManagerPage = location.pathname.startsWith('/manager');
  const isBackendPage = isAdminPage || isManagerPage;

  // Admin/Manager pages have their own layout - no header/footer
  if (isBackendPage) {
    return <>{children}</>;
  }

  // Normal pages with header and footer
  return (
    <div className="app">
      <Header />
      <main>
        {children}
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <BrowserRouter>
          <AppLayout>
            <AppRoutes />
          </AppLayout>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#28a745',
                },
              },
              error: {
                style: {
                  background: '#dc3545',
                },
              },
            }}
          />
        </BrowserRouter>
      </Provider>
    </GoogleOAuthProvider>
  );
};

export default App;
