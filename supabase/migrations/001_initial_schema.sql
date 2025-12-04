-- Crummey Notice Manager Database Schema
-- Run this in Supabase SQL Editor or via migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRUSTS
-- ============================================
CREATE TABLE public.trusts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Trust details
    name TEXT NOT NULL,
    trust_date DATE NOT NULL,
    trust_type TEXT DEFAULT 'ILIT',

    -- Trustee info (sender of notices)
    trustee_name TEXT NOT NULL,
    trustee_address TEXT,
    trustee_city TEXT,
    trustee_state TEXT,
    trustee_zip TEXT,
    trustee_phone TEXT,
    trustee_email TEXT NOT NULL,

    -- Crummey settings
    withdrawal_period_days INTEGER DEFAULT 30,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trusts_user_id ON public.trusts(user_id);

-- ============================================
-- BENEFICIARIES
-- ============================================
CREATE TABLE public.beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trust_id UUID NOT NULL REFERENCES public.trusts(id) ON DELETE CASCADE,

    -- Beneficiary info
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,

    -- Minor handling
    is_minor BOOLEAN DEFAULT FALSE,
    guardian_name TEXT,
    guardian_email TEXT,

    -- Withdrawal share (for pro-rata calculations)
    share_percentage DECIMAL(5,2) DEFAULT 100.00,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_beneficiaries_trust_id ON public.beneficiaries(trust_id);

-- ============================================
-- CONTRIBUTIONS (Gifts to the trust)
-- ============================================
CREATE TABLE public.contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trust_id UUID NOT NULL REFERENCES public.trusts(id) ON DELETE CASCADE,

    -- Contribution details
    amount DECIMAL(12,2) NOT NULL,
    contribution_date DATE NOT NULL,
    description TEXT,

    -- Recurring contribution fields
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency TEXT DEFAULT 'none', -- 'none', 'monthly', 'quarterly', 'annually'
    recurring_end_date DATE,
    parent_contribution_id UUID REFERENCES public.contributions(id),

    -- Tracking
    notices_generated BOOLEAN DEFAULT FALSE,
    notices_generated_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contributions_trust_id ON public.contributions(trust_id);
CREATE INDEX idx_contributions_parent ON public.contributions(parent_contribution_id);
CREATE INDEX idx_contributions_recurring ON public.contributions(is_recurring, recurring_frequency) WHERE is_recurring = TRUE;

-- ============================================
-- NOTICES
-- ============================================
CREATE TABLE public.notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contribution_id UUID NOT NULL REFERENCES public.contributions(id) ON DELETE CASCADE,
    beneficiary_id UUID NOT NULL REFERENCES public.beneficiaries(id) ON DELETE CASCADE,
    trust_id UUID NOT NULL REFERENCES public.trusts(id) ON DELETE CASCADE,

    -- Notice details
    notice_date DATE NOT NULL,
    withdrawal_amount DECIMAL(12,2) NOT NULL,
    withdrawal_deadline DATE NOT NULL,

    -- Delivery tracking
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,

    -- Status
    status TEXT DEFAULT 'pending', -- pending, sent, delivered, bounced, acknowledged

    -- Email tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,

    -- Acknowledgment
    acknowledgment_token UUID DEFAULT uuid_generate_v4(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by_name TEXT,
    acknowledged_ip TEXT,
    acknowledged_user_agent TEXT,

    -- PDF storage
    pdf_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notices_contribution_id ON public.notices(contribution_id);
CREATE INDEX idx_notices_beneficiary_id ON public.notices(beneficiary_id);
CREATE INDEX idx_notices_trust_id ON public.notices(trust_id);
CREATE INDEX idx_notices_status ON public.notices(status);
CREATE UNIQUE INDEX idx_notices_ack_token ON public.notices(acknowledgment_token);

-- ============================================
-- AUDIT LOG (for compliance)
-- ============================================
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),

    -- What happened
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,

    -- Details
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Trusts: users can only see/edit their own
CREATE POLICY "Users can view own trusts" ON public.trusts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create trusts" ON public.trusts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trusts" ON public.trusts
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trusts" ON public.trusts
    FOR DELETE USING (auth.uid() = user_id);

-- Beneficiaries: users can manage beneficiaries of their trusts
CREATE POLICY "Users can view beneficiaries of own trusts" ON public.beneficiaries
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.trusts WHERE trusts.id = beneficiaries.trust_id AND trusts.user_id = auth.uid())
    );
CREATE POLICY "Users can create beneficiaries for own trusts" ON public.beneficiaries
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.trusts WHERE trusts.id = trust_id AND trusts.user_id = auth.uid())
    );
CREATE POLICY "Users can update beneficiaries of own trusts" ON public.beneficiaries
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.trusts WHERE trusts.id = beneficiaries.trust_id AND trusts.user_id = auth.uid())
    );
CREATE POLICY "Users can delete beneficiaries of own trusts" ON public.beneficiaries
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.trusts WHERE trusts.id = beneficiaries.trust_id AND trusts.user_id = auth.uid())
    );

-- Contributions: users can manage contributions to their trusts
CREATE POLICY "Users can view contributions to own trusts" ON public.contributions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.trusts WHERE trusts.id = contributions.trust_id AND trusts.user_id = auth.uid())
    );
CREATE POLICY "Users can create contributions to own trusts" ON public.contributions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.trusts WHERE trusts.id = trust_id AND trusts.user_id = auth.uid())
    );
CREATE POLICY "Users can update contributions to own trusts" ON public.contributions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.trusts WHERE trusts.id = contributions.trust_id AND trusts.user_id = auth.uid())
    );

-- Notices: users can view/manage notices for their trusts
CREATE POLICY "Users can view notices for own trusts" ON public.notices
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.trusts WHERE trusts.id = notices.trust_id AND trusts.user_id = auth.uid())
    );
CREATE POLICY "Users can create notices for own trusts" ON public.notices
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.trusts WHERE trusts.id = trust_id AND trusts.user_id = auth.uid())
    );
CREATE POLICY "Users can update notices for own trusts" ON public.notices
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.trusts WHERE trusts.id = notices.trust_id AND trusts.user_id = auth.uid())
    );

-- Service role bypass for acknowledgments (public users with token)
CREATE POLICY "Service role can update notices" ON public.notices
    FOR UPDATE USING (true) WITH CHECK (true);

-- Audit log: users can view their own logs
CREATE POLICY "Users can view own audit logs" ON public.audit_log
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Anyone can insert audit logs" ON public.audit_log
    FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to auto-generate notices when contribution is created
CREATE OR REPLACE FUNCTION generate_notices_for_contribution()
RETURNS TRIGGER AS $$
DECLARE
    ben RECORD;
    trust_rec RECORD;
    withdrawal_amt DECIMAL(12,2);
    deadline DATE;
BEGIN
    -- Get trust details
    SELECT * INTO trust_rec FROM public.trusts WHERE id = NEW.trust_id;

    -- Calculate deadline
    deadline := NEW.contribution_date + trust_rec.withdrawal_period_days;

    -- Create notice for each active beneficiary
    FOR ben IN
        SELECT * FROM public.beneficiaries
        WHERE trust_id = NEW.trust_id AND is_active = TRUE
    LOOP
        -- Calculate withdrawal amount (pro-rata share)
        withdrawal_amt := LEAST(
            NEW.amount * (ben.share_percentage / 100),
            18000.00  -- 2024 annual exclusion amount (update annually)
        );

        INSERT INTO public.notices (
            contribution_id,
            beneficiary_id,
            trust_id,
            notice_date,
            withdrawal_amount,
            withdrawal_deadline,
            recipient_email,
            recipient_name,
            status
        ) VALUES (
            NEW.id,
            ben.id,
            NEW.trust_id,
            NEW.contribution_date,
            withdrawal_amt,
            deadline,
            COALESCE(ben.guardian_email, ben.email),
            COALESCE(ben.guardian_name, ben.full_name),
            'pending'
        );
    END LOOP;

    -- Mark contribution as processed
    UPDATE public.contributions
    SET notices_generated = TRUE, notices_generated_at = NOW()
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate notices
CREATE TRIGGER trigger_generate_notices
    AFTER INSERT ON public.contributions
    FOR EACH ROW
    EXECUTE FUNCTION generate_notices_for_contribution();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_trusts_updated_at BEFORE UPDATE ON public.trusts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_beneficiaries_updated_at BEFORE UPDATE ON public.beneficiaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON public.contributions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON public.notices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VIEWS (for reporting)
-- ============================================

CREATE VIEW public.notice_summary AS
SELECT
    t.id AS trust_id,
    t.name AS trust_name,
    t.user_id,
    c.id AS contribution_id,
    c.amount AS contribution_amount,
    c.contribution_date,
    COUNT(n.id) AS total_notices,
    COUNT(CASE WHEN n.status = 'acknowledged' THEN 1 END) AS acknowledged_count,
    COUNT(CASE WHEN n.status = 'sent' THEN 1 END) AS sent_count,
    COUNT(CASE WHEN n.status = 'pending' THEN 1 END) AS pending_count
FROM public.trusts t
JOIN public.contributions c ON c.trust_id = t.id
LEFT JOIN public.notices n ON n.contribution_id = c.id
GROUP BY t.id, t.name, t.user_id, c.id, c.amount, c.contribution_date;
