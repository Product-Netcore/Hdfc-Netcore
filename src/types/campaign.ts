// Centralized campaign types and interfaces

export type CampaignStatus = 'DRAFT' | 'SENT' | 'SCHEDULED' | 'SUSPENDED' | 'RUNNING' | 'FAILED';
export type CampaignChannel = 'WhatsApp' | 'Email' | 'SMS' | 'Push';

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  sentOn: string | null;
  published: number;
  sent: number;
  opened: number;
  clicked: number;
  bounce: string;
  channel: CampaignChannel;
  createdAt?: string;
  updatedAt?: string;
  // Retry TTL configuration
  retryTtl?: string; // ISO 8601 datetime string
  scheduledAt?: string; // ISO 8601 datetime string for scheduled campaigns
}

export interface StatusTab {
  id: string;
  label: string;
  count: number;
}

export interface CampaignFilters {
  searchQuery: string;
  activeTab: string;
  activeChannelFilter: string;
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export interface CampaignTableProps {
  publishedCampaignId?: string | null;
  searchQuery?: string;
  activeTab?: string;
}

export interface CampaignRowProps {
  campaign: Campaign;
  isHighlighted?: boolean;
  onSelect?: (campaignId: string) => void;
}

// Campaign data preparation utilities
export interface CampaignListOptions {
  publishedCampaignId?: string | null;
  searchQuery?: string;
  activeTab?: string;
  sortBy?: 'name' | 'date' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// Success banner state
export interface SuccessBannerState {
  show: boolean;
  campaignId: string | null;
  message?: string;
}

// Retry TTL and error-specific retry policies
export type RetryErrorCode = '131049' | '130472' | '132015';

export interface RetryPolicy {
  errorCode: RetryErrorCode;
  description: string;
  retryIntervals: number[]; // Hours between retries
  requiresTemplateActive?: boolean; // For 132015
}

export interface RetryTtlConfig {
  enabled: boolean;
  ttlDateTime?: string; // ISO 8601 datetime string
  scheduledDateTime?: string; // ISO 8601 datetime string (base for TTL calculation)
  stopOnConversion: boolean;
  stopOnManualPause: boolean;
  stopOnTemplateChange: boolean;
}

// Default retry policies for different error codes
export const DEFAULT_RETRY_POLICIES: Record<RetryErrorCode, RetryPolicy> = {
  '131049': {
    errorCode: '131049',
    description: 'Frequency cap / healthy ecosystem',
    retryIntervals: [12, 24, 48], // 12h, 24h, 48h
  },
  '130472': {
    errorCode: '130472',
    description: 'Experiment group',
    retryIntervals: [24, 24, 24], // Fixed 24h gaps
  },
  '132015': {
    errorCode: '132015',
    description: 'Template paused',
    retryIntervals: [24], // Retry after template becomes active
    requiresTemplateActive: true,
  },
};
