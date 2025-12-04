import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET /api/acknowledge/[token] - Get notice details for acknowledgment
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: notice, error } = await supabase
    .from('notices')
    .select(`
      id,
      notice_date,
      withdrawal_amount,
      withdrawal_deadline,
      recipient_name,
      status,
      acknowledged_at,
      trust:trusts(name)
    `)
    .eq('acknowledgment_token', token)
    .single();

  if (error || !notice) {
    return NextResponse.json(
      { data: null, error: 'Notice not found or invalid token' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data: {
      id: notice.id,
      trust_name: notice.trust?.name,
      recipient_name: notice.recipient_name,
      notice_date: notice.notice_date,
      withdrawal_amount: notice.withdrawal_amount,
      withdrawal_deadline: notice.withdrawal_deadline,
      status: notice.status,
      acknowledged_at: notice.acknowledged_at,
    },
    error: null,
  });
}

// POST /api/acknowledge/[token] - Submit acknowledgment
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  const supabase = createAdminClient();
  const headersList = await headers();

  const body = await request.json();
  const { signature_name } = body as { signature_name: string };

  if (!signature_name || !signature_name.trim()) {
    return NextResponse.json(
      { data: null, error: 'Signature name is required' },
      { status: 400 }
    );
  }

  // Get the notice
  const { data: notice, error: fetchError } = await supabase
    .from('notices')
    .select(`
      id,
      notice_date,
      withdrawal_amount,
      withdrawal_deadline,
      recipient_name,
      status,
      acknowledged_at,
      trust_id,
      trust:trusts(name)
    `)
    .eq('acknowledgment_token', token)
    .single();

  if (fetchError || !notice) {
    return NextResponse.json(
      { data: null, error: 'Notice not found or invalid token' },
      { status: 404 }
    );
  }

  // Check if already acknowledged
  if (notice.status === 'acknowledged' || notice.acknowledged_at) {
    return NextResponse.json({
      data: {
        id: notice.id,
        trust_name: notice.trust?.name,
        recipient_name: notice.recipient_name,
        notice_date: notice.notice_date,
        withdrawal_amount: notice.withdrawal_amount,
        withdrawal_deadline: notice.withdrawal_deadline,
        status: 'acknowledged',
        acknowledged_at: notice.acknowledged_at,
      },
      error: null,
    });
  }

  // Get client info
  const ip = headersList.get('x-forwarded-for') ||
             headersList.get('x-real-ip') ||
             'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';

  // Update notice
  const { error: updateError } = await supabase
    .from('notices')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
      acknowledged_by_name: signature_name.trim(),
      acknowledged_ip: ip,
      acknowledged_user_agent: userAgent,
    })
    .eq('id', notice.id);

  if (updateError) {
    return NextResponse.json(
      { data: null, error: 'Failed to record acknowledgment' },
      { status: 500 }
    );
  }

  // Log audit event
  await supabase.from('audit_log').insert({
    action: 'notice_acknowledged',
    entity_type: 'notice',
    entity_id: notice.id,
    details: {
      signature_name: signature_name.trim(),
      trust_id: notice.trust_id,
    },
    ip_address: ip,
    user_agent: userAgent,
  });

  return NextResponse.json({
    data: {
      id: notice.id,
      trust_name: notice.trust?.name,
      recipient_name: notice.recipient_name,
      notice_date: notice.notice_date,
      withdrawal_amount: notice.withdrawal_amount,
      withdrawal_deadline: notice.withdrawal_deadline,
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
    },
    error: null,
  });
}
