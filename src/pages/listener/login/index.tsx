import { useRouter } from 'next/router';
import ListenerLogin from '@/components/listener/ListenerLogin';
import { Card } from '@/components/ui/card';

export default function ListenerLoginPage() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push('/listener/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="p-8">
          <ListenerLogin onSuccess={handleLoginSuccess} />
        </Card>
      </div>
    </div>
  );
} 