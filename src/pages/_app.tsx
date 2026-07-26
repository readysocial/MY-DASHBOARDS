import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function App({ Component, pageProps }: AppProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <>
      <Component {...pageProps} />
      <ConfirmDialog />
      <Toaster
        position="bottom-right"
        closeButton
        theme="light"
        toastOptions={{
          classNames: {
            toast:
              'group border border-rs-border bg-rs-surface text-rs-text shadow-md',
            title: 'text-sm font-medium text-rs-text',
            description: 'text-sm text-rs-text-secondary',
            success: 'border-rs-border',
            error:
              'border-rs-primary/20 bg-rs-primary-tint text-rs-text',
            info: 'border-rs-border',
            closeButton:
              'border-rs-border bg-rs-surface text-rs-text-muted hover:bg-rs-page hover:text-rs-text',
          },
        }}
        style={{ zIndex: 2100 }}
      />
    </>
  );
}
