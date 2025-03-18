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
      success: 'bg-green-100 text-green-700 border-green-400',
      error: 'bg-red-100 text-red-700 border-red-400',
    };

    return (
      <div className={`p-4 rounded-md border ${type ? alertClasses[type] : ''} mb-4`}>
        {text}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-gray-600 mt-2">Please sign in to your account</p>
      </div>
      
      <Alert type={alert.type} text={alert.text} />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="text-gray-900 placeholder:text-gray-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="text-gray-900 placeholder:text-gray-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-sm text-center text-gray-600">
        <p>Having trouble signing in? Contact your system administrator</p>
      </div>
    </div>
  );
}