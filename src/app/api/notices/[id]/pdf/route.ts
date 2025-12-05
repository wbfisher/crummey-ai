import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateNoticePDF } from '@/lib/pdf/generate-notice';
import type { NoticeEmailData } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/notices/[id]/pdf - Generate and download PDF for a notice
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch notice with all related data
  const { data: notice, error } = await supabase
    .from('notices')
    .select(`
      *,
      beneficiary:beneficiaries(*),
      trust:trusts(*),
      contribution:contributions(*)
    `)
    .eq('id', id)
    .single();

  if (error || !notice) {
    return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
  }

  // Verify user owns this trust
  if (notice.trust.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const emailData: NoticeEmailData = {
    trustName: notice.trust.name,
    trustDate: formatDate(notice.trust.trust_date),
    beneficiaryName: notice.recipient_name,
    noticeDate: formatDate(notice.notice_date),
    contributionDate: formatDate(notice.contribution.contribution_date),
    withdrawalAmount: parseFloat(notice.withdrawal_amount),
    withdrawalDeadline: formatDate(notice.withdrawal_deadline),
    trusteeName: notice.trust.trustee_name,
    trusteeEmail: notice.trust.trustee_email,
    trusteePhone: notice.trust.trustee_phone,
    trusteeAddress: [
      notice.trust.trustee_address,
      notice.trust.trustee_city,
      notice.trust.trustee_state,
      notice.trust.trustee_zip,
    ].filter(Boolean).join(', '),
    acknowledgmentUrl: `${appUrl}/acknowledge/${notice.acknowledgment_token}`,
  };

  try {
    const pdfBuffer = await generateNoticePDF(emailData);

    // Create filename
    const filename = `crummey-notice-${notice.recipient_name.replace(/[^a-zA-Z0-9]/g, '-')}-${notice.notice_date}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
