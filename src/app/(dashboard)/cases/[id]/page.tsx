import { PageContainer } from "@/components/layouts/PageContainer";
import { Card } from "@/components/ui/Card";
import { getCaseById } from "@/features/cases/actions";
import { getDocumentsByCase } from "@/features/documents/actions";
import { CaseStatusBadge } from "@/features/cases/components/CaseStatusBadge";
import { DocumentUpload } from "@/features/documents/components/DocumentUpload";
import { DocumentList } from "@/features/documents/components/DocumentList";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getFindingsByCase, getCurrentUserRole } from "@/features/findings/actions";
import { getDraftsByCase } from "@/features/drafts/actions";
import { CaseFindingsWorkspace } from "@/features/findings/components/CaseFindingsWorkspace";
import { RunAnalysisButton } from "@/features/findings/components/RunAnalysisButton";
import { DraftEditor } from "@/features/drafts/components/DraftEditor";
import { GenerateDraftsButton } from "@/features/drafts/components/GenerateDraftsButton";
import { getExportsByCase } from "@/features/exports/actions";
import { ExportWorkspace } from "@/features/exports/components/ExportWorkspace";


export default async function CaseDetailsPage({ params }: { params: { id: string } }) {
  let caseData: Awaited<ReturnType<typeof getCaseById>> | undefined;
  let documents: Awaited<ReturnType<typeof getDocumentsByCase>> = [];
  let findings: Awaited<ReturnType<typeof getFindingsByCase>> = [];
  let drafts: Awaited<ReturnType<typeof getDraftsByCase>> = [];
  let exports: Awaited<ReturnType<typeof getExportsByCase>> = [];
  let userRole = 'Reviewer';

  try {
    caseData = await getCaseById(params.id);
    documents = await getDocumentsByCase(params.id);
    userRole = await getCurrentUserRole();

    if (caseData && caseData.status === 'NeedsReview') {
      findings = await getFindingsByCase(params.id);
    }
    if (caseData && (caseData.status === 'DraftGenerated' || caseData.status === 'Reviewed' || caseData.status === 'ReadyForExport' || caseData.status === 'Exported')) {
      drafts = await getDraftsByCase(params.id);
    }
    if (caseData && (caseData.status === 'ReadyForExport' || caseData.status === 'Exported' || caseData.status === 'Reviewed' || caseData.status === 'DraftGenerated')) {
      exports = await getExportsByCase(params.id);
    }
  } catch (e) {
    return notFound();
  }

  if (!caseData) return notFound();

  const applicant = caseData.applicants?.[0];
  const isDraftPhase = caseData.status === 'DraftGenerated' || caseData.status === 'Reviewed' || caseData.status === 'ReadyForExport' || caseData.status === 'Exported';
  const isExportPhase = caseData.status === 'ReadyForExport' || caseData.status === 'Exported' || caseData.status === 'Reviewed' || caseData.status === 'DraftGenerated';

  return (
    <PageContainer>
      <Link href="/cases" className="mb-md inline-flex items-center gap-xs text-small font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft size={16} /> Back to Cases
      </Link>

      <div className="mb-xl flex items-center justify-between">
        <div>
          <h1 className="text-title font-semibold text-text-primary">Case Details</h1>
          <p className="text-small text-text-secondary mt-xs">ID: {caseData.id}</p>
        </div>
        <div className="flex items-center gap-md">
          <RunAnalysisButton caseId={caseData.id} />
          {caseData.status === 'Reviewed' && (
            <GenerateDraftsButton caseId={caseData.id} />
          )}
          <CaseStatusBadge status={caseData.status} />
        </div>
      </div>

      <Card className="p-xl mb-xl">
        <h2 className="text-heading font-semibold text-text-primary mb-md">Applicant Information</h2>
        <div className="grid grid-cols-2 gap-md md:grid-cols-3">
          <div>
            <p className="text-small text-text-secondary">First Name</p>
            <p className="text-body font-medium text-text-primary">{applicant?.first_name}</p>
          </div>
          <div>
            <p className="text-small text-text-secondary">Last Name</p>
            <p className="text-body font-medium text-text-primary">{applicant?.last_name}</p>
          </div>
          <div>
            <p className="text-small text-text-secondary">Date of Birth</p>
            <p className="text-body font-medium text-text-primary">{applicant?.date_of_birth}</p>
          </div>
        </div>
      </Card>



      {/* Phase 7: Export Workspace */}
      {isExportPhase && (
        <ExportWorkspace caseId={caseData.id} exports={exports} />
      )}

      {/* Phase 6: Draft Generation workspace */}
      {isDraftPhase && (
        <div className="flex flex-col gap-xl mb-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-heading font-semibold text-text-primary">Legal Drafts</h2>
              <p className="text-small text-text-secondary mt-xs">
                {drafts.length > 0
                  ? `${drafts.length} draft${drafts.length !== 1 ? 's' : ''} generated. Review, edit, and finalize before export.`
                  : 'No drafts generated yet. Click "Generate Drafts" to begin.'}
              </p>
            </div>
          </div>
          {drafts.length > 0 && (
            <div className="flex flex-col gap-lg">
              {drafts.map((draft) => (
                <DraftEditor
                  key={draft.id}
                  draft={{
                    id: draft.id,
                    case_id: draft.case_id ?? caseData.id,
                    type: draft.type as 'Affidavit' | 'AddressLetter' | 'GapLetter',
                    content: draft.content,
                    status: draft.status as 'Draft' | 'Finalized',
                    created_at: draft.created_at
                  }}
                  findingCount={draft.findingIds.length}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Phase 5: Findings Workspace */}
      {caseData.status === 'NeedsReview' ? (
        <CaseFindingsWorkspace
          caseId={caseData.id}
          findings={findings}
          documents={documents}
          userRole={userRole}
        />
      ) : (
        !isDraftPhase && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
            <DocumentUpload caseId={caseData.id} documents={documents} />
            <DocumentList documents={documents} caseId={caseData.id} />
          </div>
        )
      )}
    </PageContainer>
  );
}
