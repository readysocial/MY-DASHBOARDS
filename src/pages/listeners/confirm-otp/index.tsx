import { useState } from 'react';
import { useRouter } from 'next/router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { confirmOtp } from '@/api/listener/confirmotp/api';

export default function ConfirmOtpPage() {
  const router = useRouter();
  const { email: queryEmail } = router.query;
  const [email, setEmail] = useState((queryEmail as string) || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await confirmOtp({ email, otp });
      setMessage({
        type: 'success',
        text: 'OTP confirmed! Redirecting to password reset...'
      });
      // Redirect to password reset page with the token
      router.push(`/listeners/reset-password?token=${response.token}`);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to confirm OTP'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Confirm OTP</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Enter the OTP sent to your email to reset your password
          </p>
        </CardHeader>
        <CardContent>
          {message && (
            <div className={`mb-4 p-3 rounded-md text-sm ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-sm"
                required
                disabled={!!queryEmail} // Disable if email is pre-filled from query
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                One-Time Password (OTP)
              </label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="text-sm"
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? 'Confirming OTP...' : 'Confirm OTP'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link 
              href="/listener/login" 
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 