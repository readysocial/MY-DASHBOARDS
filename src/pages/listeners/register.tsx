import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { TokenValidator } from '@/components/registration/TokenValidator';
import { RegistrationForm } from '@/components/registration/RegistrationForm';
import { registerListener } from '@/api/listener/registration/api';
import type { 
  ListenerRegistrationRequest, 
  RegistrationPrefilledData 
} from '@/api/listener/registration/types';

const ListenerRegistrationPage: React.FC = () => {
  const router = useRouter();
  const { token } = router.query;

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prefilledData, setPrefilledData] = useState<RegistrationPrefilledData | null>(null);

  const handleValidToken = (data: RegistrationPrefilledData) => {
    setPrefilledData(data);
    setError(null);
  };

  const handleInvalidToken = (errorMessage: string) => {
    setError(errorMessage);
    setPrefilledData(null);
  };

  const handleSubmit = async (data: ListenerRegistrationRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await registerListener(data);
      
      setSuccess(true);
      
      // Redirect to listener dashboard after 3 seconds
      setTimeout(() => {
        router.push('/listener/dashboard');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle className="h-6 w-6 md:h-7 md:w-7 mr-2 flex-shrink-0" />
            <h2 className="text-lg md:text-xl font-medium">Invalid Registration Link</h2>
          </div>
          <p className="text-base md:text-lg text-gray-600">
            The registration link appears to be invalid. Please check your email for the correct link
            or contact support for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Complete Your Registration
          </h1>
          <p className="mt-2 text-base md:text-lg text-gray-600">
            Set up your listener account and availability schedule
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          {error ? (
            <div className="p-6 md:p-8">
              <div className="flex items-center text-red-600 mb-4">
                <AlertCircle className="h-6 w-6 md:h-7 md:w-7 mr-2 flex-shrink-0" />
                <h2 className="text-lg md:text-xl font-medium">Registration Error</h2>
              </div>
              <p className="text-base md:text-lg text-gray-600">{error}</p>
            </div>
          ) : success ? (
            <div className="p-6 md:p-8">
              <div className="flex items-center text-green-600 mb-4">
                <CheckCircle className="h-6 w-6 md:h-7 md:w-7 mr-2 flex-shrink-0" />
                <h2 className="text-lg md:text-xl font-medium">Registration Successful!</h2>
              </div>
              <p className="text-base md:text-lg text-gray-600">
                Your account has been created successfully. You will be redirected to your dashboard shortly...
              </p>
            </div>
          ) : (
            <div className="p-6 md:p-8">
              {!prefilledData ? (
                <TokenValidator
                  token={token as string}
                  onValidToken={handleValidToken}
                  onInvalidToken={handleInvalidToken}
                />
              ) : (
                <RegistrationForm
                  prefilledData={prefilledData}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm md:text-base text-gray-500">
            Need help? Contact support at{' '}
            <a 
              href="mailto:support@example.com" 
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ListenerRegistrationPage; 