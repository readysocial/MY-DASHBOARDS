import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { API_URL } from '@/config/api';

interface LoginProps {
  onSuccess: () => void;
}

type AlertType = 'success' | 'error' | null;

interface AlertMessage {
  type: AlertType;
  text: string;
}

export default function Login({ onSuccess }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState<AlertMessage>({ type: null, text: '' });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const showAlert = (type: AlertType, text: string) => {
    setAlert({ type, text });
    setTimeout(() => {
      setAlert({ type: null, text: '' });
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ type: null, text: '' });

    try {
      const response = await fetch(`${API_URL}/admin/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('adminToken', data.accessToken);
      localStorage.setItem('adminEmail', formData.email);
      showAlert('success', 'Login successful!');
      onSuccess();
    } catch (err) {
      showAlert('error', err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const Alert = ({ type, text }: { type: AlertType; text: string }) => {
    if (!type || !text) return null;

    const alertClasses = {
      success: 'bg-transparent text-rs-success border-rs-border',
      error: 'bg-rs-primary-tint text-rs-text border-rs-border',
    };

    return (
      <div className={`p-4 rounded-md border text-sm ${type ? alertClasses[type] : ''} mb-4`}>
        {text}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-rs-text">Ready Social</h2>
        <p className="text-sm text-rs-text-muted mt-2">Sign in to the admin dashboard</p>
      </div>
      
      <Alert type={alert.type} text={alert.text} />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-rs-text-secondary">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-rs-text-muted hover:text-rs-text"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-xs text-center text-rs-text-muted">
        <p>Having trouble signing in? Contact your system administrator</p>
      </div>
    </div>
  );
}