// Database types - matches Supabase schema

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trust {
  id: string;
  user_id: string;
  name: string;
  trust_date: string;
  trust_type: 'ILIT' | 'Gift Trust' | 'Other';
  trustee_name: string;
  trustee_address: string | null;
  trustee_city: string | null;
  trustee_state: string | null;
  trustee_zip: string | null;
  trustee_phone: string | null;
  trustee_email: string;
  withdrawal_period_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Beneficiary {
  id: string;
  trust_id: string;
  full_name: string;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  is_minor: boolean;
  guardian_name: string | null;
  guardian_email: string | null;
  share_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contribution {
  id: string;
  trust_id: string;
  amount: number;
  contribution_date: string;
  description: string | null;
  notices_generated: boolean;
  notices_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export type NoticeStatus = 'pending' | 'sent' | 'delivered' | 'bounced' | 'acknowledged';

export interface Notice {
  id: string;
  contribution_id: string;
  beneficiary_id: string;
  trust_id: string;
  notice_date: string;
  withdrawal_amount: number;
  withdrawal_deadline: string;
  recipient_email: string;
  recipient_name: string;
  status: NoticeStatus;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  acknowledgment_token: string;
  acknowledged_at: string | null;
  acknowledged_by_name: string | null;
  acknowledged_ip: string | null;
  acknowledged_user_agent: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: 'trust' | 'beneficiary' | 'contribution' | 'notice';
  entity_id: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Extended types with relations
export interface TrustWithBeneficiaries extends Trust {
  beneficiaries: Beneficiary[];
}

export interface ContributionWithNotices extends Contribution {
  notices: Notice[];
  trust: Trust;
}

export interface NoticeWithDetails extends Notice {
  beneficiary: Beneficiary;
  trust: Trust;
  contribution: Contribution;
}

// Form input types
export interface TrustFormInput {
  name: string;
  trust_date: string;
  trust_type: Trust['trust_type'];
  trustee_name: string;
  trustee_address?: string;
  trustee_city?: string;
  trustee_state?: string;
  trustee_zip?: string;
  trustee_phone?: string;
  trustee_email: string;
  withdrawal_period_days: number;
}

export interface BeneficiaryFormInput {
  trust_id: string;
  full_name: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  is_minor: boolean;
  guardian_name?: string;
  guardian_email?: string;
  share_percentage: number;
}

export interface ContributionFormInput {
  trust_id: string;
  amount: number;
  contribution_date: string;
  description?: string;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
}

// Notice summary for dashboard
export interface NoticeSummary {
  trust_id: string;
  trust_name: string;
  contribution_id: string;
  contribution_amount: number;
  contribution_date: string;
  total_notices: number;
  acknowledged_count: number;
  sent_count: number;
  pending_count: number;
}

// Email template data
export interface NoticeEmailData {
  trustName: string;
  trustDate: string;
  beneficiaryName: string;
  noticeDate: string;
  contributionDate: string;
  withdrawalAmount: number;
  withdrawalDeadline: string;
  trusteeName: string;
  trusteeEmail: string;
  trusteePhone: string | null;
  trusteeAddress: string;
  acknowledgmentUrl: string;
}
