-- migration: 20260625000000_phase5_extraction_layer.sql
-- Description: Sets up document extraction layer (extractions and fields), storage bucket for applicant documents, and related enums/RLS.

BEGIN;

-- =========================================================================
-- 1. Create Enums
-- =========================================================================

DO $$ BEGIN
    CREATE TYPE extraction_status AS ENUM ('Pending', 'Processing', 'Extracted', 'NeedsReview', 'Reviewed', 'Failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE extraction_review_status AS ENUM ('Unreviewed', 'PartiallyReviewed', 'Reviewed', 'Rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE field_status AS ENUM ('Extracted', 'NeedsReview', 'Accepted', 'Corrected', 'Rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =========================================================================
-- 2. Create Tables
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.document_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    status extraction_status NOT NULL DEFAULT 'Pending',
    raw_text TEXT,
    extraction_method TEXT,
    confidence_score NUMERIC,
    review_status extraction_review_status NOT NULL DEFAULT 'Unreviewed',
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doc_extractions_case_id ON public.document_extractions(case_id);
CREATE INDEX idx_doc_extractions_document_id ON public.document_extractions(document_id);

CREATE TABLE IF NOT EXISTS public.document_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    document_extraction_id UUID NOT NULL REFERENCES public.document_extractions(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    raw_value TEXT,
    normalized_value TEXT,
    reviewed_value TEXT,
    final_value TEXT,
    status field_status NOT NULL DEFAULT 'Extracted',
    confidence_score NUMERIC,
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doc_fields_case_id ON public.document_fields(case_id);
CREATE INDEX idx_doc_fields_document_id ON public.document_fields(document_id);
CREATE INDEX idx_doc_fields_extraction_id ON public.document_fields(document_extraction_id);

-- =========================================================================
-- 3. Enable RLS
-- =========================================================================

ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_fields ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 4. RLS Policies for document_extractions
-- =========================================================================

CREATE POLICY "Reviewers select document_extractions" ON public.document_extractions
    FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers insert document_extractions" ON public.document_extractions
    FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers update document_extractions" ON public.document_extractions
    FOR UPDATE TO authenticated
    USING (public.get_user_role() IN ('Admin', 'Reviewer'))
    WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers delete document_extractions" ON public.document_extractions
    FOR DELETE TO authenticated
    USING (public.get_user_role() = 'Admin');

-- =========================================================================
-- 5. RLS Policies for document_fields
-- =========================================================================

CREATE POLICY "Reviewers select document_fields" ON public.document_fields
    FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers insert document_fields" ON public.document_fields
    FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers update document_fields" ON public.document_fields
    FOR UPDATE TO authenticated
    USING (public.get_user_role() IN ('Admin', 'Reviewer'))
    WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers delete document_fields" ON public.document_fields
    FOR DELETE TO authenticated
    USING (public.get_user_role() = 'Admin');

-- =========================================================================
-- 6. Storage Configuration (applicant_documents bucket)
-- =========================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('applicant_documents', 'applicant_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Drop old policies if they exist (just in case)
DROP POLICY IF EXISTS "Allow select for applicant_documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow insert for applicant_documents bucket" ON storage.objects;

-- Allow Admins and Reviewers to view objects in the applicant_documents bucket
CREATE POLICY "Allow select for applicant_documents bucket" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'applicant_documents' AND public.get_user_role() IN ('Admin', 'Reviewer'));

-- Allow Admins and Reviewers to upload objects in the applicant_documents bucket
CREATE POLICY "Allow insert for applicant_documents bucket" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'applicant_documents' AND public.get_user_role() IN ('Admin', 'Reviewer'));

-- Omitting DELETE policy for storage.objects as done in Phase 4.

COMMIT;
