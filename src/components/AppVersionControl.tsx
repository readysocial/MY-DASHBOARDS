import React, { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { getAuthHeaders, handleUnauthorized, validateToken } from '../utils/api';
import { API_URL } from '@/config/api';

const AppVersionControl: React.FC = () => {
  useEffect(() => {
    validateToken();
  }, []);

  const [androidVersion, setAndroidVersion] = useState('');
  const [iosVersion, setIosVersion] = useState('');
  const [androidInput, setAndroidInput] = useState('');
  const [iosInput, setIosInput] = useState('');
  const [androidLoading, setAndroidLoading] = useState(false);
  const [iosLoading, setIosLoading] = useState(false);

  const [alert, setAlert] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: '' }), 5000);
  };

  useEffect(() => {
    const fetchVersions = async () => {
      if (!validateToken()) return;
      try {
        const response = await fetch(`${API_URL}/admin/minimum-app-version`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (response.status === 401) {
          return handleUnauthorized(response);
        }

        if (!response.ok) return;

        const data = await response.json();
        setAndroidVersion(data.android);
        setIosVersion(data.ios);
        setAndroidInput(data.android);
        setIosInput(data.ios);
      } catch {
        // silently fail — form inputs remain empty
      }
    };

    fetchVersions();
  }, []);

  const isValidVersion = (v: string) =>
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(v);

  const handleSave = async (platform: 'android' | 'ios') => {
    if (!validateToken()) return;

    const version = platform === 'android' ? androidInput : iosInput;
    const setLoading = platform === 'android' ? setAndroidLoading : setIosLoading;

    if (!isValidVersion(version)) {
      showAlert('error', 'Invalid version format. Use x.y.z (e.g., 1.2.0)');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/minimum-app-version`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ version, platform }),
      });

      if (response.status === 401) {
        return handleUnauthorized(response);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update version');
      }

      if (platform === 'android') setAndroidVersion(version);
      else setIosVersion(version);

      showAlert('success', `${platform === 'android' ? 'Android' : 'iOS'} minimum version updated to ${version}`);
    } catch (err) {
      showAlert('error', err instanceof Error ? err.message : 'Failed to update version');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">App Version Control</h2>
      </div>

      {alert.type && (
        <div className={`mb-6 p-4 rounded-md ${
          alert.type === 'success'
            ? 'bg-green-100 text-green-700 border border-green-400'
            : 'bg-red-100 text-red-700 border border-red-400'
        }`}>
          {alert.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Android Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center space-x-3 p-4">
            <Smartphone className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-800">Android</span>
            {androidVersion && (
              <span className="text-sm text-gray-500">
                Current: <span className="font-mono font-semibold">{androidVersion}</span>
              </span>
            )}
          </div>
          <div className="p-4 border-t border-gray-200 space-y-4">
            <p className="text-sm text-gray-600">
              Users on Android versions below this will be required to update before using the app.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Version
              </label>
              <Input
                value={androidInput}
                onChange={(e) => setAndroidInput(e.target.value)}
                placeholder="e.g. 1.2.0"
                className="bg-white border-gray-300 text-gray-900 font-mono"
              />
            </div>
            <Button
              onClick={() => handleSave('android')}
              disabled={androidLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {androidLoading ? 'Saving...' : 'Save Android Version'}
            </Button>
          </div>
        </div>

        {/* iOS Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center space-x-3 p-4">
            <Smartphone className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-800">iOS</span>
            {iosVersion && (
              <span className="text-sm text-gray-500">
                Current: <span className="font-mono font-semibold">{iosVersion}</span>
              </span>
            )}
          </div>
          <div className="p-4 border-t border-gray-200 space-y-4">
            <p className="text-sm text-gray-600">
              Users on iOS versions below this will be required to update before using the app.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Version
              </label>
              <Input
                value={iosInput}
                onChange={(e) => setIosInput(e.target.value)}
                placeholder="e.g. 1.2.0"
                className="bg-white border-gray-300 text-gray-900 font-mono"
              />
            </div>
            <Button
              onClick={() => handleSave('ios')}
              disabled={iosLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {iosLoading ? 'Saving...' : 'Save iOS Version'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppVersionControl;
