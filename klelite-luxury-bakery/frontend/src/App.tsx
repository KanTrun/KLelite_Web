import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { store } from '@/store';
import { ThemeProvider } from '@/contexts';
import AppRoutes from '@/routes';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import ChatWidget from '@/components/Chat/ChatWidget';
import { SkipLink } from '@/components/common/SkipLink/SkipLink';
import { AriaLiveRegion } from '@/components/common/AriaLiveRegion/AriaLiveRegion';
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
      <SkipLink />
      <AriaLiveRegion />
      <Header />
      <main id="main-content">
        {children}
      </main>
      <ChatWidget />
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <ThemeProvider>
          <BrowserRouter>
            <AppLayout>
              <AppRoutes />
            </AppLayout>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                },
                success: {
                  style: {
                    background: '#28a745',
                    color: '#fff',
                  },
                },
                error: {
                  style: {
                    background: '#dc3545',
                    color: '#fff',
                  },
                },
              }}
            />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    </GoogleOAuthProvider>
  );
};

export default App;
