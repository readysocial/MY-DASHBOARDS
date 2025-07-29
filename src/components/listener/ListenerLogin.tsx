import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { loginListener } from '@/api/listener/login/api';
import Link from 'next/link';

interface ListenerLoginProps {
  onSuccess: () => void;
}

type AlertType = 'success' | 'error' | null;

interface AlertMessage {
  type: AlertType;
  text: string;
}

export default function ListenerLogin({ onSuccess }: ListenerLoginProps) {
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
      const response = await loginListener(formData);
      localStorage.setItem('listenerToken', response.token);
      localStorage.setItem('listenerData', JSON.stringify(response.listener));
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
    <div className="space-y-4 sm:space-y-6 w-full max-w-md mx-auto px-4 sm:px-0">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome Back, Listener</h2>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Please sign in to your listener account</p>
      </div>
      
      <Alert type={alert.type} text={alert.text} />
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-1 sm:space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="text-sm sm:text-base text-gray-900 placeholder:text-gray-500"
              required
            />
          </div>
          
          <div className="space-y-1 sm:space-y-2">
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
                className="text-sm sm:text-base text-gray-900 placeholder:text-gray-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 sm:py-2.5 text-sm sm:text-base"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-xs sm:text-sm text-center text-gray-600 space-y-1">
        <p>
          <Link 
            href="/listeners/forgot-password" 
            className="text-purple-600 hover:text-purple-800 font-medium"
          >
            Forgot your password?
          </Link>
        </p>
        <p>Having trouble signing in? Contact your administrator</p>
      </div>
    </div>
  );
}