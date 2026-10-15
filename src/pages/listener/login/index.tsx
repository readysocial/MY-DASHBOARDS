import { useRouter } from 'next/router';
import ListenerLogin from '@/components/listener/ListenerLogin';
import { Card } from '@/components/ui/card';
import { InlineAlert } from '@/components/ui/inline-alert';

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
    <div className="flex min-h-screen items-center justify-center bg-rs-page px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card className="p-8">
          <div className="space-y-6">
            {banner && (
              <InlineAlert variant="info">{banner}</InlineAlert>
            )}
            <ListenerLogin onSuccess={handleLoginSuccess} />
          </div>
        </Card>
      </div>
    </div>
  );
}
