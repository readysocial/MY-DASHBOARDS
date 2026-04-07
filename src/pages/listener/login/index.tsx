import { useRouter } from 'next/router';
import ListenerLogin from '@/components/listener/ListenerLogin';
import { Card } from '@/components/ui/card';

export default function ListenerLoginPage() {
  const router = useRouter();

  // The session helpers redirect here with ?reason=expired (a 401 was hit on
  // an authenticated request) or ?reason=invalid (the local session was missing
  // or corrupted). A bare visit has no reason and shows no banner.
  const reason = typeof router.query.reason === 'string' ? router.query.reason : null;
  const banner =
    reason === 'expired'
      ? 'Your session has expired. Please sign in again.'
      : reason === 'invalid'
        ? 'Your session is invalid. Please sign in again.'
        : null;

  const handleLoginSuccess = () => {
    router.push('/listener/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="p-8">
          {banner && (
            <div className="mb-4 p-3 rounded-md border border-amber-300 bg-amber-50 text-amber-800 text-sm">
              {banner}
            </div>
          )}
          <ListenerLogin onSuccess={handleLoginSuccess} />
        </Card>
      </div>
    </div>
  );
}
