import React, { useEffect } from 'react';
import { getRegistrationData } from '@/api/listener/registration/api';
import { RegistrationPrefilledData } from '@/api/listener/registration/types';
import { Loader2 } from 'lucide-react';

interface TokenValidatorProps {
  token: string;
  onValidToken: (data: RegistrationPrefilledData) => void;
  onInvalidToken: (error: string) => void;
}

export const TokenValidator: React.FC<TokenValidatorProps> = ({
  token,
  onValidToken,
  onInvalidToken,
}) => {
  useEffect(() => {
    try {
      const data = getRegistrationData(token);
      
      // Check if token is expired
      if (data.expiresAt < Date.now()) {
        onInvalidToken('Registration link has expired');
        return;
      }
      
      onValidToken(data);
    } catch (error) {
      onInvalidToken('Invalid registration link');
    }
  }, [token, onValidToken, onInvalidToken]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[150px] sm:min-h-[200px] p-4 sm:p-8">
      <div className="animate-spin mb-3 sm:mb-4">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
      </div>
      <p className="text-sm sm:text-base text-gray-700 text-center font-medium">
        Validating your registration link...
      </p>
      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500 text-center">
        This will only take a moment
      </p>
    </div>
  );
}; 