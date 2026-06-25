import { PageContainer } from "@/components/layouts/PageContainer"
import { getCaseById } from "@/features/cases/actions"
import { getDocumentById, getSignedUrlsForDocuments } from "@/features/documents/actions"
import { getExtractionByDocumentId } from "@/features/extractions/actions"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ExtractionWorkspace } from "@/features/extractions/components/ExtractionWorkspace"

export default async function DocumentReviewPage({ params }: { params: { id: string, documentId: string } }) {
  const caseData = await getCaseById(params.id)
  const document = await getDocumentById(params.documentId)

  if (!caseData || !document) return notFound()

  const extraction = await getExtractionByDocumentId(document.id)

  // Get signed URL for document viewer
  const urls = await getSignedUrlsForDocuments([document.file_path])
  const documentUrl = urls[document.file_path] || null

  return (
    <PageContainer>
      <Link href={`/cases/${caseData.id}`} className="mb-md inline-flex items-center gap-xs text-small font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft size={16} /> Back to Case {caseData.id.slice(0, 8)}
      </Link>

      <div className="mb-xl flex items-center justify-between">
        <div>
          <h1 className="text-title font-semibold text-text-primary">Document Review</h1>
          <p className="text-small text-text-secondary mt-xs">{document.file_name} ({document.type})</p>
        </div>
      </div>

      <ExtractionWorkspace 
        document={document} 
        documentUrl={documentUrl} 
        extraction={extraction} 
      />
    </PageContainer>
  )
}
