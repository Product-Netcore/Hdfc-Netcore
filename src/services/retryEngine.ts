import { RetryService, CampaignRetryState, RetryAttempt } from './retryService';
import { CampaignService } from './campaignService';
import { RetryErrorCode, DEFAULT_RETRY_POLICIES } from '@/types/campaign';

export interface RetryEngineConfig {
  maxConcurrentRetries: number;
  retryCheckIntervalMs: number;
  enableLogging: boolean;
}

export interface RetryExecutionResult {
  campaignId: string;
  success: boolean;
  errorCode?: RetryErrorCode;
  message: string;
  nextRetryAt?: string;
}

export class RetryEngine {
  private config: RetryEngineConfig;
  private isRunning: boolean = false;
  private retryInterval: NodeJS.Timeout | null = null;

  constructor(config: RetryEngineConfig = {
    maxConcurrentRetries: 10,
    retryCheckIntervalMs: 60000, // 1 minute
    enableLogging: true
  }) {
    this.config = config;
  }

  /**
   * Start the retry engine
   */
  start(): void {
    if (this.isRunning) {
      this.log('Retry engine is already running');
      return;
    }

    this.isRunning = true;
    this.log('Starting retry engine');
    
    this.retryInterval = setInterval(() => {
      this.processRetries();
    }, this.config.retryCheckIntervalMs);
  }

  /**
   * Stop the retry engine
   */
  stop(): void {
    if (!this.isRunning) {
      this.log('Retry engine is not running');
      return;
    }

    this.isRunning = false;
    this.log('Stopping retry engine');
    
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }

  /**
   * Process pending retries
   */
  private async processRetries(): Promise<void> {
    try {
      const campaignsForRetry = CampaignService.getCampaignsForRetry();
      
      if (campaignsForRetry.length === 0) {
        return;
      }

      this.log(`Processing ${campaignsForRetry.length} campaigns for retry`);

      // Limit concurrent retries
      const batchSize = Math.min(campaignsForRetry.length, this.config.maxConcurrentRetries);
      const batch = campaignsForRetry.slice(0, batchSize);

      const retryPromises = batch.map(({ campaignId, retryState }) => 
        this.executeCampaignRetry(campaignId, retryState)
      );

      const results = await Promise.allSettled(retryPromises);
      
      results.forEach((result, index) => {
        const { campaignId } = batch[index];
        if (result.status === 'rejected') {
          this.log(`Retry execution failed for campaign ${campaignId}: ${result.reason}`);
        }
      });

    } catch (error) {
      this.log(`Error in retry processing: ${error}`);
    }
  }

  /**
   * Execute retry for a specific campaign
   */
  private async executeCampaignRetry(
    campaignId: string, 
    retryState: CampaignRetryState
  ): Promise<RetryExecutionResult> {
    try {
      this.log(`Executing retry for campaign ${campaignId}`);

      // Simulate campaign execution (in real implementation, this would call the actual campaign service)
      const executionResult = await this.simulateCampaignExecution(campaignId);
      
      const attempt: RetryAttempt = {
        attemptNumber: retryState.attempts.length + 1,
        scheduledAt: new Date().toISOString(),
        executedAt: new Date().toISOString(),
        status: executionResult.success ? 'completed' : 'failed',
        errorCode: executionResult.errorCode
      };

      // Update retry state
      CampaignService.updateRetryAttempt(campaignId, attempt);

      if (executionResult.success) {
        this.log(`Campaign ${campaignId} executed successfully on retry attempt ${attempt.attemptNumber}`);
        return {
          campaignId,
          success: true,
          message: `Campaign executed successfully on attempt ${attempt.attemptNumber}`
        };
      }

      // Handle failure - determine next retry
      if (executionResult.errorCode) {
        const retryDecision = await RetryService.processRetryAttempt(
          campaignId,
          executionResult.errorCode,
          retryState
        );

        if (retryDecision.shouldRetry && retryDecision.nextAttemptAt) {
          // Update next attempt time
          const updatedState = CampaignService.getRetryState(campaignId);
          if (updatedState) {
            updatedState.nextAttemptAt = retryDecision.nextAttemptAt;
          }

          this.log(`Campaign ${campaignId} scheduled for next retry at ${retryDecision.nextAttemptAt}`);
          
          return {
            campaignId,
            success: false,
            errorCode: executionResult.errorCode,
            message: retryDecision.reason,
            nextRetryAt: retryDecision.nextAttemptAt
          };
        } else {
          this.log(`Campaign ${campaignId} retry exhausted: ${retryDecision.reason}`);
          
          return {
            campaignId,
            success: false,
            errorCode: executionResult.errorCode,
            message: `Retry exhausted: ${retryDecision.reason}`
          };
        }
      }

      return {
        campaignId,
        success: false,
        message: 'Campaign execution failed with unknown error'
      };

    } catch (error) {
      this.log(`Error executing retry for campaign ${campaignId}: ${error}`);
      
      return {
        campaignId,
        success: false,
        message: `Retry execution error: ${error}`
      };
    }
  }

  /**
   * Simulate campaign execution (replace with actual implementation)
   */
  private async simulateCampaignExecution(campaignId: string): Promise<{
    success: boolean;
    errorCode?: RetryErrorCode;
    message: string;
  }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate different outcomes based on campaign ID for testing
    const random = Math.random();
    
    if (random < 0.3) {
      // 30% success rate
      return {
        success: true,
        message: 'Campaign executed successfully'
      };
    } else if (random < 0.5) {
      // 20% frequency cap error
      return {
        success: false,
        errorCode: '131049',
        message: 'Frequency cap exceeded'
      };
    } else if (random < 0.7) {
      // 20% experiment group error
      return {
        success: false,
        errorCode: '130472',
        message: 'User in experiment group'
      };
    } else {
      // 30% template paused error
      return {
        success: false,
        errorCode: '132015',
        message: 'Template is paused'
      };
    }
  }

  /**
   * Get retry engine status
   */
  getStatus(): {
    isRunning: boolean;
    config: RetryEngineConfig;
    pendingRetries: number;
    retryStatistics: { [campaignId: string]: any };
  } {
    const pendingRetries = CampaignService.getCampaignsForRetry().length;
    const retryStatistics = CampaignService.getRetryStatistics();

    return {
      isRunning: this.isRunning,
      config: this.config,
      pendingRetries,
      retryStatistics
    };
  }

  /**
   * Manually trigger retry processing (for testing)
   */
  async triggerRetryProcessing(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Retry engine is not running');
    }
    
    await this.processRetries();
  }

  /**
   * Get error-specific retry policy information
   */
  static getRetryPolicyInfo(): typeof DEFAULT_RETRY_POLICIES {
    return DEFAULT_RETRY_POLICIES;
  }

  /**
   * Validate retry configuration
   */
  static validateRetryConfig(ttlDateTime: string, scheduledDateTime: string): {
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

    // Check TTL constraints
    if (ttl <= scheduled) {
      errors.push('TTL must be after scheduled time');
    }

    const maxTtl = new Date(scheduled);
    maxTtl.setDate(maxTtl.getDate() + 7);
    
    if (ttl > maxTtl) {
      errors.push('TTL cannot be more than 7 days after scheduled time');
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
   * Log messages if logging is enabled
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[RetryEngine] ${new Date().toISOString()}: ${message}`);
    }
  }
}
