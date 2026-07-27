import { Suspense } from 'react';
import '@/styles/globals.css';
import { AuthContextProvider } from '@/context/AuthContext';
import { AlertProvider } from '@/context/AlertContext';
import PageTransitionLoader from '@/components/common/PageTransitionLoader';

export const metadata = {
  title: 'School Management System | Premium Enterprise Portal',
  description: 'Multi-tenant comprehensive school management platform with role-based access control.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthContextProvider>
          <AlertProvider>
            <Suspense fallback={null}>
              <PageTransitionLoader />
            </Suspense>
            {children}
          </AlertProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
}

