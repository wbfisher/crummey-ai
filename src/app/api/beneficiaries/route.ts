import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { BeneficiaryFormInput } from '@/types';

// GET /api/beneficiaries - List beneficiaries for a trust
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const trustId = request.nextUrl.searchParams.get('trust_id');

  if (!trustId) {
    return NextResponse.json({ data: null, error: 'trust_id is required' }, { status: 400 });
  }

  // Verify user owns this trust
  const { data: trust } = await supabase
    .from('trusts')
    .select('id')
    .eq('id', trustId)
    .eq('user_id', user.id)
    .single();

  if (!trust) {
    return NextResponse.json({ data: null, error: 'Trust not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('beneficiaries')
    .select('*')
    .eq('trust_id', trustId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}

// POST /api/beneficiaries - Add a beneficiary to a trust
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const body: BeneficiaryFormInput = await request.json();

  // Validate required fields
  if (!body.trust_id || !body.full_name || !body.email) {
    return NextResponse.json(
      { data: null, error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Validate minor fields
  if (body.is_minor && (!body.guardian_name || !body.guardian_email)) {
    return NextResponse.json(
      { data: null, error: 'Guardian information required for minors' },
      { status: 400 }
    );
  }

  // Verify user owns this trust
  const { data: trust } = await supabase
    .from('trusts')
    .select('id')
    .eq('id', body.trust_id)
    .eq('user_id', user.id)
    .single();

  if (!trust) {
    return NextResponse.json({ data: null, error: 'Trust not found' }, { status: 404 });
  }

  const { data: beneficiary, error } = await supabase
    .from('beneficiaries')
    .insert({
      trust_id: body.trust_id,
      full_name: body.full_name,
      email: body.email,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      zip: body.zip || null,
      is_minor: body.is_minor || false,
      guardian_name: body.guardian_name || null,
      guardian_email: body.guardian_email || null,
      share_percentage: body.share_percentage || 100,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  // Log audit event
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'beneficiary_created',
    entity_type: 'beneficiary',
    entity_id: beneficiary.id,
    details: { name: body.full_name, trust_id: body.trust_id },
  });

  return NextResponse.json({ data: beneficiary, error: null });
}

// PUT /api/beneficiaries - Update a beneficiary
export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ data: null, error: 'Beneficiary ID required' }, { status: 400 });
  }

  const { data: beneficiary, error } = await supabase
    .from('beneficiaries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: beneficiary, error: null });
}

// DELETE /api/beneficiaries - Deactivate a beneficiary
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ data: null, error: 'Beneficiary ID required' }, { status: 400 });
  }

  // Soft delete - mark as inactive
  const { error } = await supabase
    .from('beneficiaries')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true }, error: null });
}
