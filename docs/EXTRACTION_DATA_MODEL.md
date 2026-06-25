# Extraction Data Model

## Overview
This document defines how Veldra stores extracted document data between the raw `Document` upload layer and the downstream `Finding` / `GeneratedDraft` systems.

Veldra accepts uploaded PDF, JPG, and PNG files as raw source documents. These files must pass through an extraction and review layer before they can be safely used by the Comparison Engine or Draft Generation system.

This document introduces the canonical entities for:
- raw extracted text
- structured extracted fields
- normalized comparison-ready values
- reviewer-corrected values
- extraction and field review statuses

The goal is to ensure that Findings and Generated Drafts are based on traceable, reviewable data rather than directly on raw files or transient OCR output.

---

# 1. Architectural Position

## Existing high-level relationship
A `Case` contains many uploaded `Document` records.

However, a `Document` only represents the uploaded file and its metadata:
- file path
- file name
- mime type
- file size
- uploader
- upload status

The `Document` entity is **not** the correct place to store all extracted and reviewed comparison data.

To support review, comparison, and draft generation, Veldra requires a dedicated extraction layer between `Document` and `Finding`.

---

# 2. Core Extraction Entities

Veldra introduces two new entities:

1. **DocumentExtraction**
2. **DocumentField**

These entities sit between `Document` and `Finding`.

---

# 3. DocumentExtraction

## Purpose
Represents a single extraction run for an uploaded `Document`.

This record stores:
- the raw extracted text from the file
- the extraction method used
- the extraction lifecycle status
- optional extraction confidence / quality metadata
- the current review state of the extracted document data

A `Document` may have one active extraction record, or multiple historical extraction runs if reprocessing is supported later.

## Required Fields
- `id`
- `caseId`
- `documentId`
- `documentType`
- `status`
- `rawText`
- `extractionMethod`
- `createdAt`
- `updatedAt`

## Optional Fields
- `confidenceScore`
- `reviewStatus`
- `reviewedAt`
- `reviewedBy`
- `notes`
- `errorMessage`

## Relationships
- Belongs To: `Case`
- Belongs To: `Document`
- Has Many: `DocumentField`

## Suggested Status Enum
- `Pending` — file uploaded but extraction has not started
- `Processing` — extraction currently running
- `Extracted` — extraction completed successfully
- `NeedsReview` — extraction completed but requires reviewer inspection
- `Reviewed` — extraction reviewed and accepted for comparison use
- `Failed` — extraction failed

## Suggested Review Status Enum
- `Unreviewed`
- `PartiallyReviewed`
- `Reviewed`
- `Rejected`

---

# 4. DocumentField

## Purpose
Represents a single extracted field from a `DocumentExtraction`.

This is the core unit used by the review workspace and comparison engine.  
Each field stores:
- the raw extracted value
- a normalized value for comparison
- an optional reviewer-corrected value
- a final approved value to be used by Findings / Drafts

## Required Fields
- `id`
- `caseId`
- `documentId`
- `documentExtractionId`
- `fieldName`
- `rawValue`
- `status`
- `createdAt`
- `updatedAt`

## Optional Fields
- `normalizedValue`
- `reviewedValue`
- `finalValue`
- `confidenceScore`
- `reviewNotes`
- `reviewedAt`
- `reviewedBy`

## Relationships
- Belongs To: `Case`
- Belongs To: `Document`
- Belongs To: `DocumentExtraction`

## Example `fieldName` values
- `firstName`
- `middleName`
- `lastName`
- `dateOfBirth`
- `address`
- `institution`
- `graduationDate`
- `enrollmentDate`
- `documentNumber`

---

# 5. Field Value Layers

Each `DocumentField` can contain multiple representations of the same field.

## 5.1 `rawValue`
The direct extracted value from OCR / parser output.

Example:
- `"Brgy. Obrero, Davao Cty"`

## 5.2 `normalizedValue`
A machine-normalized version of the raw value used for comparison logic.

Example:
- `"Barangay Obrero, Davao City"`

## 5.3 `reviewedValue`
A reviewer-corrected value entered manually if extraction was inaccurate.

Example:
- `"Barangay Obrero, Davao City"`

## 5.4 `finalValue`
The canonical value used by downstream systems.

This should follow the rule:
1. use `reviewedValue` if present and accepted
2. else use `normalizedValue` if accepted
3. else use `rawValue` only if explicitly allowed and not rejected

---

# 6. Field Status Lifecycle

Each `DocumentField` should track its own review state.

## Suggested Field Status Enum
- `Extracted`
- `NeedsReview`
- `Accepted`
- `Corrected`
- `Rejected`

## Meaning
- **Extracted**: field was produced by the extraction process
- **NeedsReview**: field is low-confidence or flagged for human inspection
- **Accepted**: reviewer accepted the extracted/normalized value
- **Corrected**: reviewer manually changed the value
- **Rejected**: field should not be used for comparison or generation

---

# 7. Comparison Source-of-Truth Rule

The Comparison Engine must not compare raw uploaded files directly.

It must compare `DocumentField.finalValue` records.

## Comparison input priority
For every comparable field, the engine should use:

1. `reviewedValue` if field status is `Corrected` or reviewer accepted the correction
2. `normalizedValue` if field status is `Accepted`
3. `rawValue` only if the field is accepted and no better value exists

This ensures Findings are based on stable, reviewable field data.

---

# 8. Relationship to Findings

A `Finding` represents a discrepancy detected by the Comparison Engine.  
It must be traceable to the exact field values that produced it.

## Requirement
Each `Finding` should link not only to `sourceDocuments`, but also to the specific compared fields.

## Recommended supporting relation
Introduce a join structure such as:

### `FindingFieldReference`
- `id`
- `findingId`
- `documentFieldId`
- `documentId`
- `role` (`source_a`, `source_b`, `supporting`)

This allows the review UI to show the exact conflicting field values that caused a finding.

---

# 9. Relationship to GeneratedDraft

Generated drafts must use accepted findings and reviewer-approved field data.

A draft should never depend directly on raw OCR text if reviewed field data exists.

## Draft source-of-truth order
1. Accepted / corrected `DocumentField.finalValue`
2. Accepted `Finding`
3. Case / Applicant metadata

---

# 10. Example Data Flow

## Step 1 — Upload
A reviewer uploads:
- PSA Birth Certificate
- TOR
- Diploma

These create `Document` records.

## Step 2 — Extraction
Each uploaded file creates a `DocumentExtraction` record:
- raw text captured
- extraction status updated

## Step 3 — Field structuring
The system creates `DocumentField` rows such as:
- `firstName`
- `lastName`
- `dateOfBirth`
- `address`
- `institution`

## Step 4 — Review
The reviewer inspects extracted values:
- accepts correct values
- edits incorrect values
- marks some fields for rejection

## Step 5 — Comparison
The Comparison Engine compares `finalValue` across documents.

## Step 6 — Findings
If a mismatch is detected, a `Finding` is created and linked to:
- source documents
- source fields

## Step 7 — Draft generation
Accepted Findings trigger `GeneratedDraft` creation using:
- final approved field values
- finding metadata
- case/applicant information

---

# 11. Why This Layer Exists

This extraction layer is required because Veldra must support:
- raw uploads from PDFs and images
- OCR / parser imperfections
- human review and correction
- traceable discrepancy generation
- safe draft generation from approved data

Without `DocumentExtraction` and `DocumentField`, the system would have no stable source of truth between uploaded files and findings.

---

# 12. Summary

Veldra’s document-processing pipeline should be modeled as:

`Case`
→ `Document`
→ `DocumentExtraction`
→ `DocumentField`
→ `Finding`
→ `GeneratedDraft`
→ `ExportPackage`

This is the canonical data flow for document verification and draft generation.

The Comparison Engine must consume reviewed field-level data, not raw files.  
The Draft Generation system must consume accepted Findings and final approved field values, not transient extraction output.
