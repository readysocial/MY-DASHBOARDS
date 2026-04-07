import { useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Link from 'next/link';

interface AuthComponentProps {
  onSuccess: () => void;
}

const Login = dynamic<AuthComponentProps>(() => 
  import('@/components/auth/Login').then(mod => mod.default)
, { ssr: false });

export default function Auth() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const handleSuccess = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <Login onSuccess={handleSuccess} />
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Are you a listener?{' '}
              <Link href="/listener/login" className="text-purple-600 hover:text-purple-700 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}