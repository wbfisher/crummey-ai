import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
      trust:trusts(id, name, user_id),
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

  // Filter to only show notices for user's trusts
  const userNotices = data?.filter((n: any) => n.trust?.user_id === user.id) || [];

  return NextResponse.json({ data: userNotices, error: null });
}
