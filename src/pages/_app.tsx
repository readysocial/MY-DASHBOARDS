import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
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
    </>
  );
}