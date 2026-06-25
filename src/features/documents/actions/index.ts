'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Database } from '@/types/database'

const UploadDocumentSchema = z.object({
  caseId: z.string().uuid(),
  type: z.enum(['PSABirth', 'PSAMarriage', 'TOR', 'SF10', 'Diploma']),
  file: z.instanceof(File, { message: 'Valid file is required' })
    .refine((file) => file.size <= 50 * 1024 * 1024, 'File size must be less than 50MB')
    .refine(
      (file) => ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type),
      'Only PDF, JPEG, and PNG files are allowed'
    )
})

const DeleteDocumentSchema = z.object({
  documentId: z.string().uuid(),
  caseId: z.string().uuid()
})

export async function uploadDocument(formData: FormData) {
  const parsed = UploadDocumentSchema.safeParse({
    caseId: formData.get('caseId'),
    type: formData.get('type'),
    file: formData.get('file')
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const { caseId, type, file } = parsed.data
  const supabase = await createClient()

  // Generate a random UUID for the file to prevent collisions
  const documentId = crypto.randomUUID()
  const filePath = `cases/${caseId}/${documentId}-${file.name}`

  // 1. Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  // 2. Insert metadata record via RPC
  const { error: rpcError } = await supabase.rpc('upload_document_record', {
    p_case_id: caseId,
    p_type: type,
    p_file_path: filePath,
    p_file_name: file.name,
    p_file_size: file.size,
    p_mime_type: file.type
  })

  if (rpcError) {
    // Attempt rollback of file if DB fails
    await supabase.storage.from('documents').remove([filePath])
    throw new Error(`Database record failed: ${rpcError.message}`)
  }

  revalidatePath(`/cases/${caseId}`)
  return { success: true }
}

export async function deleteDocument(documentId: string, caseId: string) {
  const parsed = DeleteDocumentSchema.safeParse({ documentId, caseId })
  if (!parsed.success) {
    throw new Error('Invalid document or case ID')
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('delete_document', {
    p_document_id: parsed.data.documentId
  })

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }

  revalidatePath(`/cases/${parsed.data.caseId}`)
  return { success: true }
}

export async function getDocumentsByCase(caseId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

const SignedUrlsSchema = z.object({
  filePaths: z.array(z.string().min(1))
})

export async function getSignedUrlsForDocuments(filePaths: string[]) {
  const parsed = SignedUrlsSchema.safeParse({ filePaths })
  if (!parsed.success) {
    throw new Error('Invalid file paths format')
  }

  const supabase = await createClient()
  const { filePaths: paths } = parsed.data

  if (paths.length === 0) return {}

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrls(paths, 3600)

  if (error) {
    throw new Error(`Failed to generate signed URLs: ${error.message}`)
  }

  const urlMap: Record<string, string> = {}
  data.forEach((item) => {
    if (item.error) {
      console.error(`Error signing path ${item.path}:`, item.error)
    } else if (item.path && item.signedUrl) {
      urlMap[item.path] = item.signedUrl
    }
  })

  return urlMap
}

export async function getDocumentById(documentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

