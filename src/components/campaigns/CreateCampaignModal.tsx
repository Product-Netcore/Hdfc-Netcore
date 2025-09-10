import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { 
  ChevronLeft,
  MessageSquare, 
  Search, 
  Mail, 
  MessageCircle, 
  Smartphone, 
  Globe,
  MessageSquareText,
  Monitor,
  Users,
  X,
  Info,
  RefreshCw,
  ChevronDown,
  Check,
  Send,
  Calendar as CalendarIcon,
  Clock,
  Settings,
  Edit,
  ChevronRight,
  Palette,
  Target,
  Zap
} from 'lucide-react';

interface CreateCampaignModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'start' | 'channels' | 'setup' | 'audience' | 'content' | 'schedule' | 'preview';

interface CampaignFormData {
  campaignName: string;
  tags: string[];
  businessNumber: string;
  linkTracking: boolean;
  conversionGoal: boolean;
  eventName: string;
  conversionWindow: number;
  revenueParameter: string;
  deduplication: boolean;
  targetAudience: 'all' | 'segments';
  selectedSegments: string[];
  excludeContacts: boolean;
  selectedTemplate: string;
  scheduleType: 'now' | 'later' | 'optimize';
  startTime: string;
  endTime: string;
  scheduledDate: Date | null;
  scheduledTime: string;
  timezone: string;
  fallbackOption: 'start' | 'end';
  frequencyCap: boolean;
  controlGroup: boolean;
  controlGroupPercentage: number;
  specificTime: string;
  isPublished: boolean;
  // Audience Limit fields
  sendLimit: boolean;
  maxRecipients: number;
  samplingMethod: 'random' | 'priority';
  // Retry Logic fields
  retryEnabled: boolean;
  retryDuration: number;
  stopOnConversion: boolean;
  stopOnManualPause: boolean;
  stopOnTemplateChange: boolean;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Marketing' | 'Promotional' | 'Utility';
  status: 'Active' | 'Paused' | 'Disabled';
}

interface AdobeSegment {
  id: string;
  name: string;
  users: number;
  lastRefreshed: string;
}

const businessNumbers = [
  {
    id: 'netcore',
    name: 'Netcore Solutions Support (+91 2249757637)',
    quality: 'HIGH',
    messagingLimit: '10000 Messaging limit per 24hrs',
    lastUpdated: 'Sep 09, 2025 12:03 PM'
  }
];

const whatsappTemplates: WhatsAppTemplate[] = [
  {
    id: 'static_carousel_recs_url',
    name: 'static_carousel_recs_url',
    description: 'Carousel template for product recommendations',
    category: 'Marketing',
    status: 'Active'
  },
  {
    id: 'welcome_message',
    name: 'welcome_message',
    description: 'Welcome message template',
    category: 'Utility',
    status: 'Active'
  },
  {
    id: 'promotional_offer',
    name: 'promotional_offer', 
    description: 'Promotional offer template',
    category: 'Promotional',
    status: 'Active'
  }
];

const bfsiConversionEvents = [
  'Account Opened (Savings)',
  'Account Opened (Current)', 
  'Credit Card Approved',
  'Credit Card Activated',
  'Loan Application Submitted',
  'Loan Approved',
  'Loan Disbursed',
  'Overdraft Activated',
  'First Transaction (UPI)',
  'First Transaction (QR)',
  'First Transaction (Netbanking)',
  'Bill Payment Completed',
  'Mandate Set Up (eMandate/SIP/Insurance)',
  'Card Spend ₹1,000 Reached',
  'Insurance Purchased (Life)',
  'Insurance Purchased (Health)',
  'Insurance Purchased (General)',
  'Investment Started (FD)',
  'Investment Started (RD)',
  'Investment Started (MF/SIP)',
  'Account Upgrade Accepted',
  'Card Upgrade Accepted'
];

const adobeSegments: AdobeSegment[] = [
  {
    id: '66',
    name: 'Adobe Segment 1',
    users: 295,
    lastRefreshed: '2025-09-09 12:42:05'
  },
  {
    id: '68', 
    name: 'Adobe Segment 2',
    users: 43,
    lastRefreshed: '2025-09-09 12:11:04'
  },
  {
    id: '164',
    name: 'Adobe Segment 3',
    users: 0,
    lastRefreshed: '2025-09-09 01:39:08'
  }
];

// Segments Dropdown Component
const SegmentsDropdown = ({ 
  selectedSegments, 
  onSelectionChange 
}: { 
  selectedSegments: string[];
  onSelectionChange: (segments: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredSegments = useMemo(() => {
    return adobeSegments.filter(segment =>
      segment.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      segment.id.includes(debouncedQuery)
    );
  }, [debouncedQuery]);

  const selectedSegmentsData = useMemo(() => {
    return adobeSegments.filter(segment => selectedSegments.includes(segment.id));
  }, [selectedSegments]);

  const handleToggleSegment = useCallback((segmentId: string) => {
    const newSelection = selectedSegments.includes(segmentId)
      ? selectedSegments.filter(id => id !== segmentId)
      : [...selectedSegments, segmentId];
    onSelectionChange(newSelection);
  }, [selectedSegments, onSelectionChange]);

  const handleSelectAll = useCallback(() => {
    onSelectionChange(filteredSegments.map(s => s.id));
  }, [filteredSegments, onSelectionChange]);

  const handleClearAll = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  const handleRemoveSegment = useCallback((segmentId: string) => {
    onSelectionChange(selectedSegments.filter(id => id !== segmentId));
  }, [selectedSegments, onSelectionChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-[40px] h-auto p-3"
        >
          <div className="flex flex-wrap gap-1 items-center flex-1">
            {selectedSegmentsData.length === 0 ? (
              <span className="text-muted-foreground">List / Segment</span>
            ) : (
              selectedSegmentsData.map((segment) => (
                <Badge
                  key={segment.id}
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 flex items-center space-x-1"
                >
                  <span>{segment.name}</span>
                  <X 
                    className="w-3 h-3 cursor-pointer hover:bg-blue-200 rounded-full" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveSegment(segment.id);
                    }}
                  />
                </Badge>
              ))
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[600px] p-0" align="start">
        <div className="flex flex-col max-h-[400px]">
          {/* Search Input */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search segments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Segments Table */}
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="grid grid-cols-4 gap-4 p-3 bg-muted/30 text-sm font-medium text-muted-foreground border-b sticky top-0">
              <div>Name</div>
              <div>ID No.</div>
              <div>No. of Users</div>
              <div>Last refreshed on</div>
            </div>
            
            {/* Rows */}
            {filteredSegments.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No segments found
              </div>
            ) : (
              filteredSegments.map((segment) => (
                <div 
                  key={segment.id} 
                  className="grid grid-cols-4 gap-4 p-3 border-b hover:bg-muted/20 cursor-pointer"
                  onClick={() => handleToggleSegment(segment.id)}
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedSegments.includes(segment.id)}
                      onChange={() => handleToggleSegment(segment.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm">{segment.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{segment.id}</div>
                  <div className="text-sm text-muted-foreground">{segment.users}</div>
                  <div className="text-sm text-muted-foreground">{segment.lastRefreshed}</div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-3 border-t bg-muted/20">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>List selected: 0</span>
              <span>Segment selected: {selectedSegments.length}</span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredSegments.length === 0}
              >
                Select all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={selectedSegments.length === 0}
              >
                Clear all
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const startOptions = [
  {
    id: 'engage',
    title: 'Engage with users',
    description: 'Create personalized campaigns and user journeys',
    icon: MessageSquare,
  },
  {
    id: 'analyze',
    title: 'Analyze user behaviour',
    description: 'Create funnels, cohorts, and RFM to measure performance',
    icon: Search,
  },
  {
    id: 'template',
    title: 'Create template',
    description: 'Customize reusable templates for your campaigns',
    icon: MessageSquareText,
  },
  {
    id: 'contacts',
    title: 'Manage contacts',
    description: 'Add contacts, import list or create segment',
    icon: Users,
  },
];

// Custom WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.085"/>
  </svg>
);

// Custom Google Messages/RCS icon component
const GoogleMessagesIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="12" r="12" fill="#4285f4"/>
    <path d="M18 7H6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h10l2 2V9c0-1.1-.9-2-2-2zm-2 6H8v-1h8v1zm0-2H8v-1h8v1zm0-2H8V8h8v1z" fill="white"/>
  </svg>
);

const channelOptions = [
  {
    category: 'Journey',
    items: [
      { id: 'journey', name: 'Journey', icon: MessageSquare, color: 'text-blue-600' }
    ]
  },
  {
    category: 'Campaigns',
    items: [
      { id: 'email', name: 'Email', icon: Mail, color: 'text-blue-600' },
      { id: 'sms', name: 'SMS', icon: MessageCircle, color: 'text-purple-600' },
      { id: 'app-push', name: 'App push', icon: Smartphone, color: 'text-purple-600' },
      { id: 'web-push', name: 'Web push', icon: Globe, color: 'text-gray-600' },
    ]
  },
  {
    category: 'Messaging',
    items: [
      { id: 'whatsapp', name: 'WhatsApp', icon: WhatsAppIcon, color: 'text-green-600', badge: 'New' },
      { id: 'rcs', name: 'RCS', icon: GoogleMessagesIcon, color: 'text-blue-600', badge: 'New' },
    ]
  },
  {
    category: 'On-site',
    items: [
      { id: 'in-app', name: 'In-app message', icon: Smartphone, color: 'text-blue-600' },
      { id: 'web-message', name: 'Web message', icon: Monitor, color: 'text-gray-600' },
    ]
  }
];

const SummaryPanel = ({ formData, currentStep }: { formData: CampaignFormData; currentStep: Step }) => {
  const getSelectedSegmentData = () => {
    return adobeSegments.filter(segment => 
      formData.selectedSegments.includes(segment.id)
    );
  };

  return (
    <div className="bg-muted/20 p-6 border-l border-border h-full">
      <h3 className="text-lg font-semibold mb-6">Summary</h3>
      
      <div className="space-y-4">
        {/* Setup Summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Setup</span>
            <ChevronDown className="w-4 h-4" />
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Campaign name:</span>
              <div>{formData.campaignName}</div>
            </div>
            <div>
              <span className="font-medium text-foreground">Tags:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="font-medium text-foreground">Conversion activity:</span>
              <div>{formData.eventName}</div>
            </div>
            <div>
              <span className="font-medium text-foreground">Conversion window:</span>
              <div>{formData.conversionWindow} Days</div>
            </div>
            <div>
              <span className="font-medium text-foreground">Revenue parameter:</span>
              <div>{formData.revenueParameter}</div>
            </div>
            <div>
              <span className="font-medium text-foreground">Business number:</span>
              <div>Netcore Solutions Support (+91 2249757637)</div>
            </div>
            <div>
              <span className="font-medium text-foreground">Link tracking:</span>
              <div>{formData.linkTracking ? 'Enabled' : 'Disabled'}</div>
            </div>
            <div>
              <span className="font-medium text-foreground">Deduplication:</span>
              <div>{formData.deduplication ? 'On' : 'Off'}</div>
            </div>
          </div>
        </div>

        {/* Audience Summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Audience</span>
            <ChevronDown className="w-4 h-4" />
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Target audience:</span>
              <div>{formData.targetAudience === 'all' ? 'All contacts' : 'Lists/Segments'}</div>
            </div>
            {formData.targetAudience === 'segments' && formData.selectedSegments.length > 0 && (
              <div>
                <span className="font-medium text-foreground">Selected segments:</span>
                {getSelectedSegmentData().map(segment => (
                  <div key={segment.id} className="flex items-center space-x-1 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {segment.name}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <div>
              <span className="font-medium text-foreground">Excluded audience:</span>
              <div>Exclude list/segment</div>
              <div>{formData.excludeContacts ? 'On' : 'Off'}</div>
            </div>
            {formData.sendLimit && (
              <>
                <div>
                  <span className="font-medium text-foreground">Send limit:</span>
                  <div>Enabled - Max {formData.maxRecipients} recipients</div>
                </div>
                <div>
                  <span className="font-medium text-foreground">Sampling method:</span>
                  <div>{formData.samplingMethod === 'random' ? 'Random sample' : 'Top-N by priority'}</div>
                </div>
                <div>
                  <span className="font-medium text-foreground">Final count:</span>
                  <div>{Math.min(formData.maxRecipients, formData.selectedSegments.length > 0 ? 
                    adobeSegments.filter(s => formData.selectedSegments.includes(s.id))
                      .reduce((sum, s) => sum + s.users, 0) : 0)} contacts</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content Summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Content</span>
            <ChevronDown className="w-4 h-4" />
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            {formData.selectedTemplate && (
              <div>
                <span className="font-medium text-foreground">Template:</span>
                <div>{formData.selectedTemplate}</div>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Schedule</span>
            <ChevronDown className="w-4 h-4" />
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            {currentStep === 'schedule' && (
              <>
                <div>
                  <span className="font-medium text-foreground">When to send:</span>
                  <div>{formData.scheduleType === 'optimize' ? 'Optimize with Co-marketer' : formData.scheduleType}</div>
                </div>
                {formData.scheduleType === 'optimize' && (
                  <>
                    <div>
                      <span className="font-medium text-foreground">Start time:</span>
                      <div>{formData.startTime}</div>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">End time:</span>
                      <div>{formData.endTime}</div>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Send at end time:</span>
                      <div>{formData.endTime}</div>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Control group:</span>
                      <div>{formData.controlGroupPercentage}%</div>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Specific time:</span>
                      <div>{formData.specificTime}</div>
                    </div>
                  </>
                )}
                {formData.retryEnabled && (
                  <div>
                    <span className="font-medium text-foreground">Retries:</span>
                    <div>Daily × {formData.retryDuration} days</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export function CreateCampaignModal({ open, onClose }: CreateCampaignModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('start');
  const [formData, setFormData] = useState<CampaignFormData>({
    campaignName: 'Adobe',
    tags: ['Adobe'],
    businessNumber: 'netcore',
    linkTracking: true,
    conversionGoal: true,
    eventName: 'Account Opened (Savings)',
    conversionWindow: 1,
    revenueParameter: 'price',
    deduplication: true,
    targetAudience: 'segments',
    selectedSegments: [],
    excludeContacts: false,
    selectedTemplate: 'static_carousel_recs_url',
    scheduleType: 'now',
    startTime: 'Sep 09, 2025 03:45 pm',
    endTime: 'Sep 10, 2025 02:45 pm',
    scheduledDate: null,
    scheduledTime: '4:00 PM',
    timezone: 'Asia/Calcutta',
    fallbackOption: 'end',
    frequencyCap: true,
    controlGroup: true,
    controlGroupPercentage: 5,
    specificTime: 'Sep 09, 2025 02:00 pm',
    isPublished: false,
    // Audience Limit fields
    sendLimit: false,
    maxRecipients: 1000,
    samplingMethod: 'random',
    // Retry Logic fields
    retryEnabled: false,
    retryDuration: 7,
    stopOnConversion: true,
    stopOnManualPause: true,
    stopOnTemplateChange: true
  });

  const updateFormData = useCallback((updates: Partial<CampaignFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleStartOptionClick = (optionId: string) => {
    if (optionId === 'engage') {
      setCurrentStep('channels');
    }
  };

  const handleChannelClick = (channelId: string) => {
    if (channelId === 'whatsapp') {
      setCurrentStep('setup');
    }
  };

  const handleBack = () => {
    if (currentStep === 'channels') {
      setCurrentStep('start');
    } else if (currentStep === 'setup') {
      setCurrentStep('channels');
    } else if (currentStep === 'audience') {
      setCurrentStep('setup');
    } else if (currentStep === 'content') {
      setCurrentStep('audience');
    } else if (currentStep === 'schedule') {
      setCurrentStep('content');
    } else if (currentStep === 'preview') {
      setCurrentStep('schedule');
    }
  };

  const handleNext = () => {
    if (currentStep === 'setup') {
      setCurrentStep('audience');
    } else if (currentStep === 'audience') {
      setCurrentStep('content');
    } else if (currentStep === 'content') {
      setCurrentStep('schedule');
    } else if (currentStep === 'schedule') {
      setCurrentStep('preview');
    }
  };

  const handleClose = () => {
    setCurrentStep('start');
    setFormData({
      campaignName: 'Adobe',
      tags: ['Adobe'],
      businessNumber: 'netcore',
      linkTracking: true,
      conversionGoal: true,
      eventName: 'Account Opened (Savings)',
      conversionWindow: 1,
      revenueParameter: 'price',
      deduplication: true,
      targetAudience: 'segments',
      selectedSegments: [],
      excludeContacts: false,
      selectedTemplate: 'static_carousel_recs_url',
      scheduleType: 'now',
      startTime: 'Sep 09, 2025 03:45 pm',
      endTime: 'Sep 10, 2025 02:45 pm',
      scheduledDate: null,
      scheduledTime: '4:00 PM',
      timezone: 'Asia/Calcutta',
      fallbackOption: 'end',
      frequencyCap: true,
      controlGroup: true,
      controlGroupPercentage: 5,
      specificTime: 'Sep 09, 2025 02:00 pm',
      isPublished: false,
      // Audience Limit fields
      sendLimit: false,
      maxRecipients: 1000,
      samplingMethod: 'random',
      // Retry Logic fields
      retryEnabled: false,
      retryDuration: 7,
      stopOnConversion: true,
      stopOnManualPause: true,
      stopOnTemplateChange: true
    });
    onClose();
  };

  const removeTag = (tagToRemove: string) => {
    updateFormData({
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Template Selection Dropdown Component
  const TemplateDropdown = ({ selectedTemplate, onTemplateChange }: { 
    selectedTemplate: string;
    onTemplateChange: (template: string) => void;
  }) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedQuery(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }, [searchQuery]);

    const filteredTemplates = useMemo(() => {
      return whatsappTemplates.filter(template =>
        template.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    }, [debouncedQuery]);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between">
            {selectedTemplate || "Select template"}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput 
              placeholder="Search templates..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandEmpty>No templates found.</CommandEmpty>
            <CommandGroup>
              {filteredTemplates.map((template) => (
                <CommandItem
                  key={template.id}
                  value={template.name}
                  onSelect={() => {
                    onTemplateChange(template.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selectedTemplate === template.id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {template.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  const renderContentStep = () => (
    <div className="min-h-screen flex gap-6">
      <div className="flex-1 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="p-6 pb-4">
            <DialogHeader className="mb-6">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <DialogTitle className="text-xl font-semibold">WhatsApp campaign</DialogTitle>
              </div>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-primary">Setup</span>
              </div>
              <div className="flex-1 h-px bg-primary"></div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-primary">Audience</span>
              </div>
              <div className="flex-1 h-px bg-primary"></div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  <MessageSquareText className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-primary">Content</span>
              </div>
              <div className="flex-1 h-px bg-border"></div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-muted-foreground rounded-full flex items-center justify-center text-sm">
                  4
                </div>
                <span className="text-sm text-muted-foreground">Schedule</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="space-y-6 pt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Select template</h3>
              <p className="text-sm text-muted-foreground mb-4">Select pre-approved message for whatsapp campaign</p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template">Template *</Label>
                  <div className="mt-1">
                    <TemplateDropdown
                      selectedTemplate={formData.selectedTemplate}
                      onTemplateChange={(template) => updateFormData({ selectedTemplate: template })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-50 bg-background border-t border-border p-6 flex justify-end space-x-2">
          <Button variant="outline">FINISH LATER</Button>
          <Button onClick={handleNext}>NEXT STEP</Button>
        </div>
      </div>
      
      {/* Preview Panel */}
      <div className="w-80 border-l border-border bg-muted/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Preview</h3>
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <Send className="w-4 h-4" />
            <span>SEND TEST MESSAGE</span>
          </Button>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium mb-2">See how your customers will receive it! 😊</h4>
          <p className="text-sm text-muted-foreground">
            Note: Test your template post-approval by Meta to confirm accuracy before sending it to users.
          </p>
        </div>

        {/* Phone Mockup */}
        <div className="flex justify-center">
          <div className="relative w-64 h-[500px] bg-black rounded-[2rem] p-2">
            <div className="w-full h-full bg-white rounded-[1.5rem] overflow-hidden">
              {/* WhatsApp Header */}
              <div className="bg-green-600 text-white p-4 flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <img 
                    src="/lovable-uploads/770b7510-d3df-445b-b9b0-7971f7f8105b.png" 
                    alt="Netcore Logo" 
                    className="w-5 h-5 rounded-sm"
                  />
                </div>
                <span className="font-medium">Netcore Cloud</span>
              </div>
              
              {/* Message Content */}
              <div className="p-4 bg-gray-50 flex-1 h-full">
                {formData.selectedTemplate ? (
                  <div className="bg-white rounded-lg p-3 max-w-[200px] ml-auto shadow-sm">
                    <p className="text-sm mb-2">
                      Check out our top deals and grab your favorites before the stock runs out!
                    </p>
                    
                    <div className="flex space-x-2 mb-3">
                      <div className="flex-1 bg-green-100 rounded-lg p-2">
                        <div className="w-full h-16 bg-orange-200 rounded mb-2"></div>
                        <p className="text-xs font-medium">Flat 30% OFF on our best-selling sneakers.</p>
                        <div className="flex flex-col space-y-1 mt-2">
                          <Button variant="link" size="sm" className="text-xs p-0 h-auto text-blue-600">
                            🔗 Visit Website
                          </Button>
                          <Button variant="link" size="sm" className="text-xs p-0 h-auto text-blue-600">
                            🔗 View Product
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 bg-green-100 rounded-lg p-2">
                        <div className="w-full h-16 bg-orange-200 rounded mb-2"></div>
                        <p className="text-xs font-medium">Flat 30% OFF on our best-selling sneakers.</p>
                        <div className="flex flex-col space-y-1 mt-2">
                          <Button variant="link" size="sm" className="text-xs p-0 h-auto text-blue-600">
                            🔗 Visit Website
                          </Button>
                          <Button variant="link" size="sm" className="text-xs p-0 h-auto text-blue-600">
                            🔗 View Product
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>😊</span>
                      <span>🗂️</span>
                      <span>📎</span>
                      <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                        ↓
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground text-sm">
                    Select a template to see preview
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper function to validate schedule times
  const validateScheduleTimes = () => {
    if (formData.scheduleType === 'later' || formData.scheduleType === 'optimize') {
      const startDate = new Date(formData.startTime);
      const endDate = new Date(formData.endTime);
      return startDate < endDate;
    }
    return true;
  };

  // Helper function to check if template allows retry
  const isRetryAllowed = () => {
    const selectedTemplate = whatsappTemplates.find(t => t.id === formData.selectedTemplate);
    return selectedTemplate && 
           (selectedTemplate.category === 'Marketing' || selectedTemplate.category === 'Promotional') &&
           selectedTemplate.status === 'Active';
  };

  // Available timezones
  const timezones = [
    'Asia/Calcutta',
    'America/New_York', 
    'Europe/London',
    'America/Los_Angeles',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];

  const renderScheduleStep = () => (
    <div className="min-h-screen flex gap-6">
      <div className="flex-1 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="p-6 pb-4">
            <DialogHeader className="mb-6">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <DialogTitle className="text-xl font-semibold">WhatsApp campaign</DialogTitle>
              </div>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex items-center space-x-4">
              <button 
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                onClick={() => setCurrentStep('setup')}
              >
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-primary">Setup</span>
              </button>
              <div className="flex-1 h-px bg-primary"></div>
              <button 
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                onClick={() => setCurrentStep('audience')}
              >
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-primary">Audience</span>
              </button>
              <div className="flex-1 h-px bg-primary"></div>
              <button 
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                onClick={() => setCurrentStep('content')}
              >
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-primary">Content</span>
              </button>
              <div className="flex-1 h-px bg-primary"></div>
              <button 
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                onClick={() => setCurrentStep('schedule')}
              >
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-primary">Schedule</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="space-y-6 pt-6">
            {/* Schedule Campaign */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Schedule campaign</h3>
                <div className="text-sm text-muted-foreground">
                  Timezone: {formData.timezone} | {format(new Date(), "MMM dd, yyyy hh:mm a")}
                </div>
              </div>

              {/* Frequency Cap */}
              <div className="mb-6">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-orange-50 border-orange-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Frequency cap</span>
                  </div>
                  <Switch 
                    checked={formData.frequencyCap}
                    onCheckedChange={(checked) => updateFormData({ frequencyCap: checked })}
                  />
                </div>
                {formData.frequencyCap && (
                  <p className="text-sm text-orange-600 mt-2">
                    Running 2 consecutive campaigns within 30 minutes time-frame could potentially bypass the frequency cap check due to data synchronisation delay.
                  </p>
                )}
              </div>

              {/* When to send */}
              <div>
                <h4 className="font-medium mb-4">When to send</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="sendNow"
                      name="scheduleType"
                      checked={formData.scheduleType === 'now'}
                      onChange={() => updateFormData({ scheduleType: 'now' })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="sendNow">Send now</Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="sendLater"
                      name="scheduleType"
                      checked={formData.scheduleType === 'later'}
                      onChange={() => updateFormData({ scheduleType: 'later' })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="sendLater">Send later</Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="optimize"
                      name="scheduleType"
                      checked={formData.scheduleType === 'optimize'}
                      onChange={() => updateFormData({ scheduleType: 'optimize' })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="optimize">Optimize with Co-marketer</Label>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Send Later DateTime Picker */}
                {formData.scheduleType === 'later' && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Select date and time *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.scheduledDate ? format(formData.scheduledDate, "MMM dd, yyyy") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.scheduledDate || undefined}
                              onSelect={(date) => updateFormData({ scheduledDate: date || null })}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label>Timezone</Label>
                        <Select 
                          value={formData.timezone} 
                          onValueChange={(value) => updateFormData({ timezone: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timezones.map(tz => (
                              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="w-1/2">
                      <Input
                        placeholder="4:00 PM"
                        value={formData.scheduledTime}
                        onChange={(e) => updateFormData({ scheduledTime: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Co-Marketer Optimization Window */}
                {formData.scheduleType === 'optimize' && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start time *</Label>
                        <Input
                          placeholder="Sep 09, 2025 03:45 pm"
                          value={formData.startTime}
                          onChange={(e) => updateFormData({ startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>End time *</Label>
                        <Input
                          placeholder="Sep 10, 2025 02:45 pm" 
                          value={formData.endTime}
                          onChange={(e) => updateFormData({ endTime: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    {/* Validation Error */}
                    {!validateScheduleTimes() && (
                      <Alert className="border-destructive bg-destructive/10">
                        <Info className="h-4 w-4 text-destructive" />
                        <AlertDescription className="text-destructive">
                          Start time must be before end time
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        For unpredictable users and users whose preferred time doesn't fall in the selected time range
                      </p>
                      <Select 
                        value={formData.fallbackOption} 
                        onValueChange={(value: 'start' | 'end') => updateFormData({ fallbackOption: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="end">Send at end time</SelectItem>
                          <SelectItem value="start">Send at start time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Control Group */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">Control group</h4>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <Switch 
                    checked={formData.controlGroup}
                    onCheckedChange={(checked) => updateFormData({ controlGroup: checked })}
                  />
                </div>
                
                {formData.controlGroup && (
                  <div>
                    <div className="mb-4">
                      <Label>Select control group</Label>
                      <div className="mt-2">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm">1%</span>
                          <Slider
                            value={[formData.controlGroupPercentage]}
                            onValueChange={(value) => updateFormData({ controlGroupPercentage: value[0] })}
                            max={99}
                            min={1}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-sm">99%</span>
                        </div>
                        <div className="text-center text-sm text-muted-foreground mt-1">
                          {formData.controlGroupPercentage}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <h5 className="font-medium">Specific time</h5>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <Label htmlFor="specificTime">Set default time *</Label>
                        <Input
                          id="specificTime"
                          value={formData.specificTime}
                          onChange={(e) => updateFormData({ specificTime: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Retry Logic Panel */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">Retry logic</h4>
                  <Info className="w-4 h-4 text-muted-foreground" />
                  {formData.scheduleType === 'optimize' && formData.retryEnabled && (
                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                      Managed by Co-Marketer
                    </Badge>
                  )}
                </div>
                <Switch 
                  checked={formData.retryEnabled}
                  onCheckedChange={(checked) => updateFormData({ retryEnabled: checked })}
                  disabled={!isRetryAllowed()}
                />
              </div>

              {/* Template Category/Status Validation */}
              {formData.selectedTemplate && !isRetryAllowed() && (
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {whatsappTemplates.find(t => t.id === formData.selectedTemplate)?.category === 'Utility'
                      ? 'Retry logic is only available for Marketing/Promotional campaign templates.'
                      : 'Template is paused by Meta or auto-disabled. Retry logic blocked until reactivated.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Retry Configuration - Unified for all modes */}
              {formData.retryEnabled && isRetryAllowed() && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Fixed cadence:</strong> Every 24 hours
                    </p>
                    
                    {/* Duration Slider */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Duration (days)</Label>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm">1</span>
                        <Slider
                          value={[formData.retryDuration]}
                          onValueChange={(value) => updateFormData({ retryDuration: value[0] })}
                          max={7}
                          min={1}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm">7</span>
                      </div>
                      <div className="text-center text-sm text-muted-foreground mt-1">
                        {formData.retryDuration} day{formData.retryDuration !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Target Statuses */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Target statuses (auto-included)</Label>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>• Failed messages</div>
                      <div>• Undelivered messages</div>
                      <div>• Rate-limited messages</div>
                      <div>• Expired messages</div>
                      <div className="mt-2 text-xs">
                        <strong>Auto-excluded:</strong> Opted-out, Invalid numbers, Blocked contacts
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-50 bg-background border-t border-border p-6 flex justify-end space-x-2">
          <Button variant="outline">FINISH LATER</Button>
          <Button onClick={handleNext} disabled={!validateScheduleTimes()}>
            SAVE AND PREVIEW
          </Button>
        </div>
      </div>
      
      <div className="w-80 overflow-y-auto max-h-screen" style={{ WebkitOverflowScrolling: 'touch' }}>
        <SummaryPanel formData={formData} currentStep={currentStep} />
      </div>
    </div>
  );

  const [showProgressPopup, setShowProgressPopup] = useState(false);
  const [currentProgressStep, setCurrentProgressStep] = useState(0);
  const [showPersonalizationDrawer, setShowPersonalizationDrawer] = useState(false);

  const progressSteps = [
    "Campaign Setup Done",
    "Audience Fetched",
    "Content Checked", 
    "Schedule - Campaign Execution Started",
    "Send, Delivered, Opened/Read, Clicked, Failed",
    "Metrics will auto sync to Adobe in sometime",
    "No customer data stored in Netcore"
  ];

  const personalizationOptions = [
    {
      id: 'ai-optimization',
      title: 'AI Optimization',
      description: 'Automatically optimize send times and content',
      icon: Zap,
      enabled: true
    },
    {
      id: 'dynamic-content',
      title: 'Dynamic Content',
      description: 'Personalize content based on user behavior',
      icon: Target,
      enabled: false
    },
    {
      id: 'custom-branding',
      title: 'Custom Branding',
      description: 'Apply your brand colors and styling',
      icon: Palette,
      enabled: true
    }
  ];

  const PersonalizationDrawer = () => (
    <div className={`fixed right-0 top-0 h-full w-80 bg-background border-l border-border shadow-2xl z-50 transform transition-all duration-300 ease-in-out ${
      showPersonalizationDrawer ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Personalization Options</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowPersonalizationDrawer(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Enhance your campaign with advanced personalization features
        </p>
      </div>
      
    </div>
  );

  const navigate = useNavigate();
  
  const handlePublish = () => {
    // Validation: Check if retry logic is enabled with Utility template
    const selectedTemplate = whatsappTemplates.find(t => t.id === formData.selectedTemplate);
    
    if (formData.retryEnabled && selectedTemplate?.category === 'Utility') {
      // This should already be prevented by UI, but adding extra validation
      return;
    }

    updateFormData({ isPublished: true });
    setShowProgressPopup(true);
    setCurrentProgressStep(0);
    
    // Animate through progress steps
    progressSteps.forEach((_, index) => {
      setTimeout(() => {
        setCurrentProgressStep(index + 1);
      }, (index + 1) * 1000);
    });

    // Auto close after all steps and navigate to campaigns page
    setTimeout(() => {
      setShowProgressPopup(false);
      // Generate a campaign ID for the newly published campaign
      const campaignId = `${Date.now()}`;
      onClose();
      // Redirect to campaigns page with success flag and campaign ID
      navigate(`/engage/campaigns?published=true&campaignId=${campaignId}&channel=WhatsApp`);
    }, (progressSteps.length + 1) * 1000);
  };

  const renderPreviewStep = () => (
    <div className="flex flex-col h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <DialogTitle className="text-xl font-semibold">Preview of Adobe</DialogTitle>
            </div>
            <Button onClick={handlePublish}>SAVE & PUBLISH</Button>
          </div>
        </DialogHeader>
        
        {/* Retry Logic Banner */}
        {formData.retryEnabled && (
          <Alert className="mt-4 border-info bg-info/10">
            <Info className="h-4 w-4 text-info" />
            <AlertDescription className="text-foreground">
              <strong>Retry plan scheduled</strong> (24h cadence, up to {formData.retryDuration} days). 
              Execution via Netcore; metrics sync back to Adobe. No customer data stored on Netcore.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Progress Popup */}
      {showProgressPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-background rounded-lg p-8 max-w-md w-full mx-4 animate-scale-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-lg font-semibold mb-6">Campaign Execution Progress</h3>
              
              <div className="space-y-3 text-left">
                {progressSteps.map((step, index) => (
                  <div key={index} className={`flex items-center space-x-3 transition-all duration-300 ${
                    index < currentProgressStep 
                      ? 'text-green-600' 
                      : index === currentProgressStep 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      index < currentProgressStep 
                        ? 'bg-green-100 text-green-600' 
                        : index === currentProgressStep 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {index < currentProgressStep ? (
                        <Check className="w-3 h-3" />
                      ) : index === currentProgressStep ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
              
              {currentProgressStep >= progressSteps.length && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-sm text-green-600 font-medium">✓ Campaign execution completed successfully</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="grid grid-cols-2 gap-6 h-full">
          {/* Left Column - Scrollable */}
          <div className="overflow-y-auto max-h-screen space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Setup Details */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <CardTitle className="text-sm">Setup details</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  <Edit className="w-4 h-4 mr-1" />
                  EDIT
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Campaign ID:</span>
                    <span>263</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Campaign name:</span>
                    <span>{formData.campaignName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Business number:</span>
                    <span>Netcore Solutions Support (+91 2249757637)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Link tracking:</span>
                    <span>Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tags:</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {formData.tags[0]}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audience */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <CardTitle className="text-sm">Audience</CardTitle>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-muted-foreground">Reachable contacts</span>
                    <span className="font-medium">{formData.selectedSegments.length > 0 ? 
                      adobeSegments.filter(s => formData.selectedSegments.includes(s.id))
                        .reduce((sum, s) => sum + s.users, 0) : 0}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    <Edit className="w-4 h-4 mr-1" />
                    EDIT
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Selected contacts</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Segments/Lists:</span>
                    {formData.selectedSegments.length > 0 && (
                      <div className="mt-1">
                        {adobeSegments
                          .filter(s => formData.selectedSegments.includes(s.id))
                          .map(segment => (
                            <Badge key={segment.id} variant="secondary" className="mr-1">
                              ID: {segment.id} Test {segment.name}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <CardTitle className="text-sm">Schedule</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  <Edit className="w-4 h-4 mr-1" />
                  EDIT
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Schedule campaign</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frequency cap:</span>
                    <span>{formData.frequencyCap ? 'On' : 'Off'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">When to send:</span>
                    <span className="capitalize">{formData.scheduleType === 'optimize' ? 'Optimize with Co-marketer' : formData.scheduleType}</span>
                  </div>
                  {formData.scheduleType === 'optimize' && (
                    <>
                      <div className="text-xs text-muted-foreground">
                        Start time - {formData.startTime}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        End time - {formData.endTime}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Send at end time - {formData.endTime}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Control group - {formData.controlGroupPercentage}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Specific time - {formData.specificTime}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Scrollable */}
          <div className="overflow-y-auto max-h-screen" style={{ WebkitOverflowScrolling: 'touch' }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquareText className="w-4 h-4" />
                  <CardTitle className="text-sm">Content</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  <Edit className="w-4 h-4 mr-1" />
                  EDIT
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Template Name:</span>
                    <div className="font-medium">{formData.selectedTemplate}</div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Note: Test your template post-approval by Meta to confirm accuracy before sending it to users.
                  </div>

                  {/* Phone Preview */}
                  <div className="flex justify-center">
                    <div className="relative w-48 h-80 bg-black rounded-2xl p-1">
                      <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                        <div className="bg-green-600 text-white p-2 flex items-center space-x-2 text-xs">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="font-medium">Netcore Cloud</span>
                        </div>
                        
                        <div className="p-2 bg-gray-50 h-full">
                          <div className="bg-white rounded-lg p-2 text-xs shadow-sm">
                            <p className="mb-2">Check out our top deals and grab your favorites before the stock runs out!</p>
                            
                            <div className="grid grid-cols-2 gap-1 mb-2">
                              <div className="bg-green-100 rounded p-1">
                                <div className="w-full h-8 bg-orange-200 rounded mb-1"></div>
                                <p className="text-[10px] font-medium">Flat 30% OFF on our best-selling sneakers.</p>
                                <div className="flex flex-col space-y-0.5 mt-1">
                                  <div className="text-[8px] text-blue-600">🔗 Visit Website</div>
                                  <div className="text-[8px] text-blue-600">🔗 View Product</div>
                                </div>
                              </div>
                              <div className="bg-green-100 rounded p-1">
                                <div className="w-full h-8 bg-orange-200 rounded mb-1"></div>
                                <p className="text-[10px] font-medium">Flat 30% OFF on our best-selling sneakers.</p>
                                <div className="flex flex-col space-y-0.5 mt-1">
                                  <div className="text-[8px] text-blue-600">🔗 Visit Website</div>
                                  <div className="text-[8px] text-blue-600">🔗 View Product</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-[8px] text-gray-500">
                              <span>😊</span>
                              <span>📎</span>
                              <span className="bg-green-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                                ✓
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStartStep = () => (
    <div className="p-6">
      <DialogHeader className="mb-6">
        <DialogTitle className="text-xl font-semibold">How would you like to start?</DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-2 gap-4">
        {startOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleStartOptionClick(option.id)}
            className="p-6 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <option.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-foreground">{option.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderChannelsStep = () => (
    <div className="p-6">
      <DialogHeader className="mb-6">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <DialogTitle className="text-xl font-semibold">
            How do you want to engage with your users?
          </DialogTitle>
        </div>
      </DialogHeader>

      <div className="space-y-6">
        {channelOptions.map((category) => (
          <div key={category.category}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              {category.category}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {category.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleChannelClick(item.id)}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left flex items-center space-x-3"
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="font-medium text-foreground">{item.name}</span>
                  {item.badge && (
                    <span className="bg-warning text-warning-foreground text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wide">
              Personalization
            </h3>
            <p className="text-xs text-muted-foreground">
              Advanced options to enhance your campaign
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPersonalizationDrawer(true)}
            className="flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Configure</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSetupStep = () => (
    <div className="min-h-screen flex gap-6">
      <div className="flex-1 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="p-6 pb-4">
            <DialogHeader className="mb-6">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <DialogTitle className="text-xl font-semibold">WhatsApp campaign</DialogTitle>
              </div>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-primary">Setup</span>
              </div>
              <div className="flex-1 h-px bg-border"></div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-muted-foreground rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Audience</span>
              </div>
              <div className="flex-1 h-px bg-border"></div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-muted-foreground rounded-full flex items-center justify-center text-sm">
                  3
                </div>
                <span className="text-sm text-muted-foreground">Content</span>
              </div>
              <div className="flex-1 h-px bg-border"></div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-muted-foreground rounded-full flex items-center justify-center text-sm">
                  4
                </div>
                <span className="text-sm text-muted-foreground">Schedule</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="space-y-6 pt-6">
            {/* Campaign Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Campaign details</h3>
              <p className="text-sm text-muted-foreground mb-4">Provide basic details about your campaign</p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaignName">Campaign name *</Label>
                  <Input
                    id="campaignName"
                    value={formData.campaignName}
                    onChange={(e) => updateFormData({ campaignName: e.target.value })}
                    placeholder="Campaign name"
                    className="mt-1"
                  />
                  <div className="flex justify-end text-xs text-muted-foreground mt-1">
                    {formData.campaignName.length}/100
                  </div>
                </div>

                <div>
                  <Label htmlFor="businessNumber">Business number *</Label>
                  <Select 
                    value={formData.businessNumber} 
                    onValueChange={(value) => updateFormData({ businessNumber: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {businessNumbers.map((number) => (
                        <SelectItem key={number.id} value={number.id}>
                          {number.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Quality rating:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">HIGH</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Messaging limit:</span>
                      <span className="text-foreground">10000 Messaging limit per 24hrs.</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Last updated:</span>
                      <span className="text-foreground">Sep 09, 2025 12:03 PM</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Add tags <Info className="w-4 h-4 inline ml-1 text-muted-foreground" /></Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                        <span>{tag}</span>
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Select upto 5 tags</p>
                </div>
              </div>
            </div>

            {/* Link Tracking */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Link tracking</h4>
                  <p className="text-sm text-muted-foreground">Link tracking has been enabled</p>
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="domain">Domain name</Label>
                <Input
                  id="domain"
                  value="nctrckg.com"
                  disabled
                  className="mt-1 bg-muted"
                />
              </div>
            </div>

            {/* Conversion Goal */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium">Set conversion goal</h4>
                  <p className="text-sm text-muted-foreground">Select the event you would like to count as a conversion</p>
                </div>
                <Switch 
                  checked={formData.conversionGoal}
                  onCheckedChange={(checked) => updateFormData({ conversionGoal: checked })}
                />
              </div>
              
              {formData.conversionGoal && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="eventName">Event name</Label>
                    <Select 
                      value={formData.eventName} 
                      onValueChange={(value) => updateFormData({ eventName: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {bfsiConversionEvents.map((event) => (
                          <SelectItem key={event} value={event}>{event}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Checkbox 
                      id="payloadParams"
                      className="mt-1"
                    />
                    <Label htmlFor="payloadParams" className="text-sm">
                      Specify payload parameters
                    </Label>
                  </div>

                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <Label htmlFor="conversionWindow">Conversion window</Label>
                      <div className="flex mt-1">
                        <Input
                          id="conversionWindow"
                          type="number"
                          value={formData.conversionWindow}
                          onChange={(e) => updateFormData({ conversionWindow: Number(e.target.value) })}
                          className="rounded-r-none"
                        />
                        <Select value="Days">
                          <SelectTrigger className="w-20 rounded-l-none border-l-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Days">Days</SelectItem>
                            <SelectItem value="Hours">Hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <Label htmlFor="revenueParameter">Revenue parameter</Label>
                      <Select 
                        value={formData.revenueParameter} 
                        onValueChange={(value) => updateFormData({ revenueParameter: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="price">price</SelectItem>
                          <SelectItem value="amount">amount</SelectItem>
                          <SelectItem value="total">total</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Deduplication */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Deduplication</h4>
                  <p className="text-sm text-muted-foreground">Avoid duplicate communication to contacts</p>
                </div>
                <Switch 
                  checked={formData.deduplication}
                  onCheckedChange={(checked) => updateFormData({ deduplication: checked })}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-50 bg-background border-t border-border p-6 flex justify-end space-x-2">
          <Button variant="outline">FINISH LATER</Button>
          <Button onClick={handleNext}>NEXT STEP</Button>
        </div>
      </div>
      
      <div className="w-80 overflow-y-auto max-h-screen" style={{ WebkitOverflowScrolling: 'touch' }}>
        <SummaryPanel formData={formData} currentStep={currentStep} />
      </div>
    </div>
  );

  const renderAudienceStep = () => (
    <div className="min-h-screen flex gap-6">
      <div className="flex-1 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="p-6 pb-4">
            <DialogHeader className="mb-6">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <DialogTitle className="text-xl font-semibold">WhatsApp campaign</DialogTitle>
              </div>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-primary">Setup</span>
              </div>
              <div className="flex-1 h-px bg-primary"></div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-primary">Audience</span>
              </div>
              <div className="flex-1 h-px bg-border"></div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-muted-foreground rounded-full flex items-center justify-center text-sm">
                  3
                </div>
                <span className="text-sm text-muted-foreground">Content</span>
              </div>
              <div className="flex-1 h-px bg-border"></div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-muted-foreground rounded-full flex items-center justify-center text-sm">
                  4
                </div>
                <span className="text-sm text-muted-foreground">Schedule</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="space-y-6 pt-6">
            {/* Target Audience */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Target audience</h3>
                  <p className="text-sm text-muted-foreground">Select your target audience for the campaign</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Reachable contacts</span>
                  <span className="font-medium">{formData.selectedSegments.length > 0 ? 
                    adobeSegments.filter(s => formData.selectedSegments.includes(s.id))
                      .reduce((sum, s) => sum + s.users, 0) : 0}</span>
                  <Info className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="allContacts"
                    name="targetAudience"
                    checked={formData.targetAudience === 'all'}
                    onChange={() => updateFormData({ targetAudience: 'all' })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="allContacts">All contacts</Label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="segments"
                    name="targetAudience"
                    checked={formData.targetAudience === 'segments'}
                    onChange={() => updateFormData({ targetAudience: 'segments' })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="segments">Lists/Segments</Label>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {formData.targetAudience === 'segments' && (
              <div>
                <div className="mb-4">
                  <Label>Select Lists/Segments</Label>
                  <div className="mt-2">
                    <SegmentsDropdown
                      selectedSegments={formData.selectedSegments}
                      onSelectionChange={(segments) => updateFormData({ selectedSegments: segments })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Exclude Contacts */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Exclude contacts</h3>
              
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Exclude list/segment</span>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <Switch 
                  checked={formData.excludeContacts}
                  onCheckedChange={(checked) => updateFormData({ excludeContacts: checked })}
                />
              </div>
            </div>

            {/* Send Limit */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Send limit</h3>
              
              <div className="flex items-center justify-between p-4 border border-border rounded-lg mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Limit sends</span>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <Switch 
                  checked={formData.sendLimit}
                  onCheckedChange={(checked) => updateFormData({ sendLimit: checked })}
                />
              </div>

              {formData.sendLimit && (
                <div className="space-y-4">
                  {/* Max Recipients */}
                  <div>
                    <Label htmlFor="maxRecipients">Max recipients *</Label>
                    <div className="mt-2 relative">
                      <Input
                        id="maxRecipients"
                        type="number"
                        min="1"
                        value={formData.maxRecipients}
                        onChange={(e) => {
                          const value = Math.max(1, parseInt(e.target.value) || 1);
                          updateFormData({ maxRecipients: value });
                        }}
                        className={`${
                          formData.maxRecipients > (formData.selectedSegments.length > 0 ? 
                            adobeSegments.filter(s => formData.selectedSegments.includes(s.id))
                              .reduce((sum, s) => sum + s.users, 0) : 0) 
                            ? 'border-destructive' : ''
                        }`}
                      />
                      {formData.maxRecipients > (formData.selectedSegments.length > 0 ? 
                        adobeSegments.filter(s => formData.selectedSegments.includes(s.id))
                          .reduce((sum, s) => sum + s.users, 0) : 0) && (
                        <p className="text-sm text-destructive mt-1">
                          Max recipients cannot exceed reachable contacts ({formData.selectedSegments.length > 0 ? 
                            adobeSegments.filter(s => formData.selectedSegments.includes(s.id))
                              .reduce((sum, s) => sum + s.users, 0) : 0})
                        </p>
                      )}
                      <div className="text-sm text-muted-foreground mt-1">
                        Live counter: {Math.min(formData.maxRecipients, formData.selectedSegments.length > 0 ? 
                          adobeSegments.filter(s => formData.selectedSegments.includes(s.id))
                            .reduce((sum, s) => sum + s.users, 0) : 0)} contacts will receive this campaign
                      </div>
                    </div>
                  </div>

                  {/* Sampling Method */}
                  <div>
                    <Label className="text-sm font-medium">Sampling method</Label>
                    <div className="mt-2 space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="randomSample"
                          name="samplingMethod"
                          checked={formData.samplingMethod === 'random'}
                          onChange={() => updateFormData({ samplingMethod: 'random' })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="randomSample" className="text-sm">
                          Random sample (stable seed based on campaign ID)
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="prioritySample"
                          name="samplingMethod"
                          checked={formData.samplingMethod === 'priority'}
                          onChange={() => updateFormData({ samplingMethod: 'priority' })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="prioritySample" className="text-sm">
                          Top-N by priority score
                          <span className="text-muted-foreground ml-1">
                            (placeholder if score not available)
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-50 bg-background border-t border-border p-6 flex justify-end space-x-2">
          <Button variant="outline">FINISH LATER</Button>
          <Button onClick={handleNext}>NEXT STEP</Button>
        </div>
      </div>
      
      <div className="w-80 overflow-y-auto max-h-screen" style={{ WebkitOverflowScrolling: 'touch' }}>
        <SummaryPanel formData={formData} currentStep={currentStep} />
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className={`${currentStep === 'setup' || currentStep === 'audience' || currentStep === 'content' || currentStep === 'schedule' || currentStep === 'preview' ? 'max-w-6xl h-screen max-h-screen' : 'max-w-2xl'} p-0 overflow-hidden`}>
          {currentStep === 'start' && renderStartStep()}
          {currentStep === 'channels' && renderChannelsStep()}
          {currentStep === 'setup' && renderSetupStep()}
          {currentStep === 'audience' && renderAudienceStep()}
          {currentStep === 'content' && renderContentStep()}
          {currentStep === 'schedule' && renderScheduleStep()}
          {currentStep === 'preview' && renderPreviewStep()}
        </DialogContent>
      </Dialog>
      
      {/* Personalization Drawer Backdrop */}
      {showPersonalizationDrawer && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 animate-fade-in"
          onClick={() => setShowPersonalizationDrawer(false)}
        />
      )}
      
      {/* Personalization Drawer */}
      <PersonalizationDrawer />
    </>
  );
}