'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export async function getExtractionByDocumentId(documentId: string) {
  const supabase = await createClient()
  
  // Get the latest extraction
  const { data: extraction, error: extError } = await supabase
    .from('document_extractions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (extError && extError.code !== 'PGRST116') { // PGRST116 is no rows returned
    throw new Error(`Failed to fetch extraction: ${extError.message}`)
  }

  if (!extraction) return null

  // Get the fields
  const { data: fields, error: fieldError } = await supabase
    .from('document_fields')
    .select('*')
    .eq('document_extraction_id', extraction.id)
    .order('created_at', { ascending: true })

  if (fieldError) {
    throw new Error(`Failed to fetch fields: ${fieldError.message}`)
  }

  return {
    ...extraction,
    fields: fields || []
  }
}

const UpdateFieldSchema = z.object({
  fieldId: z.string().uuid(),
  reviewedValue: z.string().nullable(),
  status: z.enum(['NeedsReview', 'Accepted', 'Corrected', 'Rejected']),
  path: z.string()
})

export async function updateDocumentField(params: z.infer<typeof UpdateFieldSchema>) {
  const parsed = UpdateFieldSchema.safeParse(params)
  if (!parsed.success) throw new Error('Invalid field update payload')

  const { fieldId, reviewedValue, status, path } = parsed.data
  const supabase = await createClient()

  // In real implementation we should get user id
  const { data: auth } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('document_fields')
    .update({
      reviewed_value: reviewedValue,
      status: status,
      reviewed_by: auth.user?.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', fieldId)

  if (error) throw new Error(error.message)

  revalidatePath(path)
  return { success: true }
}

export async function mockRunExtraction(documentId: string, caseId: string, documentType: string) {
  const supabase = await createClient()
  
  // Mock inserting an extraction
  const { data: extraction, error: extError } = await supabase
    .from('document_extractions')
    .insert({
      case_id: caseId,
      document_id: documentId,
      document_type: documentType,
      status: 'NeedsReview',
      raw_text: 'Mock OCR Text: Full Name Juan Dela Cruz, Address Davao City.',
      extraction_method: 'MockEngineV1',
      review_status: 'Unreviewed'
    })
    .select()
    .single()

  if (extError) throw new Error(extError.message)

  // Mock inserting fields based on document type
  const mockFields = [
    { field_name: 'firstName', raw_value: 'Juan' },
    { field_name: 'lastName', raw_value: 'Dela Cruz' },
    { field_name: 'dateOfBirth', raw_value: '01/01/2000' }
  ]

  const fieldsToInsert = mockFields.map(f => ({
    case_id: caseId,
    document_id: documentId,
    document_extraction_id: extraction.id,
    field_name: f.field_name,
    raw_value: f.raw_value,
    normalized_value: f.raw_value, // For mock, normalized is same
    status: 'NeedsReview'
  }))

  const { error: fieldError } = await supabase
    .from('document_fields')
    .insert(fieldsToInsert)

  if (fieldError) throw new Error(fieldError.message)

  revalidatePath(`/cases/${caseId}/documents/${documentId}`)
  return { success: true }
}
