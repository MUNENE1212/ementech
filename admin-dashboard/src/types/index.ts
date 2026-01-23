/**
 * Type definitions for the EmenTech Admin Dashboard
 * These types align with the backend API models
 */

// ============= User & Employee Types =============
export interface User {
  _id: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  companyEmail?: CompanyEmail;
  role: 'admin' | 'manager' | 'employee';
  permissions?: Permission[];
  status: 'active' | 'inactive' | 'pending';
  phone?: string;
  jobTitle?: string;
  department?: string;
  hireDate?: string;
  reportsTo?: string;
  avatar?: string;
  assignedLeads?: AssignedLead[];
  maxLeadCapacity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyEmail {
  address: string;
  configured: boolean;
  configuredAt?: string;
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface AssignedLead {
  leadId: string;
  assignedAt: string;
  status: string;
}

// ============= Lead Types =============
export interface Lead {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  source?: string;
  tags?: string[];
  score?: number;
  assignedTo?: string;
  estimatedValue?: number;
  probability?: number;
  notes?: string;
  lastContacted?: string;
  nextFollowUp?: string;
  interactions?: number;
  activeSequences?: ActiveSequence[];
  completedSequences?: CompletedSequence[];
  createdAt: string;
  updatedAt: string;
}

export interface ActiveSequence {
  sequenceId: string;
  status: 'active' | 'paused';
  stepIndex: number;
  lastEmailSentAt?: string;
  nextEmailAt?: string;
  enrolledAt: string;
}

export interface CompletedSequence {
  sequenceId: string;
  status: 'completed' | 'unsubscribed';
  finalStepIndex: number;
  completedAt: string;
}

// ============= Campaign Types =============
export interface Campaign {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  type: 'one-time' | 'recurring' | 'automated' | 'drip' | 'transactional';
  category?: string;
  templateId?: string;
  subject?: string;
  preheader?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled' | 'failed';
  audience?: AudienceConfig;
  schedule?: ScheduleConfig;
  abTestConfig?: ABTestConfig;
  budget?: BudgetConfig;
  metrics?: CampaignMetrics;
  statusHistory?: StatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface AudienceConfig {
  segments?: string[];
  filters?: AudienceFilter[];
  exclude?: {
    leads?: string[];
    tags?: string[];
    pipelineStages?: string[];
  };
  estimatedSize?: number;
}

export interface AudienceFilter {
  field: string;
  operator: 'eq' | 'ne' | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'between' | 'exists';
  value?: any;
  values?: any[];
}

export interface ScheduleConfig {
  sendAt?: string;
  timezone?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval?: number;
    days?: number[];
    endDate?: string;
  };
  cron?: string;
}

export interface ABTestConfig {
  enabled: boolean;
  variants?: CampaignVariant[];
  winnerCriteria?: 'open_rate' | 'click_rate' | 'conversion_rate' | 'revenue';
  autoSelectWinner?: boolean;
  minSampleSize?: number;
  testDuration?: number;
}

export interface CampaignVariant {
  variantId: string;
  name: string;
  weight: number;
  subject?: string;
  preheader?: string;
  templateId?: string;
}

export interface BudgetConfig {
  currency: string;
  estimatedCost?: number;
  actualCost?: number;
  budget?: number;
}

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  bounces: number;
  complaints: number;
  unsubscribes: number;
  conversions: number;
  revenue: number;
}

export interface StatusHistory {
  status: string;
  changedAt: string;
  changedBy?: string;
  reason?: string;
}

// ============= Template Types =============
export interface EmailTemplate {
  _id: string;
  name: string;
  slug?: string;
  category?: string;
  type: 'marketing' | 'transactional' | 'automated';
  subject: string;
  preheader?: string;
  htmlBody: string;
  plainTextBody?: string;
  variables?: TemplateVariable[];
  triggerType?: string;
  triggerConfig?: any;
  design?: DesignConfig;
  status: 'draft' | 'active' | 'paused' | 'archived';
  isVariant?: boolean;
  parentTemplate?: string;
  variantId?: string;
  variantWeight?: number;
  metrics?: TemplateMetrics;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'url';
  defaultValue?: string;
  required: boolean;
  description?: string;
}

export interface DesignConfig {
  layout?: string;
  primaryColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  showSocialLinks?: boolean;
}

export interface TemplateMetrics {
  sent: number;
  opens: number;
  clicks: number;
  bounces: number;
  unsubscribes: number;
  conversions: number;
  revenue: number;
}

// ============= Sequence Types =============
export interface Sequence {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  type: 'drip' | 'nurture' | 'onboarding' | 're-engagement' | 'welcome' | 'educational' | 'promotional' | 'abandoned-cart' | 'custom';
  status: 'draft' | 'active' | 'paused' | 'archived';
  steps: SequenceStep[];
  triggerType: string;
  triggerConfig?: any;
  enrollmentSettings?: EnrollmentSettings;
  unsubscribeSettings?: UnsubscribeSettings;
  scheduling?: SchedulingSettings;
  goal?: GoalConfig;
  metrics?: SequenceMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceStep {
  order: number;
  name: string;
  templateId: string;
  delay: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
  conditions?: StepCondition[];
  sendAt?: string;
}

export interface StepCondition {
  field: string;
  operator: string;
  value?: any;
  onMatch: 'proceed' | 'skip' | 'pause';
}

export interface EnrollmentSettings {
  autoEnroll: boolean;
  segment?: string;
  requireTag?: string;
}

export interface UnsubscribeSettings {
  behavior: 'immediate' | 'sequence_only' | 'wait_until_end';
}

export interface SchedulingSettings {
  timezone?: string;
  preferredSendTime?: string;
  allowedSendDays?: number[];
  skipWeekends?: boolean;
  skipHolidays?: boolean;
}

export interface GoalConfig {
  type: 'engagement' | 'conversion' | 'retention' | 'revenue' | 'response' | 'custom';
  targetValue?: number;
}

export interface SequenceMetrics {
  enrolled: number;
  active: number;
  completed: number;
  unsubscribed: number;
  totalEmailsSent: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  completionRate: number;
}

// ============= A/B Test Types =============
export interface ABTest {
  _id: string;
  name: string;
  type: 'subject_line' | 'content' | 'sender' | 'send_time' | 'template' | 'landing_page' | 'multivariate';
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  variants: ABTestVariant[];
  campaignId?: string;
  sequenceId?: string;
  templateId?: string;
  trafficAllocationStrategy: 'equal' | 'weighted' | 'thompson_sampling' | 'epsilon_greedy';
  winnerCriteria?: 'open_rate' | 'click_rate' | 'conversion_rate' | 'revenue';
  confidenceLevel: number;
  minSampleSize?: number;
  startAt?: string;
  endAt?: string;
  minRunTime?: number;
  maxDuration?: number;
  winnerDeclared?: boolean;
  winnerVariantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ABTestVariant {
  variantId: string;
  name: string;
  weight: number;
  config: any;
  metrics: ABTestVariantMetrics;
}

export interface ABTestVariantMetrics {
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

// ============= Social Media Types =============
export interface SocialAccount {
  _id: string;
  platform: 'linkedin' | 'twitter';
  platformAccountId: string;
  name: string;
  username?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'error' | 'needs_reauth';
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  apiCallsRemaining?: number;
  apiResetAt?: string;
  webhookUrl?: string;
  assignedTo?: string;
  accountType: 'company' | 'personal';
  allowedRoles?: string[];
  allowedUsers?: string[];
  metrics?: SocialAccountMetrics;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialAccountMetrics {
  followers: number;
  following?: number;
  postsCount: number;
  engagementRate: number;
}

export interface SocialPost {
  _id: string;
  platform: 'linkedin' | 'twitter';
  accountId: string;
  type: 'text' | 'image' | 'video' | 'link' | 'carousel' | 'poll';
  content: string;
  media?: MediaAttachment[];
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'deleted';
  scheduledFor?: string;
  publishedAt?: string;
  campaignId?: string;
  sequenceId?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  analytics?: SocialPostAnalytics;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAttachment {
  type: 'image' | 'video';
  url: string;
  altText?: string;
  uploadStatus: 'pending' | 'uploaded' | 'failed';
}

export interface SocialPostAnalytics {
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  impressions: number;
  engagementRate: number;
}

// ============= Analytics Types =============
export interface AnalyticsOverview {
  leads: {
    total: number;
    new: number;
    growthRate: number;
  };
  email: {
    sent: number;
    openRate: number;
    clickRate: number;
    deliveryRate: number;
  };
  sequences: {
    active: number;
    enrolled: number;
    completionRate: number;
  };
  social: {
    posts: number;
    totalEngagement: number;
    engagementRate: number;
  };
  revenue: {
    total: number;
    growthRate: number;
    roi: number;
  };
}

export interface LeadAnalytics {
  bySource: Record<string, number>;
  byPipelineStage: Record<string, number>;
  byScore: {
    low: number;
    medium: number;
    high: number;
  };
  assignment: {
    assigned: number;
    unassigned: number;
    byEmployee: Record<string, number>;
  };
  timeMetrics: {
    avgResponseTime: number;
    avgConversionTime: number;
  };
}

export interface FunnelAnalytics {
  stages: {
    stage: string;
    count: number;
    conversionRate: number;
    dropOff: number;
    avgTimeInStage: number;
  }[];
  overallConversionRate: number;
  totalLeads: number;
}

// ============= API Response Types =============
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============= Auth Types =============
export interface AuthUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions?: Permission[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ============= Form Types =============
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  [key: string]: any;
}

// ============= Filter Types =============
export interface LeadFilters extends PaginationParams, FilterParams {
  assignedTo?: string;
  source?: string;
  score?: { min?: number; max?: number };
  tags?: string[];
}

export interface CampaignFilters extends PaginationParams {
  search?: string;
  status?: string;
  type?: string;
  category?: string;
}

export interface SequenceFilters extends PaginationParams {
  search?: string;
  status?: string;
  type?: string;
  triggerType?: string;
}

export interface TemplateFilters extends PaginationParams {
  search?: string;
  status?: string;
  category?: string;
  type?: string;
}

export interface SocialFilters extends PaginationParams {
  search?: string;
  platform?: string;
  status?: string;
  accountId?: string;
}

export interface EmployeeFilters extends PaginationParams {
  search?: string;
  role?: string;
  status?: string;
  department?: string;
}
