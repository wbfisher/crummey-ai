import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import type { TrustFormInput } from '@/types';

// GET /api/trusts - List all trusts for authenticated user
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('trusts')
    .select(`
      *,
      beneficiaries:beneficiaries(count),
      contributions:contributions(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}

// POST /api/trusts - Create a new trust
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const body: TrustFormInput = await request.json();

  // Validate required fields
  if (!body.name || !body.trust_date || !body.trustee_name || !body.trustee_email) {
    return NextResponse.json(
      { data: null, error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const { data: trust, error } = await supabase
    .from('trusts')
    .insert({
      user_id: user.id,
      name: body.name,
      trust_date: body.trust_date,
      trust_type: body.trust_type || 'ILIT',
      trustee_name: body.trustee_name,
      trustee_address: body.trustee_address || null,
      trustee_city: body.trustee_city || null,
      trustee_state: body.trustee_state || null,
      trustee_zip: body.trustee_zip || null,
      trustee_phone: body.trustee_phone || null,
      trustee_email: body.trustee_email,
      withdrawal_period_days: body.withdrawal_period_days || 30,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  // Log audit event
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'trust_created',
    entity_type: 'trust',
    entity_id: trust.id,
    details: { name: body.name },
  });

  return NextResponse.json({ data: trust, error: null });
}
