import { RetryTtlConfig, RetryErrorCode, DEFAULT_RETRY_POLICIES, RetryPolicy } from '@/types/campaign';

export interface RetryAttempt {
  attemptNumber: number;
  scheduledAt: string; // ISO 8601 datetime
  errorCode?: RetryErrorCode;
  status: 'pending' | 'completed' | 'failed' | 'skipped';
  executedAt?: string; // ISO 8601 datetime
}

export interface CampaignRetryState {
  campaignId: string;
  retryConfig: RetryTtlConfig;
  attempts: RetryAttempt[];
  lastAttemptAt?: string; // ISO 8601 datetime
  nextAttemptAt?: string; // ISO 8601 datetime
  isExpired: boolean;
}

export class RetryService {
  /**
   * Check if retry TTL has expired
   */
  static isRetryTtlExpired(ttlDateTime: string): boolean {
    const ttl = new Date(ttlDateTime);
    const now = new Date();
    return now > ttl;
  }

  /**
   * Validate unified TTL constraints
   */
  static validateUnifiedTtl(ttlDateTime: string, scheduledDateTime: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const ttl = new Date(ttlDateTime);
    const scheduled = new Date(scheduledDateTime);
    const now = new Date();

    // Check if dates are valid
    if (isNaN(ttl.getTime())) {
      errors.push('Invalid TTL datetime');
    }

    if (isNaN(scheduled.getTime())) {
      errors.push('Invalid scheduled datetime');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Check TTL constraints - must be at least 24 hours after scheduled time
    const minTtl = new Date(scheduled);
    minTtl.setDate(minTtl.getDate() + 1); // 24 hours minimum
    
    if (ttl < minTtl) {
      errors.push('TTL must be at least 24 hours after scheduled time');
    }

    const maxTtl = new Date(scheduled);
    maxTtl.setDate(maxTtl.getDate() + 28); // 28 days maximum
    
    if (ttl > maxTtl) {
      errors.push('TTL cannot be more than 28 days after scheduled time');
    }

    if (ttl <= now) {
      errors.push('TTL must be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate next retry attempt based on error code and retry policy
   */
  static calculateNextRetryAttempt(
    errorCode: RetryErrorCode,
    currentAttempt: number,
    lastAttemptAt: string,
    ttlDateTime: string
  ): { nextAttemptAt: string | null; shouldRetry: boolean } {
    // Check if TTL has expired
    if (this.isRetryTtlExpired(ttlDateTime)) {
      return { nextAttemptAt: null, shouldRetry: false };
    }

    const policy = DEFAULT_RETRY_POLICIES[errorCode];
    if (!policy) {
      return { nextAttemptAt: null, shouldRetry: false };
    }

    // Check if we have more retry intervals available
    if (currentAttempt >= policy.retryIntervals.length) {
      return { nextAttemptAt: null, shouldRetry: false };
    }

    const retryDelayHours = policy.retryIntervals[currentAttempt];
    const lastAttempt = new Date(lastAttemptAt);
    const nextAttempt = new Date(lastAttempt);
    nextAttempt.setHours(nextAttempt.getHours() + retryDelayHours);

    // Ensure next attempt is before TTL
    const ttl = new Date(ttlDateTime);
    if (nextAttempt > ttl) {
      return { nextAttemptAt: null, shouldRetry: false };
    }

    return {
      nextAttemptAt: nextAttempt.toISOString(),
      shouldRetry: true
    };
  }

  /**
   * Get retry policy for specific error code
   */
  static getRetryPolicy(errorCode: RetryErrorCode): RetryPolicy | null {
    return DEFAULT_RETRY_POLICIES[errorCode] || null;
  }

  /**
   * Check if template is active (for error code 132015)
   */
  static async isTemplateActive(templateId: string): Promise<boolean> {
    // This would integrate with the actual template service
    // For now, return true as a placeholder
    console.log(`Checking if template ${templateId} is active`);
    return true;
  }

  /**
   * Process retry attempt for a campaign
   */
  static async processRetryAttempt(
    campaignId: string,
    errorCode: RetryErrorCode,
    retryState: CampaignRetryState
  ): Promise<{
    shouldRetry: boolean;
    nextAttemptAt: string | null;
    reason: string;
  }> {
    const { retryConfig, attempts } = retryState;

    // Check if retry is enabled
    if (!retryConfig.enabled) {
      return {
        shouldRetry: false,
        nextAttemptAt: null,
        reason: 'Retry is disabled for this campaign'
      };
    }

    // Check if TTL has expired
    if (!retryConfig.ttlDateTime || this.isRetryTtlExpired(retryConfig.ttlDateTime)) {
      return {
        shouldRetry: false,
        nextAttemptAt: null,
        reason: 'Retry TTL has expired'
      };
    }

    const policy = this.getRetryPolicy(errorCode);
    if (!policy) {
      return {
        shouldRetry: false,
        nextAttemptAt: null,
        reason: `No retry policy found for error code ${errorCode}`
      };
    }

    // Special handling for template paused error (132015)
    if (errorCode === '132015' && policy.requiresTemplateActive) {
      const isActive = await this.isTemplateActive(campaignId);
      if (!isActive) {
        return {
          shouldRetry: false,
          nextAttemptAt: null,
          reason: 'Template is still paused, retry blocked'
        };
      }
    }

    const currentAttempt = attempts.length;
    const lastAttemptAt = retryState.lastAttemptAt || new Date().toISOString();

    const { nextAttemptAt, shouldRetry } = this.calculateNextRetryAttempt(
      errorCode,
      currentAttempt,
      lastAttemptAt,
      retryConfig.ttlDateTime
    );

    return {
      shouldRetry,
      nextAttemptAt,
      reason: shouldRetry 
        ? `Retry scheduled for ${nextAttemptAt}` 
        : 'No more retry attempts available or TTL expired'
    };
  }

  /**
   * Create initial retry state for a campaign
   */
  static createRetryState(
    campaignId: string,
    retryConfig: RetryTtlConfig
  ): CampaignRetryState {
    return {
      campaignId,
      retryConfig,
      attempts: [],
      isExpired: retryConfig.ttlDateTime ? this.isRetryTtlExpired(retryConfig.ttlDateTime) : false
    };
  }

  /**
   * Update retry state after an attempt
   */
  static updateRetryState(
    retryState: CampaignRetryState,
    attempt: RetryAttempt
  ): CampaignRetryState {
    const updatedAttempts = [...retryState.attempts, attempt];
    
    return {
      ...retryState,
      attempts: updatedAttempts,
      lastAttemptAt: attempt.executedAt || new Date().toISOString(),
      isExpired: retryState.retryConfig.ttlDateTime 
        ? this.isRetryTtlExpired(retryState.retryConfig.ttlDateTime) 
        : false
    };
  }

  /**
   * Get retry statistics for monitoring
   */
  static getRetryStats(retryState: CampaignRetryState): {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    pendingAttempts: number;
    isExpired: boolean;
    timeToExpiry?: number; // milliseconds
  } {
    const { attempts, retryConfig, isExpired } = retryState;
    
    const stats = {
      totalAttempts: attempts.length,
      successfulAttempts: attempts.filter(a => a.status === 'completed').length,
      failedAttempts: attempts.filter(a => a.status === 'failed').length,
      pendingAttempts: attempts.filter(a => a.status === 'pending').length,
      isExpired,
      timeToExpiry: undefined as number | undefined
    };

    if (retryConfig.ttlDateTime && !isExpired) {
      const ttl = new Date(retryConfig.ttlDateTime);
      const now = new Date();
      stats.timeToExpiry = ttl.getTime() - now.getTime();
    }

    return stats;
  }

  /**
   * Create unified TTL configuration for both retry engine and Meta API
   */
  static createUnifiedTtlConfig(
    campaignId: string,
    scheduledAt: string,
    retryTtl: string
  ): {
    retryEngineConfig: RetryTtlConfig;
    metaApiTtl: string;
    isValid: boolean;
    errors: string[];
  } {
    // Validate the unified TTL
    const validation = this.validateUnifiedTtl(retryTtl, scheduledAt);
    
    if (!validation.isValid) {
      return {
        retryEngineConfig: {
          enabled: false,
          ttlDateTime: undefined,
          scheduledDateTime: scheduledAt,
          stopOnConversion: true,
          stopOnManualPause: true,
          stopOnTemplateChange: true
        },
        metaApiTtl: retryTtl,
        isValid: false,
        errors: validation.errors
      };
    }

    // Create retry engine configuration
    const retryEngineConfig: RetryTtlConfig = {
      enabled: true,
      ttlDateTime: retryTtl, // Use unified TTL for retry engine
      scheduledDateTime: scheduledAt,
      stopOnConversion: true,
      stopOnManualPause: true,
      stopOnTemplateChange: true
    };

    return {
      retryEngineConfig,
      metaApiTtl: retryTtl, // Same TTL used for Meta API
      isValid: true,
      errors: []
    };
  }
}
