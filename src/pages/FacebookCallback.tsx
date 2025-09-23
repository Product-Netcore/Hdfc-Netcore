import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const FacebookCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`Facebook Auth Error: ${error}`);
        }

        if (!code || state !== 'waba_connection') {
          throw new Error('Invalid callback parameters');
        }

        // Simulate API call to exchange code for access token
        console.log('Exchanging code for access token:', code);
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate successful response
        const mockResponse = {
          access_token: `mock_token_${Date.now()}`,
          phone_number: '+1234567890',
          display_name: 'Business WhatsApp',
          waba_id: 'waba_123456789'
        };

        setPhoneNumber(mockResponse.phone_number);
        setStatus('success');
        setMessage('WhatsApp Business Account connected successfully!');

        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'WABA_AUTH_SUCCESS',
            access_token: mockResponse.access_token,
            phone_number: mockResponse.phone_number,
            display_name: mockResponse.display_name,
            waba_id: mockResponse.waba_id
          }, window.location.origin);
        }

      } catch (error) {
        console.error('Facebook callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An unknown error occurred');

        // Send error message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'WABA_AUTH_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          }, window.location.origin);
        }
      }
    };

    handleCallback();
  }, []);

  const handleClose = () => {
    if (window.opener) {
      window.close();
    } else {
      // If not in popup, redirect to account settings
      window.location.href = '/settings/account';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            <span>
              {status === 'loading' && 'Connecting...'}
              {status === 'success' && 'Success!'}
              {status === 'error' && 'Error'}
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className={
            status === 'success' ? 'border-green-200 bg-green-50' :
            status === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }>
            <AlertDescription className={
              status === 'success' ? 'text-green-700' :
              status === 'error' ? 'text-red-700' :
              'text-blue-700'
            }>
              {status === 'loading' && 'Processing your WhatsApp Business Account connection...'}
              {status === 'success' && (
                <div>
                  <p className="font-medium">{message}</p>
                  {phoneNumber && (
                    <p className="text-sm mt-1">Phone Number: {phoneNumber}</p>
                  )}
                </div>
              )}
              {status === 'error' && message}
            </AlertDescription>
          </Alert>

          {status !== 'loading' && (
            <div className="flex justify-center">
              <Button onClick={handleClose}>
                {status === 'success' ? 'Continue' : 'Close'}
              </Button>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Please wait while we connect your WhatsApp Business Account...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FacebookCallback;
