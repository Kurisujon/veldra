'use client'

import React, { useTransition } from 'react'
import { deleteDocument } from '../actions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Database } from '@/types/database'

type DocumentRow = Database['public']['Tables']['documents']['Row']

export function DocumentList({ documents, caseId }: { documents: DocumentRow[], caseId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    startTransition(async () => {
      try {
        await deleteDocument(documentId, caseId)
      } catch (err: any) {
        alert(err.message || 'Failed to delete document')
      }
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!documents || documents.length === 0) {
    return (
      <Card className="p-xl mb-xl">
        <div className="text-center text-text-secondary text-small py-md">
          No documents uploaded yet.
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-xl mb-xl">
      <h3 className="text-heading font-semibold text-text-primary mb-lg">Uploaded Documents</h3>
      <div className="flex flex-col gap-md">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between p-md border border-background rounded-card hover:bg-background transition-colors">
            <div className="flex flex-col gap-xs">
              <div className="flex items-center gap-md">
                <span className="font-medium text-text-primary text-body">{doc.file_name}</span>
                <Badge variant="primary">{doc.type}</Badge>
              </div>
              <div className="flex items-center gap-md text-small text-text-secondary">
                <span>{formatFileSize(doc.file_size)}</span>
                <span>•</span>
                <span>Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-sm">
              <Button 
                variant="primary" 
                onClick={() => window.location.href = `/cases/${caseId}/documents/${doc.id}`}
              >
                Review Data
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => handleDelete(doc.id)}
                disabled={isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
