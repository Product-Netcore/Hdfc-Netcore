import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  Clock, 
  MessageSquare, 
  Phone, 
  Plus, 
  Trash2, 
  CheckCircle,
  ExternalLink,
  Settings
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

interface ConnectedNumber {
  id: string;
  phoneNumber: string;
  displayName: string;
  status: 'active' | 'pending' | 'inactive';
  addedAt: string;
}

const AddNumberCard: React.FC<{
  connectedNumbers: ConnectedNumber[];
  onNumberAdded: (number: ConnectedNumber) => void;
  onNumberRemoved: (numberId: string) => void;
}> = ({ connectedNumbers, onNumberAdded, onNumberRemoved }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleAddNumber = () => {
    setIsConnecting(true);
    
    // Facebook WABA OAuth parameters
    const facebookParams = new URLSearchParams({
      client_id: 'YOUR_FACEBOOK_APP_ID', // Placeholder
      redirect_uri: `${window.location.origin}/fb-callback`,
      scope: 'whatsapp_business_management,whatsapp_business_messaging,business_management',
      response_type: 'code',
      state: 'waba_connection'
    });

    const facebookUrl = `https://www.facebook.com/dialog/oauth?${facebookParams.toString()}`;
    
    // Open Facebook WABA popup
    const popup = window.open(
      facebookUrl,
      'facebook-waba-auth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    // Listen for popup messages
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'WABA_AUTH_SUCCESS') {
        const { access_token, phone_number, display_name } = event.data;
        
        // Simulate API call to save the number
        handleNumberAdded(phone_number, access_token, display_name);
        
        popup?.close();
        setIsConnecting(false);
        window.removeEventListener('message', handleMessage);
      } else if (event.data.type === 'WABA_AUTH_ERROR') {
        console.error('WABA Auth Error:', event.data.error);
        popup?.close();
        setIsConnecting(false);
        window.removeEventListener('message', handleMessage);
      }
    };

    window.addEventListener('message', handleMessage);

    // Check if popup was closed manually
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        setIsConnecting(false);
        window.removeEventListener('message', handleMessage);
      }
    }, 1000);
  };

  const handleNumberAdded = (phoneNumber: string, accessToken: string, displayName?: string) => {
    console.log('Adding number:', { phoneNumber, accessToken, displayName });
    
    // Simulate API call
    const newNumber: ConnectedNumber = {
      id: `waba_${Date.now()}`,
      phoneNumber,
      displayName: displayName || phoneNumber,
      status: 'active',
      addedAt: new Date().toISOString()
    };

    onNumberAdded(newNumber);
    
    // Simulate success notification
    console.log('Number added successfully:', newNumber);
  };

  const handleRemoveNumber = (numberId: string) => {
    console.log('Removing number:', numberId);
    onNumberRemoved(numberId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Phone className="w-5 h-5 text-primary" />
          <CardTitle>Add Number</CardTitle>
        </div>
        <CardDescription>
          Link your WhatsApp Business Account (WABA) number to this platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Number Button */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Connect WhatsApp Business Number</p>
            <p className="text-xs text-muted-foreground">
              Authorize access to your WhatsApp Business Account
            </p>
          </div>
          <Button 
            onClick={handleAddNumber} 
            disabled={isConnecting}
            className="flex items-center space-x-2"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Number</span>
              </>
            )}
          </Button>
        </div>

        {/* Connected Numbers List */}
        {connectedNumbers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Connected Numbers</h4>
              <Badge variant="secondary">{connectedNumbers.length} connected</Badge>
            </div>
            
            <div className="space-y-2">
              {connectedNumbers.map((number) => (
                <div
                  key={number.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">{number.displayName}</p>
                        <p className="text-xs text-muted-foreground">{number.phoneNumber}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={number.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {number.status}
                    </Badge>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveNumber(number.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Alert */}
        <Alert>
          <ExternalLink className="h-4 w-4" />
          <AlertDescription>
            You'll be redirected to Facebook to authorize access to your WhatsApp Business Account. 
            Make sure you have admin access to the WABA you want to connect.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

const AccountSettingsPage: React.FC = () => {
  const [linkTrackingEnabled, setLinkTrackingEnabled] = useState(true);
  const [marketingApiEnabled, setMarketingApiEnabled] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Kolkata');
  const [connectedNumbers, setConnectedNumbers] = useState<ConnectedNumber[]>([]);

  const handleNumberAdded = (number: ConnectedNumber) => {
    setConnectedNumbers(prev => [...prev, number]);
  };

  const handleNumberRemoved = (numberId: string) => {
    setConnectedNumbers(prev => prev.filter(n => n.id !== numberId));
  };

  const timezones = [
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
    { value: 'America/New_York', label: 'America/New_York (EST)' },
    { value: 'Europe/London', label: 'Europe/London (GMT)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
  ];

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground">
              Manage your account preferences and integrations
            </p>
          </div>
        </div>

        {/* Settings Cards - Vertical Stack */}
        <div className="flex flex-col space-y-6">
          {/* Link Tracking Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-primary" />
                <CardTitle>Link Tracking</CardTitle>
              </div>
              <CardDescription>
                Track clicks and engagement on your campaign links
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enable Link Tracking</p>
                  <p className="text-xs text-muted-foreground">
                    Automatically track link clicks in your campaigns
                  </p>
                </div>
                <Switch
                  checked={linkTrackingEnabled}
                  onCheckedChange={setLinkTrackingEnabled}
                />
              </div>
              
              {linkTrackingEnabled && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium mb-1">Tracking Domain</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Links will be shortened using this domain
                  </p>
                  <Badge variant="outline">track.netcore.co.in</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timezone Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <CardTitle>Your Timezone</CardTitle>
              </div>
              <CardDescription>
                Set your preferred timezone for scheduling campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Current Timezone</p>
                <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Current time: {new Date().toLocaleString('en-US', { 
                    timeZone: selectedTimezone,
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Marketing Messages Lite API Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <CardTitle>Marketing Messages Lite API</CardTitle>
              </div>
              <CardDescription>
                Enable API access for marketing message automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enable API Access</p>
                  <p className="text-xs text-muted-foreground">
                    Allow external systems to send marketing messages
                  </p>
                </div>
                <Switch
                  checked={marketingApiEnabled}
                  onCheckedChange={setMarketingApiEnabled}
                />
              </div>
              
              {marketingApiEnabled && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium mb-1">API Endpoint</p>
                    <code className="text-xs bg-background px-2 py-1 rounded border">
                      https://api.netcore.co.in/v1/marketing/lite
                    </code>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View API Documentation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Number Card */}
          <AddNumberCard
            connectedNumbers={connectedNumbers}
            onNumberAdded={handleNumberAdded}
            onNumberRemoved={handleNumberRemoved}
          />
        </div>

        {/* Additional Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>
              Additional configuration options for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Account ID</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  acc_hdfc_netcore_2025
                </code>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">API Version</p>
                <Badge variant="outline">v2.1</Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Data Retention</p>
                <p className="text-xs text-muted-foreground">90 days</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Rate Limits</p>
                <p className="text-xs text-muted-foreground">1000 req/min</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default AccountSettingsPage;
