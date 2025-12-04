import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { headers } from 'next/headers';

// GET /api/acknowledge/[token] - Get notice details for acknowledgment page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
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
      withdrawal_amount: parseFloat(notice.withdrawal_amount),
      withdrawal_deadline: notice.withdrawal_deadline,
      status: notice.status,
      acknowledged_at: notice.acknowledged_at,
    },
    error: null,
  });
}

// POST /api/acknowledge/[token] - Submit acknowledgment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Get request metadata
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';

  // Parse request body
  const body = await request.json();
  const { signature_name } = body as { signature_name: string };

  if (!signature_name || signature_name.trim().length < 2) {
    return NextResponse.json(
      { data: null, error: 'Please provide your full name' },
      { status: 400 }
    );
  }

  // Fetch the notice
  const { data: notice, error: fetchError } = await supabase
    .from('notices')
    .select('id, status, acknowledged_at, trust_id')
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
    return NextResponse.json(
      { data: null, error: 'This notice has already been acknowledged' },
      { status: 400 }
    );
  }

  // Update the notice with acknowledgment
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from('notices')
    .update({
      status: 'acknowledged',
      acknowledged_at: now,
      acknowledged_by_name: signature_name.trim(),
      acknowledged_ip: ip,
      acknowledged_user_agent: userAgent,
    })
    .eq('id', notice.id)
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
    .single();

  if (updateError) {
    return NextResponse.json(
      { data: null, error: 'Failed to save acknowledgment' },
      { status: 500 }
    );
  }

  // Log audit event
  await supabase.from('audit_log').insert({
    user_id: null, // Public action
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
      id: updated.id,
      trust_name: updated.trust?.name,
      recipient_name: updated.recipient_name,
      notice_date: updated.notice_date,
      withdrawal_amount: parseFloat(updated.withdrawal_amount),
      withdrawal_deadline: updated.withdrawal_deadline,
      status: updated.status,
      acknowledged_at: updated.acknowledged_at,
    },
    error: null,
  });
}
