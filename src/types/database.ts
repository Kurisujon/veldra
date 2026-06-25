import { SupabaseClient } from '@supabase/supabase-js';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      cases: {
        Row: {
          id: string;
          status: Database['public']['Enums']['case_status'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          status?: Database['public']['Enums']['case_status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          status?: Database['public']['Enums']['case_status'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      applicants: {
        Row: {
          id: string;
          case_id: string;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          first_name?: string;
          last_name?: string;
          date_of_birth?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applicants_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          }
        ];
      };
      documents: {
        Row: {
          id: string;
          case_id: string;
          type: 'PSABirth' | 'PSAMarriage' | 'TOR' | 'SF10' | 'Diploma';
          file_path: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          status: string;
          uploaded_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          type: 'PSABirth' | 'PSAMarriage' | 'TOR' | 'SF10' | 'Diploma';
          file_path: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          status?: string;
          uploaded_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          type?: 'PSABirth' | 'PSAMarriage' | 'TOR' | 'SF10' | 'Diploma';
          file_path?: string;
          file_name?: string;
          file_size?: number;
          mime_type?: string;
          status?: string;
          uploaded_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          }
        ];
      };
      findings: {
        Row: {
          id: string;
          case_id: string;
          title: string;
          description: string;
          severity: Database['public']['Enums']['finding_severity'];
          category: Database['public']['Enums']['finding_category'];
          status: Database['public']['Enums']['finding_status'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          title: string;
          description: string;
          severity: Database['public']['Enums']['finding_severity'];
          category: Database['public']['Enums']['finding_category'];
          status?: Database['public']['Enums']['finding_status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          title?: string;
          description?: string;
          severity?: Database['public']['Enums']['finding_severity'];
          category?: Database['public']['Enums']['finding_category'];
          status?: Database['public']['Enums']['finding_status'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "findings_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          }
        ];
      };
      finding_documents: {
        Row: {
          finding_id: string;
          document_id: string;
        };
        Insert: {
          finding_id: string;
          document_id: string;
        };
        Update: {
          finding_id?: string;
          document_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "finding_documents_finding_id_fkey";
            columns: ["finding_id"];
            isOneToOne: false;
            referencedRelation: "findings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "finding_documents_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          }
        ];
      };
      generated_drafts: {
        Row: {
          id: string;
          case_id: string;
          type: Database['public']['Enums']['draft_type'];
          content: string;
          status: Database['public']['Enums']['draft_status'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          type?: Database['public']['Enums']['draft_type'];
          content?: string;
          status?: Database['public']['Enums']['draft_status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          type?: Database['public']['Enums']['draft_type'];
          content?: string;
          status?: Database['public']['Enums']['draft_status'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generated_drafts_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          }
        ];
      };
      draft_findings: {
        Row: {
          draft_id: string;
          finding_id: string;
        };
        Insert: {
          draft_id: string;
          finding_id: string;
        };
        Update: {
          draft_id?: string;
          finding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "draft_findings_draft_id_fkey";
            columns: ["draft_id"];
            isOneToOne: false;
            referencedRelation: "generated_drafts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "draft_findings_finding_id_fkey";
            columns: ["finding_id"];
            isOneToOne: false;
            referencedRelation: "findings";
            referencedColumns: ["id"];
          }
        ];
      };
      document_extractions: {
        Row: {
          id: string;
          case_id: string;
          document_id: string;
          document_type: string;
          status: Database['public']['Enums']['extraction_status'];
          raw_text: string | null;
          extraction_method: string | null;
          confidence_score: number | null;
          review_status: Database['public']['Enums']['extraction_review_status'];
          reviewed_at: string | null;
          reviewed_by: string | null;
          notes: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          document_id: string;
          document_type: string;
          status?: Database['public']['Enums']['extraction_status'];
          raw_text?: string | null;
          extraction_method?: string | null;
          confidence_score?: number | null;
          review_status?: Database['public']['Enums']['extraction_review_status'];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          notes?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          document_id?: string;
          document_type?: string;
          status?: Database['public']['Enums']['extraction_status'];
          raw_text?: string | null;
          extraction_method?: string | null;
          confidence_score?: number | null;
          review_status?: Database['public']['Enums']['extraction_review_status'];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          notes?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_extractions_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_extractions_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          }
        ];
      };
      document_fields: {
        Row: {
          id: string;
          case_id: string;
          document_id: string;
          document_extraction_id: string;
          field_name: string;
          raw_value: string | null;
          normalized_value: string | null;
          reviewed_value: string | null;
          final_value: string | null;
          status: Database['public']['Enums']['field_status'];
          confidence_score: number | null;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          document_id: string;
          document_extraction_id: string;
          field_name: string;
          raw_value?: string | null;
          normalized_value?: string | null;
          reviewed_value?: string | null;
          final_value?: string | null;
          status?: Database['public']['Enums']['field_status'];
          confidence_score?: number | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          document_id?: string;
          document_extraction_id?: string;
          field_name?: string;
          raw_value?: string | null;
          normalized_value?: string | null;
          reviewed_value?: string | null;
          final_value?: string | null;
          status?: Database['public']['Enums']['field_status'];
          confidence_score?: number | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_fields_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_fields_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_fields_document_extraction_id_fkey";
            columns: ["document_extraction_id"];
            isOneToOne: false;
            referencedRelation: "document_extractions";
            referencedColumns: ["id"];
          }
        ];
      };
      export_packages: {
        Row: {
          id: string;
          case_id: string;
          package_url: string;
          format: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          package_url: string;
          format: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          package_url?: string;
          format?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "export_packages_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          }
        ];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: 'Admin' | 'Reviewer';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role: 'Admin' | 'Reviewer';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          role?: 'Admin' | 'Reviewer';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          case_id: string;
          user_id: string | null;
          role: string | null;
          action_type: string;
          description: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          user_id?: string | null;
          role?: string | null;
          action_type: string;
          description?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          user_id?: string | null;
          role?: string | null;
          action_type?: string;
          description?: string | null;
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_logs_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      create_case_with_applicant: {
        Args: {
          p_first_name: string;
          p_last_name: string;
          p_date_of_birth: string;
        };
        Returns: string;
      };
      upload_document_record: {
        Args: {
          p_case_id: string;
          p_type: 'PSABirth' | 'PSAMarriage' | 'TOR' | 'SF10' | 'Diploma';
          p_file_path: string;
          p_file_name: string;
          p_file_size: number;
          p_mime_type: string;
        };
        Returns: string;
      };
      delete_document: {
        Args: {
          p_document_id: string;
        };
        Returns: unknown;
      };
    };
    Enums: {
      extraction_status: 'Pending' | 'Processing' | 'Extracted' | 'NeedsReview' | 'Reviewed' | 'Failed';
      extraction_review_status: 'Unreviewed' | 'PartiallyReviewed' | 'Reviewed' | 'Rejected';
      field_status: 'Extracted' | 'NeedsReview' | 'Accepted' | 'Corrected' | 'Rejected';
      case_status: 'Draft' | 'Uploaded' | 'Processing' | 'NeedsReview' | 'Reviewed' | 'ReadyForExport' | 'Exported' | 'Archived' | 'DraftGenerated';
      finding_severity: 'High' | 'Medium' | 'Low';
      finding_category: 'Name Mismatch' | 'Address Mismatch' | 'Date Mismatch' | 'Age Calculation Issue' | 'School Gap' | 'Missing Information';
      finding_status: 'Open' | 'Accepted' | 'Resolved' | 'Ignored';
      draft_status: 'Draft' | 'Finalized';
      draft_type: 'Affidavit' | 'AddressLetter' | 'GapLetter';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      size?: any;
      asChild?: any;
    }
  }
}

declare module '@supabase/ssr' {
  export function createServerClient<
    Database = any,
    SchemaName extends string & keyof Database = 'public' extends keyof Database
      ? 'public'
      : string & keyof Database
  >(
    supabaseUrl: string,
    supabaseKey: string,
    options: any
  ): SupabaseClient<Database, any>;
}
