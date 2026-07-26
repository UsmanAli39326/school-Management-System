import '@/styles/globals.css';
import { AuthContextProvider } from '@/context/AuthContext';
import { AlertProvider } from '@/context/AlertContext';

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
            {children}
          </AlertProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
}
