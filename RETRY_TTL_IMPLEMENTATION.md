# Campaign Retry TTL Implementation

This document describes the implementation of the new **Retry TTL (Time To Live)** system that replaces the previous **Number of Retries** approach in the Campaign module's Schedule section.

## Overview

The new system uses a **time-bounded retry approach** where campaigns will retry failed attempts until a specified TTL (deadline) is reached, rather than limiting retries by count.

## Key Changes

### 1. UI Changes

#### Before (Number of Retries)
- Slider control for retry duration (1-7 days)
- Fixed 24-hour cadence
- Count-based retry limit

#### After (Retry TTL)
- **Date picker** for "Retry Until Date"
- **Time picker** for "Retry Until Time"
- **Default value**: Scheduled Date/Time + 7 days
- **Validation**: Min = Scheduled Date/Time, Max = Scheduled Date/Time + 7 days

### 2. Backend Changes

#### New Services
- **`RetryService`**: Core retry logic and TTL management
- **`RetryEngine`**: Automated retry processing engine
- **Enhanced `CampaignService`**: TTL-aware campaign management
- **Enhanced `SupabaseCampaignService`**: Database operations for TTL

#### Database Schema Updates
```sql
-- New fields added to campaigns table
retry_ttl TIMESTAMPTZ, -- When retry attempts should stop
scheduled_at TIMESTAMPTZ -- When the campaign was originally scheduled

-- New indexes for performance
CREATE INDEX idx_campaigns_retry_ttl ON campaigns(retry_ttl) WHERE retry_ttl IS NOT NULL;
CREATE INDEX idx_campaigns_scheduled_at ON campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;
```

### 3. Error-Specific Retry Policies

The system now implements different retry behaviors based on error codes:

#### Error Code 131049 (Frequency Cap / "Healthy Ecosystem")
- **Retry Intervals**: 12h, 24h, 48h (exponential backoff)
- **Behavior**: Respects frequency caps with increasing delays

#### Error Code 130472 (Experiment Group)
- **Retry Intervals**: 24h, 24h, 24h (fixed gaps)
- **Behavior**: Normal retry policy with consistent 24-hour intervals

#### Error Code 132015 (Template Paused)
- **Retry Intervals**: 24h (conditional)
- **Behavior**: Only retries after template becomes active again
- **Special Logic**: Polls template status before retry

## Implementation Details

### Core Types and Interfaces

```typescript
// New retry configuration
export interface RetryTtlConfig {
  enabled: boolean;
  ttlDateTime?: string; // ISO 8601 datetime string
  scheduledDateTime?: string; // ISO 8601 datetime string (base for TTL calculation)
  stopOnConversion: boolean;
  stopOnManualPause: boolean;
  stopOnTemplateChange: boolean;
}

// Error-specific retry policies
export type RetryErrorCode = '131049' | '130472' | '132015';

export interface RetryPolicy {
  errorCode: RetryErrorCode;
  description: string;
  retryIntervals: number[]; // Hours between retries
  requiresTemplateActive?: boolean; // For 132015
}
```

### Form Data Changes

```typescript
// Old fields (removed)
retryDuration: number;

// New fields (added)
retryTtlDate: Date | null;
retryTtlTime: string;
```

### Validation Logic

The system includes comprehensive validation:

1. **TTL Date Constraints**:
   - Must be between scheduled date and scheduled date + 7 days
   - Cannot be in the past
   - Required when retry is enabled

2. **Real-time Validation**:
   - Error messages display immediately
   - Calendar picker disables invalid dates
   - Form submission blocked if validation fails

### Retry Engine

The `RetryEngine` class provides:

- **Automated Processing**: Runs on configurable intervals (default: 1 minute)
- **Concurrent Retry Limits**: Configurable max concurrent retries (default: 10)
- **TTL Enforcement**: Automatically stops retries when TTL expires
- **Error-Specific Logic**: Applies different policies based on error codes
- **Monitoring**: Comprehensive retry statistics and logging

## Usage Examples

### 1. Setting Up Retry TTL in UI

```typescript
// User selects retry date (e.g., 3 days after scheduled date)
const scheduledDate = new Date('2025-09-15T14:00:00');
const retryTtlDate = new Date('2025-09-18T23:59:00');

updateFormData({
  retryEnabled: true,
  retryTtlDate: retryTtlDate,
  retryTtlTime: '11:59 PM'
});
```

### 2. Processing Retries in Backend

```typescript
// Start the retry engine
const retryEngine = new RetryEngine({
  maxConcurrentRetries: 10,
  retryCheckIntervalMs: 60000, // 1 minute
  enableLogging: true
});

retryEngine.start();

// The engine will automatically:
// 1. Find campaigns needing retry
// 2. Check TTL expiration
// 3. Apply error-specific policies
// 4. Execute retries within TTL bounds
```

### 3. Checking Retry Status

```typescript
// Get retry statistics
const stats = CampaignService.getRetryStatistics();
console.log(stats);
// Output: { campaignId: { totalAttempts: 2, isExpired: false, timeToExpiry: 86400000 } }

// Check if campaign retry is still active
const isActive = CampaignService.isRetryActive('campaign-123');
console.log(isActive); // true/false
```

## Migration from Legacy System

The system includes automatic migration logic:

```typescript
// Legacy data migration in normalizeCampaignData()
if (data.retryDuration && !data.retryTtlDate) {
  // Convert legacy retryDuration (days) to TTL date
  const scheduledDate = data.scheduledDate || new Date();
  const ttlDate = new Date(scheduledDate);
  ttlDate.setDate(ttlDate.getDate() + data.retryDuration);
  normalized.retryTtlDate = ttlDate;
  normalized.retryTtlTime = '11:59 PM';
}
```

## Monitoring and Logging

### Retry Statistics

The system provides comprehensive monitoring:

```typescript
interface RetryStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  pendingAttempts: number;
  isExpired: boolean;
  timeToExpiry?: number; // milliseconds
}
```

### Database Queries for Monitoring

```sql
-- Get campaigns with active retries
SELECT * FROM campaigns 
WHERE retry_ttl IS NOT NULL 
AND retry_ttl > NOW();

-- Get expired retry campaigns
SELECT * FROM campaigns 
WHERE retry_ttl IS NOT NULL 
AND retry_ttl < NOW();

-- Get retry statistics
SELECT 
  COUNT(*) FILTER (WHERE retry_ttl IS NOT NULL) as total_with_retry,
  COUNT(*) FILTER (WHERE retry_ttl > NOW()) as active_retries,
  COUNT(*) FILTER (WHERE retry_ttl < NOW()) as expired_retries
FROM campaigns;
```

## Benefits of TTL-Based Approach

1. **Time-Bounded Control**: Clear deadline for retry attempts
2. **Flexible Scheduling**: Users can set exact retry deadlines
3. **Resource Management**: Prevents indefinite retry loops
4. **Error-Specific Handling**: Different policies for different error types
5. **Better UX**: Intuitive date/time picker interface
6. **Monitoring**: Clear visibility into retry status and expiration

## Testing

### Manual Testing Scenarios

1. **TTL Validation**:
   - Try setting TTL before scheduled date (should fail)
   - Try setting TTL more than 7 days after scheduled date (should fail)
   - Set valid TTL within range (should succeed)

2. **Retry Execution**:
   - Create campaign with retry enabled
   - Simulate failure with different error codes
   - Verify error-specific retry intervals are applied
   - Verify retries stop when TTL expires

3. **UI Validation**:
   - Enable retry toggle (should auto-set default TTL)
   - Disable retry toggle (should clear TTL)
   - Change scheduled date (should validate TTL constraints)

### Automated Testing

The system includes comprehensive validation and error handling that can be tested programmatically through the service interfaces.

## Future Enhancements

1. **Template Status Integration**: Real-time template status checking for error 132015
2. **Advanced Retry Policies**: Configurable retry intervals per campaign
3. **Retry Analytics**: Detailed retry success/failure analytics
4. **Notification System**: Alerts when retries are exhausted or TTL expires
5. **Bulk Retry Management**: Operations to manage multiple campaign retries

## Conclusion

The new Retry TTL system provides a more flexible, time-bounded approach to campaign retries with error-specific handling and comprehensive monitoring capabilities. The implementation maintains backward compatibility while providing a superior user experience and better operational control.
