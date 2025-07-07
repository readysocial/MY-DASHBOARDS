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
    <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
      <div className="animate-spin mb-4">
        <Loader2 className="h-8 w-8 md:h-10 md:w-10 text-purple-600" />
      </div>
      <p className="text-base md:text-lg text-gray-700 text-center font-medium">
        Validating your registration link...
      </p>
      <p className="mt-2 text-sm md:text-base text-gray-500 text-center">
        This will only take a moment
      </p>
    </div>
  );
}; 