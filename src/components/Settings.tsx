import React, { useEffect, useState } from 'react';
import { Lock, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { getAuthHeaders, handleUnauthorized, validateToken } from '../utils/api';
import { API_URL } from '@/config/api';
import { confirm } from '@/lib/confirm';

const Settings: React.FC = () => {
  useEffect(() => {
    validateToken();
  }, []);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('security');
  const [loading, setLoading] = useState(false);
  
  // Add password visibility states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordFormData, setPasswordFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [alert, setAlert] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert({ type: null, message: '' });
    }, 5000);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateToken()) return;

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      showAlert('error', 'New passwords do not match');
      return;
    }

    if (passwordFormData.newPassword.length < 6) {
      showAlert('error', 'New password must be at least 6 characters long');
      return;
    }

    if (!passwordFormData.oldPassword) {
      showAlert('error', 'Please enter your current password');
      return;
    }

    const confirmed = await confirm({
      title: 'Change Password',
      description: 'Are you sure you want to change your admin password?',
      confirmText: 'Change Password',
    });
    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/change-password`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          oldPassword: passwordFormData.oldPassword,
          newPassword: passwordFormData.newPassword
        }),
      });

      if (response.status === 401) {
        return handleUnauthorized(response);
      }
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      showAlert('success', 'Password changed successfully');
      setShowChangePassword(false);
      setPasswordFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      // Reset password visibility states
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      showAlert('error', err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Security Settings</h2>
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

      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
            onClick={() => toggleSection('security')}
          >
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-800">Password Security</span>
            </div>
            {expandedSection === 'security' ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {expandedSection === 'security' && (
            <div className="p-4 border-t border-gray-200">
              <div className="max-w-md mx-auto">
                <p className="text-sm text-gray-600 mb-4">
                  It's recommended to use a strong password that you don't use for other accounts.
                  Your password should be at least 6 characters long and include a mix of letters,
                  numbers, and symbols.
                </p>

                {showChangePassword ? (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showOldPassword ? "text" : "password"}
                          value={passwordFormData.oldPassword}
                          onChange={(e) => setPasswordFormData({ 
                            ...passwordFormData, 
                            oldPassword: e.target.value 
                          })}
                          placeholder="Enter your current password"
                          className="bg-white border-gray-300 text-gray-900 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showOldPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordFormData.newPassword}
                          onChange={(e) => setPasswordFormData({ 
                            ...passwordFormData, 
                            newPassword: e.target.value 
                          })}
                          placeholder="Enter new password"
                          className="bg-white border-gray-300 text-gray-900 pr-10"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordFormData.confirmPassword}
                          onChange={(e) => setPasswordFormData({ 
                            ...passwordFormData, 
                            confirmPassword: e.target.value 
                          })}
                          placeholder="Confirm new password"
                          className="bg-white border-gray-300 text-gray-900 pr-10"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        {loading ? 'Changing...' : 'Change Password'}
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => {
                          setShowChangePassword(false);
                          setPasswordFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                          setShowOldPassword(false);
                          setShowNewPassword(false);
                          setShowConfirmPassword(false);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    onClick={() => setShowChangePassword(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    Change Password
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;