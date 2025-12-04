import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/client';
import { sendNoticeEmail } from '@/lib/email/send-notice';
import type { NoticeEmailData } from '@/types';

// POST /api/notices/send - Send pending notices
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { notice_ids } = body as { notice_ids?: string[] };

  // Build query for notices to send
  let query = supabase
    .from('notices')
    .select(`
      *,
      beneficiary:beneficiaries(*),
      trust:trusts(*),
      contribution:contributions(*)
    `)
    .eq('status', 'pending');

  if (notice_ids && notice_ids.length > 0) {
    query = query.in('id', notice_ids);
  }

  const { data: notices, error: fetchError } = await query;

  if (fetchError) {
    return NextResponse.json({ data: null, error: fetchError.message }, { status: 500 });
  }

  if (!notices || notices.length === 0) {
    return NextResponse.json({ data: { sent: 0, failed: 0 }, error: null });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const notice of notices) {
    const trust = notice.trust;
    const beneficiary = notice.beneficiary;
    const contribution = notice.contribution;

    // Verify user owns this trust
    if (trust.user_id !== user.id) {
      continue;
    }

    const emailData: NoticeEmailData = {
      trustName: trust.name,
      trustDate: formatDate(trust.trust_date),
      beneficiaryName: notice.recipient_name,
      noticeDate: formatDate(notice.notice_date),
      contributionDate: formatDate(contribution.contribution_date),
      withdrawalAmount: parseFloat(notice.withdrawal_amount),
      withdrawalDeadline: formatDate(notice.withdrawal_deadline),
      trusteeName: trust.trustee_name,
      trusteeEmail: trust.trustee_email,
      trusteePhone: trust.trustee_phone,
      trusteeAddress: [
        trust.trustee_address,
        trust.trustee_city,
        trust.trustee_state,
        trust.trustee_zip,
      ].filter(Boolean).join(', '),
      acknowledgmentUrl: `${appUrl}/acknowledge/${notice.acknowledgment_token}`,
    };

    const result = await sendNoticeEmail({
      ...emailData,
      beneficiaryName: notice.recipient_email, // Override for actual sending
    });

    if (result.success) {
      // Update notice status
      await supabase
        .from('notices')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', notice.id);

      // Log audit event
      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'notice_sent',
        entity_type: 'notice',
        entity_id: notice.id,
        details: { recipient: notice.recipient_email, messageId: result.messageId },
      });

      results.sent++;
    } else {
      results.failed++;
      results.errors.push(`${notice.recipient_name}: ${result.error}`);
    }
  }

  return NextResponse.json({ data: results, error: null });
}

// GET /api/notices - List notices
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const trustId = request.nextUrl.searchParams.get('trust_id');
  const status = request.nextUrl.searchParams.get('status');
  const contributionId = request.nextUrl.searchParams.get('contribution_id');

  let query = supabase
    .from('notices')
    .select(`
      *,
      beneficiary:beneficiaries(id, full_name, email),
      trust:trusts(id, name),
      contribution:contributions(id, amount, contribution_date)
    `)
    .order('created_at', { ascending: false });

  if (trustId) {
    query = query.eq('trust_id', trustId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (contributionId) {
    query = query.eq('contribution_id', contributionId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
