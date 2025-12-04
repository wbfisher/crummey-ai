import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
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
      beneficiaryName: notice.recipient_email, // Send to email address
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
