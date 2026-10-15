import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { InlineAlert } from '../ui/inline-alert';
import { Eye, EyeOff } from 'lucide-react';
import { loginListener } from '@/api/listener/login/api';
import Link from 'next/link';

interface ListenerLoginProps {
  onSuccess: () => void;
}

export default function ListenerLogin({ onSuccess }: ListenerLoginProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await loginListener(formData);
      localStorage.setItem('listenerToken', response.token);
      localStorage.setItem('listenerData', JSON.stringify(response.listener));
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span
          className="mx-auto flex h-9 w-9 items-center justify-center rounded-md bg-rs-primary text-sm font-semibold text-white"
          aria-hidden
        >
          R
        </span>
        <h2 className="mt-3 text-xl font-semibold text-rs-text">Ready Social</h2>
        <p className="mt-1 text-sm text-rs-text-muted">Sign in to the listener portal</p>
      </div>

      {error ? (
        <InlineAlert variant="error" onDismiss={() => setError(null)}>
          {error}
        </InlineAlert>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-rs-text-secondary">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="autofill:shadow-[inset_0_0_0_1000px_var(--rs-surface)] autofill:text-rs-text"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-rs-text-secondary">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pr-10 autofill:shadow-[inset_0_0_0_1000px_var(--rs-surface)] autofill:text-rs-text"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-rs-text-muted hover:text-rs-text"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="space-y-1 text-center text-sm">
        <p>
          <Link
            href="/listeners/send-otp"
            className="font-medium text-rs-blue hover:underline"
          >
            Forgot your password?
          </Link>
        </p>
        <p className="text-xs text-rs-text-muted">Having trouble signing in? Contact your administrator</p>
      </div>
    </div>
  );
}
