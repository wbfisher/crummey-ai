import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import type { ContributionFormInput, ApiResponse, Contribution } from '@/types';

// GET /api/contributions - List contributions for a trust
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const trustId = request.nextUrl.searchParams.get('trust_id');
  
  let query = supabase
    .from('contributions')
    .select(`
      *,
      trust:trusts(id, name),
      notices(id, status, recipient_name, acknowledged_at)
    `)
    .order('contribution_date', { ascending: false });

  if (trustId) {
    query = query.eq('trust_id', trustId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}

// POST /api/contributions - Create a new contribution (triggers notice generation via DB trigger)
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const body: ContributionFormInput = await request.json();

  // Validate trust ownership
  const { data: trust, error: trustError } = await supabase
    .from('trusts')
    .select('id, user_id')
    .eq('id', body.trust_id)
    .single();

  if (trustError || !trust) {
    return NextResponse.json({ data: null, error: 'Trust not found' }, { status: 404 });
  }

  if (trust.user_id !== user.id) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 403 });
  }

  // Check that trust has active beneficiaries
  const { count } = await supabase
    .from('beneficiaries')
    .select('id', { count: 'exact', head: true })
    .eq('trust_id', body.trust_id)
    .eq('is_active', true);

  if (!count || count === 0) {
    return NextResponse.json(
      { data: null, error: 'Trust has no active beneficiaries. Add beneficiaries before recording contributions.' },
      { status: 400 }
    );
  }

  // Create contribution (DB trigger will auto-generate notices)
  const { data: contribution, error: insertError } = await supabase
    .from('contributions')
    .insert({
      trust_id: body.trust_id,
      amount: body.amount,
      contribution_date: body.contribution_date,
      description: body.description || null,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ data: null, error: insertError.message }, { status: 500 });
  }

  // Log audit event
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'contribution_created',
    entity_type: 'contribution',
    entity_id: contribution.id,
    details: { amount: body.amount, trust_id: body.trust_id },
  });

  // Fetch the created notices
  const { data: notices } = await supabase
    .from('notices')
    .select('*')
    .eq('contribution_id', contribution.id);

  return NextResponse.json({
    data: { contribution, notices },
    error: null,
  });
}
