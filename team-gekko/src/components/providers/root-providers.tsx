'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <QueryProvider>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: 'glass !rounded-2xl',
              },
            }}
          />
        </QueryProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
