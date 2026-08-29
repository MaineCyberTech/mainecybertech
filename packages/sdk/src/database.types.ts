// Auto-generated from supabase/migrations/*.sql — DO NOT EDIT MANUALLY
// Run: node scripts/generate-db-types.js to regenerate
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      ai_draft_outputs: {
        Row: {
          approved_content: Json | null;
          created_at: string;
          created_by: string | null;
          draft_content: Json;
          id: string;
          module_key: string;
          organization_id: string;
          prompt_key: string | null;
          prompt_version: string | null;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          source_entity_id: string | null;
          source_entity_type: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          module_key: string;
          organization_id: string;
          approved_content?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          draft_content?: Json | null;
          id?: string | null;
          prompt_key?: string | null;
          prompt_version?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          source_entity_id?: string | null;
          source_entity_type?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          approved_content?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          draft_content?: Json | null;
          id?: string | null;
          module_key?: string | null;
          organization_id?: string | null;
          prompt_key?: string | null;
          prompt_version?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          source_entity_id?: string | null;
          source_entity_type?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "ai_draft_outputs_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      ai_policies: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          approved_tools: string[] | null;
          content: string | null;
          created_at: string;
          created_by: string | null;
          data_handling_rules: string | null;
          employee_guidance: string | null;
          id: string;
          organization_id: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          title: string;
          approved_at?: string | null;
          approved_by?: string | null;
          approved_tools?: string[] | null;
          content?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          data_handling_rules?: string | null;
          employee_guidance?: string | null;
          id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          approved_tools?: string[] | null;
          content?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          data_handling_rules?: string | null;
          employee_guidance?: string | null;
          id?: string | null;
          organization_id?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "ai_policies_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      api_keys: {
        Row: {
          created_at: string;
          created_by: string;
          expires_at: string | null;
          id: string;
          is_active: boolean;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          name: string;
          organization_id: string;
          permissions: Json;
          updated_at: string;
        };
        Insert: {
          created_by: string;
          key_hash: string;
          key_prefix: string;
          name: string;
          organization_id: string;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string | null;
          is_active?: boolean | null;
          last_used_at?: string | null;
          permissions?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string | null;
          is_active?: boolean | null;
          key_hash?: string | null;
          key_prefix?: string | null;
          last_used_at?: string | null;
          name?: string | null;
          organization_id?: string | null;
          permissions?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "api_keys_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
          { foreignKeyName: "api_keys_created_by_fkey", columns: ["created_by"], isOneToOne: false, referencedRelation: "profiles", referencedColumns: ["id"] },
        ];
      };      approval_requests: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          assigned_to: string | null;
          created_at: string;
          due_at: string | null;
          id: string;
          organization_id: string;
          priority: string;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          request_body: string | null;
          request_metadata: Json;
          request_subject: string;
          request_type: string;
          requested_by: string | null;
          source_entity_id: string | null;
          source_entity_type: string | null;
          source_module: string | null;
          status: string;
          updated_at: string;
          version: number;
          visibility: string;
        };
        Insert: {
          organization_id: string;
          request_subject: string;
          request_type: string;
          approved_at?: string | null;
          approved_by?: string | null;
          assigned_to?: string | null;
          created_at?: string | null;
          due_at?: string | null;
          id?: string | null;
          priority?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          request_body?: string | null;
          request_metadata?: Json | null;
          requested_by?: string | null;
          source_entity_id?: string | null;
          source_entity_type?: string | null;
          source_module?: string | null;
          status?: string | null;
          updated_at?: string | null;
          version?: number | null;
          visibility?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          assigned_to?: string | null;
          created_at?: string | null;
          due_at?: string | null;
          id?: string | null;
          organization_id?: string | null;
          priority?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          request_body?: string | null;
          request_metadata?: Json | null;
          request_subject?: string | null;
          request_type?: string | null;
          requested_by?: string | null;
          source_entity_id?: string | null;
          source_entity_type?: string | null;
          source_module?: string | null;
          status?: string | null;
          updated_at?: string | null;
          version?: number | null;
          visibility?: string | null;
        };
        Relationships: [
          { foreignKeyName: "approval_requests_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      assets: {
        Row: {
          asset_tag: string | null;
          asset_type: string;
          assigned_to: string | null;
          contract_reference: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          ip_address: string | null;
          lifecycle_score: number;
          location: string | null;
          mac_address: string | null;
          maintenance_notes: string | null;
          make: string | null;
          metadata: Json;
          model: string | null;
          name: string;
          operating_system: string | null;
          organization_id: string;
          owner_user_id: string | null;
          purchase_date: string | null;
          purchase_price: number | null;
          qr_label: string | null;
          replacement_recommended: string | null;
          serial_number: string | null;
          site: string | null;
          status: string;
          supported_until: string | null;
          updated_at: string;
          updated_by: string | null;
          vendor_support_status: string;
          version: number;
          visibility: string;
          warranty_expires: string | null;
        };
        Insert: {
          name: string;
          organization_id: string;
          asset_tag?: string | null;
          asset_type?: string | null;
          assigned_to?: string | null;
          contract_reference?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          ip_address?: string | null;
          lifecycle_score?: number | null;
          location?: string | null;
          mac_address?: string | null;
          maintenance_notes?: string | null;
          make?: string | null;
          metadata?: Json | null;
          model?: string | null;
          operating_system?: string | null;
          owner_user_id?: string | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          qr_label?: string | null;
          replacement_recommended?: string | null;
          serial_number?: string | null;
          site?: string | null;
          status?: string | null;
          supported_until?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          vendor_support_status?: string | null;
          version?: number | null;
          visibility?: string | null;
          warranty_expires?: string | null;
        };
        Update: {
          asset_tag?: string | null;
          asset_type?: string | null;
          assigned_to?: string | null;
          contract_reference?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          ip_address?: string | null;
          lifecycle_score?: number | null;
          location?: string | null;
          mac_address?: string | null;
          maintenance_notes?: string | null;
          make?: string | null;
          metadata?: Json | null;
          model?: string | null;
          name?: string | null;
          operating_system?: string | null;
          organization_id?: string | null;
          owner_user_id?: string | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          qr_label?: string | null;
          replacement_recommended?: string | null;
          serial_number?: string | null;
          site?: string | null;
          status?: string | null;
          supported_until?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          vendor_support_status?: string | null;
          version?: number | null;
          visibility?: string | null;
          warranty_expires?: string | null;
        };
        Relationships: [
          { foreignKeyName: "assets_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      audit_logs: {
        Row: {
          action: string;
          actor_type: "user" | "system" | "service";
          actor_user_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          ip_address: string | null;
          metadata: Json;
          organization_id: string | null;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          entity_type: string;
          actor_type?: "user" | "system" | "service" | null;
          actor_user_id?: string | null;
          created_at?: string | null;
          entity_id?: string | null;
          id?: string | null;
          ip_address?: string | null;
          metadata?: Json | null;
          organization_id?: string | null;
          user_agent?: string | null;
        };
        Update: {
          action?: string | null;
          actor_type?: "user" | "system" | "service" | null;
          actor_user_id?: string | null;
          created_at?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string | null;
          ip_address?: string | null;
          metadata?: Json | null;
          organization_id?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          { foreignKeyName: "audit_logs_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      automation_workflows: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          last_result: string | null;
          last_run_at: string | null;
          last_run_status: string | null;
          name: string;
          organization_id: string;
          run_count: number;
          script_type: string;
          trigger_type: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          organization_id: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          is_active?: boolean | null;
          last_result?: string | null;
          last_run_at?: string | null;
          last_run_status?: string | null;
          run_count?: number | null;
          script_type?: string | null;
          trigger_type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          is_active?: boolean | null;
          last_result?: string | null;
          last_run_at?: string | null;
          last_run_status?: string | null;
          name?: string | null;
          organization_id?: string | null;
          run_count?: number | null;
          script_type?: string | null;
          trigger_type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "automation_workflows_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      backup_status: {
        Row: {
          backup_type: string;
          created_at: string;
          created_by: string | null;
          encryption_enabled: boolean;
          id: string;
          last_backup_at: string | null;
          last_backup_size_gb: number | null;
          last_backup_status: string;
          next_scheduled_at: string | null;
          notes: string | null;
          offsite_replicated: boolean;
          organization_id: string;
          recovery_point_objective_hours: number | null;
          recovery_time_objective_hours: number | null;
          restore_test_result: string | null;
          restore_tested_at: string | null;
          retention_days: number;
          status: string;
          system_name: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          system_name: string;
          backup_type?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          encryption_enabled?: boolean | null;
          id?: string | null;
          last_backup_at?: string | null;
          last_backup_size_gb?: number | null;
          last_backup_status?: string | null;
          next_scheduled_at?: string | null;
          notes?: string | null;
          offsite_replicated?: boolean | null;
          recovery_point_objective_hours?: number | null;
          recovery_time_objective_hours?: number | null;
          restore_test_result?: string | null;
          restore_tested_at?: string | null;
          retention_days?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          backup_type?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          encryption_enabled?: boolean | null;
          id?: string | null;
          last_backup_at?: string | null;
          last_backup_size_gb?: number | null;
          last_backup_status?: string | null;
          next_scheduled_at?: string | null;
          notes?: string | null;
          offsite_replicated?: boolean | null;
          organization_id?: string | null;
          recovery_point_objective_hours?: number | null;
          recovery_time_objective_hours?: number | null;
          restore_test_result?: string | null;
          restore_tested_at?: string | null;
          retention_days?: number | null;
          status?: string | null;
          system_name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "backup_status_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      badges_earned: {
        Row: {
          badge_name: string;
          category: string | null;
          earned_at: string;
          id: string;
          organization_id: string;
          points: number;
        };
        Insert: {
          badge_name: string;
          organization_id: string;
          category?: string | null;
          earned_at?: string | null;
          id?: string | null;
          points?: number | null;
        };
        Update: {
          badge_name?: string | null;
          category?: string | null;
          earned_at?: string | null;
          id?: string | null;
          organization_id?: string | null;
          points?: number | null;
        };
        Relationships: [
          { foreignKeyName: "badges_earned_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      billing_customers: {
        Row: {
          billing_email: string | null;
          created_at: string;
          default_payment_method: string | null;
          id: string;
          metadata: Json;
          organization_id: string;
          stripe_customer_id: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          organization_id: string;
          billing_email?: string | null;
          created_at?: string | null;
          default_payment_method?: string | null;
          id?: string | null;
          metadata?: Json | null;
          stripe_customer_id?: string | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Update: {
          billing_email?: string | null;
          created_at?: string | null;
          default_payment_method?: string | null;
          id?: string | null;
          metadata?: Json | null;
          organization_id?: string | null;
          stripe_customer_id?: string | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Relationships: [
          { foreignKeyName: "billing_customers_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      break_glass_accounts: {
        Row: {
          access_procedure: string | null;
          account_name: string;
          created_at: string;
          created_by: string | null;
          custodian_name: string | null;
          id: string;
          last_rotated_at: string | null;
          last_tested_at: string | null;
          last_used_at: string | null;
          next_rotation_at: string | null;
          organization_id: string;
          status: string;
          system: string;
          test_notes: string | null;
          updated_at: string;
        };
        Insert: {
          account_name: string;
          organization_id: string;
          system: string;
          access_procedure?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          custodian_name?: string | null;
          id?: string | null;
          last_rotated_at?: string | null;
          last_tested_at?: string | null;
          last_used_at?: string | null;
          next_rotation_at?: string | null;
          status?: string | null;
          test_notes?: string | null;
          updated_at?: string | null;
        };
        Update: {
          access_procedure?: string | null;
          account_name?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          custodian_name?: string | null;
          id?: string | null;
          last_rotated_at?: string | null;
          last_tested_at?: string | null;
          last_used_at?: string | null;
          next_rotation_at?: string | null;
          organization_id?: string | null;
          status?: string | null;
          system?: string | null;
          test_notes?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "break_glass_accounts_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      budget_roadmaps: {
        Row: {
          category: string;
          created_at: string;
          created_by: string | null;
          estimated_cost: number | null;
          fiscal_year: number | null;
          id: string;
          item_name: string;
          notes: string | null;
          organization_id: string;
          priority: string;
          quarter: number | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          item_name: string;
          organization_id: string;
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          estimated_cost?: number | null;
          fiscal_year?: number | null;
          id?: string | null;
          notes?: string | null;
          priority?: string | null;
          quarter?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          estimated_cost?: number | null;
          fiscal_year?: number | null;
          id?: string | null;
          item_name?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          priority?: string | null;
          quarter?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "budget_roadmaps_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      cab_agenda_items: {
        Row: {
          change_request_id: string;
          created_at: string;
          decision: string;
          id: string;
          meeting_id: string;
          notes: string | null;
          organization_id: string;
        };
        Insert: {
          change_request_id: string;
          meeting_id: string;
          organization_id: string;
          created_at?: string | null;
          decision?: string | null;
          id?: string | null;
          notes?: string | null;
        };
        Update: {
          change_request_id?: string | null;
          created_at?: string | null;
          decision?: string | null;
          id?: string | null;
          meeting_id?: string | null;
          notes?: string | null;
          organization_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "cab_agenda_items_meeting_id_fkey", columns: ["meeting_id"], isOneToOne: false, referencedRelation: "cab_meetings", referencedColumns: ["id"] },
          { foreignKeyName: "cab_agenda_items_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
          { foreignKeyName: "cab_agenda_items_change_request_id_fkey", columns: ["change_request_id"], isOneToOne: false, referencedRelation: "change_requests", referencedColumns: ["id"] },
        ];
      };      cab_meetings: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          notes: string | null;
          organization_id: string;
          scheduled_at: string | null;
          status: string;
        };
        Insert: {
          organization_id: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          notes?: string | null;
          scheduled_at?: string | null;
          status?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          scheduled_at?: string | null;
          status?: string | null;
        };
        Relationships: [
          { foreignKeyName: "cab_meetings_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      camera_calculations: {
        Row: {
          avg_bitrate_mbps: number;
          bitrate_mbps: number;
          camera_count: number;
          created_at: string;
          created_by: string | null;
          daily_storage_gb: number | null;
          estimated_storage_tb: number | null;
          id: string;
          notes: string | null;
          organization_id: string;
          recommended_nvr: string | null;
          resolution: string;
          retention_days: number;
          site_name: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          site_name: string;
          avg_bitrate_mbps?: number | null;
          bitrate_mbps?: number | null;
          camera_count?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          daily_storage_gb?: number | null;
          estimated_storage_tb?: number | null;
          id?: string | null;
          notes?: string | null;
          recommended_nvr?: string | null;
          resolution?: string | null;
          retention_days?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avg_bitrate_mbps?: number | null;
          bitrate_mbps?: number | null;
          camera_count?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          daily_storage_gb?: number | null;
          estimated_storage_tb?: number | null;
          id?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          recommended_nvr?: string | null;
          resolution?: string | null;
          retention_days?: number | null;
          site_name?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "camera_calculations_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      change_requests: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          approver_id: string | null;
          change_type: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          implementation_date: string | null;
          implemented_at: string | null;
          implemented_by: string | null;
          organization_id: string;
          requester_id: string | null;
          risk_level: string;
          rollback_plan: string | null;
          status: string;
          submitted_at: string | null;
          title: string;
          updated_at: string;
          verification_steps: string | null;
          verified_at: string | null;
        };
        Insert: {
          organization_id: string;
          title: string;
          approved_at?: string | null;
          approved_by?: string | null;
          approver_id?: string | null;
          change_type?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          implementation_date?: string | null;
          implemented_at?: string | null;
          implemented_by?: string | null;
          requester_id?: string | null;
          risk_level?: string | null;
          rollback_plan?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          updated_at?: string | null;
          verification_steps?: string | null;
          verified_at?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          approver_id?: string | null;
          change_type?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          implementation_date?: string | null;
          implemented_at?: string | null;
          implemented_by?: string | null;
          organization_id?: string | null;
          requester_id?: string | null;
          risk_level?: string | null;
          rollback_plan?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          title?: string | null;
          updated_at?: string | null;
          verification_steps?: string | null;
          verified_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "change_requests_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      client_onboarding_checklist_items: {
        Row: {
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_completed: boolean;
          is_required: boolean;
          item_key: string;
          label: string;
          notes: string | null;
          onboarding_record_id: string;
          organization_id: string;
          phase: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          item_key: string;
          label: string;
          onboarding_record_id: string;
          organization_id: string;
          phase: string;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string | null;
          is_completed?: boolean | null;
          is_required?: boolean | null;
          notes?: string | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string | null;
          is_completed?: boolean | null;
          is_required?: boolean | null;
          item_key?: string | null;
          label?: string | null;
          notes?: string | null;
          onboarding_record_id?: string | null;
          organization_id?: string | null;
          phase?: string | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "client_onboarding_checklist_items_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
          { foreignKeyName: "client_onboarding_checklist_items_onboarding_record_id_fkey", columns: ["onboarding_record_id"], isOneToOne: false, referencedRelation: "client_onboarding_command_center_records", referencedColumns: ["id"] },
        ];
      };      client_onboarding_command_center_records: {
        Row: {
          access_collection_status: string;
          access_credentials: Json;
          client_contact_email: string | null;
          client_contact_phone: string | null;
          client_domain: string | null;
          client_name: string;
          completed_at: string | null;
          created_at: string;
          discovery_notes: string | null;
          documentation_status: string;
          documentation_url: string | null;
          handoff_completed_at: string | null;
          id: string;
          m365_licenses: Json;
          m365_setup_status: string;
          m365_tenant_id: string | null;
          network_baseline_status: string;
          network_diagram_url: string | null;
          network_scan_results: Json;
          next_review_at: string | null;
          onboarding_lead_id: string | null;
          organization_id: string;
          phase: string;
          risk_level: string;
          security_baseline_score: number | null;
          security_baseline_status: string;
          security_findings: Json;
          started_at: string;
          status: string;
          support_handoff_notes: string | null;
          support_handoff_status: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          client_name: string;
          organization_id: string;
          access_collection_status?: string | null;
          access_credentials?: Json | null;
          client_contact_email?: string | null;
          client_contact_phone?: string | null;
          client_domain?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          discovery_notes?: string | null;
          documentation_status?: string | null;
          documentation_url?: string | null;
          handoff_completed_at?: string | null;
          id?: string | null;
          m365_licenses?: Json | null;
          m365_setup_status?: string | null;
          m365_tenant_id?: string | null;
          network_baseline_status?: string | null;
          network_diagram_url?: string | null;
          network_scan_results?: Json | null;
          next_review_at?: string | null;
          onboarding_lead_id?: string | null;
          phase?: string | null;
          risk_level?: string | null;
          security_baseline_score?: number | null;
          security_baseline_status?: string | null;
          security_findings?: Json | null;
          started_at?: string | null;
          status?: string | null;
          support_handoff_notes?: string | null;
          support_handoff_status?: string | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Update: {
          access_collection_status?: string | null;
          access_credentials?: Json | null;
          client_contact_email?: string | null;
          client_contact_phone?: string | null;
          client_domain?: string | null;
          client_name?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          discovery_notes?: string | null;
          documentation_status?: string | null;
          documentation_url?: string | null;
          handoff_completed_at?: string | null;
          id?: string | null;
          m365_licenses?: Json | null;
          m365_setup_status?: string | null;
          m365_tenant_id?: string | null;
          network_baseline_status?: string | null;
          network_diagram_url?: string | null;
          network_scan_results?: Json | null;
          next_review_at?: string | null;
          onboarding_lead_id?: string | null;
          organization_id?: string | null;
          phase?: string | null;
          risk_level?: string | null;
          security_baseline_score?: number | null;
          security_baseline_status?: string | null;
          security_findings?: Json | null;
          started_at?: string | null;
          status?: string | null;
          support_handoff_notes?: string | null;
          support_handoff_status?: string | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Relationships: [
          { foreignKeyName: "client_onboarding_command_center_records_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      client_runbooks: {
        Row: {
          category: string | null;
          content: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          last_reviewed_at: string | null;
          next_review_at: string | null;
          organization_id: string;
          status: string;
          title: string;
          updated_at: string;
          version: string;
        };
        Insert: {
          organization_id: string;
          title: string;
          category?: string | null;
          content?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          last_reviewed_at?: string | null;
          next_review_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
          version?: string | null;
        };
        Update: {
          category?: string | null;
          content?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          last_reviewed_at?: string | null;
          next_review_at?: string | null;
          organization_id?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
          version?: string | null;
        };
        Relationships: [
          { foreignKeyName: "client_runbooks_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      compliance_controls: {
        Row: {
          created_at: string;
          due_at: string | null;
          framework_id: string;
          id: string;
          notes: string | null;
          organization_id: string;
          owner: string | null;
          status: string;
          title: string;
        };
        Insert: {
          framework_id: string;
          organization_id: string;
          title: string;
          created_at?: string | null;
          due_at?: string | null;
          id?: string | null;
          notes?: string | null;
          owner?: string | null;
          status?: string | null;
        };
        Update: {
          created_at?: string | null;
          due_at?: string | null;
          framework_id?: string | null;
          id?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          owner?: string | null;
          status?: string | null;
          title?: string | null;
        };
        Relationships: [
          { foreignKeyName: "compliance_controls_framework_id_fkey", columns: ["framework_id"], isOneToOne: false, referencedRelation: "compliance_frameworks", referencedColumns: ["id"] },
          { foreignKeyName: "compliance_controls_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      compliance_frameworks: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          organization_id: string;
        };
        Insert: {
          name: string;
          organization_id: string;
          created_at?: string | null;
          description?: string | null;
          id?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string | null;
          name?: string | null;
          organization_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "compliance_frameworks_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      compliance_readiness: {
        Row: {
          assessed_at: string | null;
          control_description: string | null;
          control_id: string | null;
          created_at: string;
          created_by: string | null;
          evidence_collected: boolean;
          framework: string;
          id: string;
          is_compliant: boolean;
          notes: string | null;
          organization_id: string;
          passed_questions: number | null;
          score: number | null;
          status: string;
          total_questions: number | null;
          updated_at: string;
        };
        Insert: {
          framework: string;
          organization_id: string;
          assessed_at?: string | null;
          control_description?: string | null;
          control_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          evidence_collected?: boolean | null;
          id?: string | null;
          is_compliant?: boolean | null;
          notes?: string | null;
          passed_questions?: number | null;
          score?: number | null;
          status?: string | null;
          total_questions?: number | null;
          updated_at?: string | null;
        };
        Update: {
          assessed_at?: string | null;
          control_description?: string | null;
          control_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          evidence_collected?: boolean | null;
          framework?: string | null;
          id?: string | null;
          is_compliant?: boolean | null;
          notes?: string | null;
          organization_id?: string | null;
          passed_questions?: number | null;
          score?: number | null;
          status?: string | null;
          total_questions?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "compliance_readiness_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      custom_forms: {
        Row: {
          created_at: string;
          created_by: string | null;
          form_description: string | null;
          form_fields: Json;
          form_name: string;
          id: string;
          is_active: boolean;
          organization_id: string;
          submission_count: number;
          updated_at: string;
        };
        Insert: {
          form_name: string;
          organization_id: string;
          created_at?: string | null;
          created_by?: string | null;
          form_description?: string | null;
          form_fields?: Json | null;
          id?: string | null;
          is_active?: boolean | null;
          submission_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          form_description?: string | null;
          form_fields?: Json | null;
          form_name?: string | null;
          id?: string | null;
          is_active?: boolean | null;
          organization_id?: string | null;
          submission_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "custom_forms_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      cyber_scorecards: {
        Row: {
          badge: string | null;
          category: string;
          created_at: string;
          id: string;
          last_updated: string;
          max_score: number;
          organization_id: string;
          score: number;
          updated_at: string;
        };
        Insert: {
          category: string;
          organization_id: string;
          badge?: string | null;
          created_at?: string | null;
          id?: string | null;
          last_updated?: string | null;
          max_score?: number | null;
          score?: number | null;
          updated_at?: string | null;
        };
        Update: {
          badge?: string | null;
          category?: string | null;
          created_at?: string | null;
          id?: string | null;
          last_updated?: string | null;
          max_score?: number | null;
          organization_id?: string | null;
          score?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "cyber_scorecards_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      device_profiles: {
        Row: {
          created_at: string;
          id: string;
          manufacturer: string | null;
          model: string | null;
          name: string;
          organization_id: string;
          specs: Json;
          type: string | null;
          updated_at: string;
        };
        Insert: {
          name: string;
          organization_id: string;
          created_at?: string | null;
          id?: string | null;
          manufacturer?: string | null;
          model?: string | null;
          specs?: Json | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string | null;
          manufacturer?: string | null;
          model?: string | null;
          name?: string | null;
          organization_id?: string | null;
          specs?: Json | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "device_profiles_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      dmarc_analyses: {
        Row: {
          alignment_mode: string | null;
          analyzed_at: string;
          created_at: string;
          created_by: string | null;
          dkim_record: string | null;
          dmarc_policy: string | null;
          dmarc_record: string | null;
          domain: string;
          id: string;
          issues: Json;
          organization_id: string;
          overall_grade: string | null;
          pct: number | null;
          recommendations: Json;
          spf_record: string | null;
          status: string;
        };
        Insert: {
          domain: string;
          organization_id: string;
          alignment_mode?: string | null;
          analyzed_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          dkim_record?: string | null;
          dmarc_policy?: string | null;
          dmarc_record?: string | null;
          id?: string | null;
          issues?: Json | null;
          overall_grade?: string | null;
          pct?: number | null;
          recommendations?: Json | null;
          spf_record?: string | null;
          status?: string | null;
        };
        Update: {
          alignment_mode?: string | null;
          analyzed_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          dkim_record?: string | null;
          dmarc_policy?: string | null;
          dmarc_record?: string | null;
          domain?: string | null;
          id?: string | null;
          issues?: Json | null;
          organization_id?: string | null;
          overall_grade?: string | null;
          pct?: number | null;
          recommendations?: Json | null;
          spf_record?: string | null;
          status?: string | null;
        };
        Relationships: [
          { foreignKeyName: "dmarc_analyses_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      dmarc_assessments: {
        Row: {
          bimi_configured: boolean;
          created_at: string;
          created_by: string | null;
          dkim_configured: boolean;
          dkim_selector: string | null;
          dmarc_pct: number | null;
          dmarc_policy: string | null;
          dmarc_record: string | null;
          dmarc_valid: boolean;
          domain: string;
          id: string;
          last_checked_at: string | null;
          organization_id: string;
          recommendation_notes: string | null;
          spf_record: string | null;
          spf_valid: boolean;
          status: string;
          updated_at: string;
        };
        Insert: {
          domain: string;
          organization_id: string;
          bimi_configured?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          dkim_configured?: boolean | null;
          dkim_selector?: string | null;
          dmarc_pct?: number | null;
          dmarc_policy?: string | null;
          dmarc_record?: string | null;
          dmarc_valid?: boolean | null;
          id?: string | null;
          last_checked_at?: string | null;
          recommendation_notes?: string | null;
          spf_record?: string | null;
          spf_valid?: boolean | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          bimi_configured?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          dkim_configured?: boolean | null;
          dkim_selector?: string | null;
          dmarc_pct?: number | null;
          dmarc_policy?: string | null;
          dmarc_record?: string | null;
          dmarc_valid?: boolean | null;
          domain?: string | null;
          id?: string | null;
          last_checked_at?: string | null;
          organization_id?: string | null;
          recommendation_notes?: string | null;
          spf_record?: string | null;
          spf_valid?: boolean | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "dmarc_assessments_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      dns_change_requests: {
        Row: {
          approved_by: string | null;
          change_description: string | null;
          change_type: string;
          created_at: string;
          created_by: string | null;
          current_value: string | null;
          domain: string;
          id: string;
          implemented_at: string | null;
          organization_id: string;
          proposed_value: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          change_type: string;
          domain: string;
          organization_id: string;
          approved_by?: string | null;
          change_description?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          current_value?: string | null;
          id?: string | null;
          implemented_at?: string | null;
          proposed_value?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          approved_by?: string | null;
          change_description?: string | null;
          change_type?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          current_value?: string | null;
          domain?: string | null;
          id?: string | null;
          implemented_at?: string | null;
          organization_id?: string | null;
          proposed_value?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "dns_change_requests_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      document_permissions: {
        Row: {
          can_edit: boolean;
          can_share: boolean;
          can_view: boolean;
          document_id: string;
          id: string;
          role_id: string | null;
          user_id: string | null;
        };
        Insert: {
          document_id: string;
          can_edit?: boolean | null;
          can_share?: boolean | null;
          can_view?: boolean | null;
          id?: string | null;
          role_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          can_edit?: boolean | null;
          can_share?: boolean | null;
          can_view?: boolean | null;
          document_id?: string | null;
          id?: string | null;
          role_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "document_permissions_document_id_fkey", columns: ["document_id"], isOneToOne: false, referencedRelation: "documents", referencedColumns: ["id"] },
          { foreignKeyName: "document_permissions_role_id_fkey", columns: ["role_id"], isOneToOne: false, referencedRelation: "roles", referencedColumns: ["id"] },
        ];
      };      document_shares: {
        Row: {
          access_count: number;
          created_at: string;
          created_by: string;
          document_id: string;
          expires_at: string;
          id: string;
          max_access: number | null;
          organization_id: string;
          revoked_at: string | null;
          token: string;
        };
        Insert: {
          created_by: string;
          document_id: string;
          expires_at: string;
          organization_id: string;
          token: string;
          access_count?: number | null;
          created_at?: string | null;
          id?: string | null;
          max_access?: number | null;
          revoked_at?: string | null;
        };
        Update: {
          access_count?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          document_id?: string | null;
          expires_at?: string | null;
          id?: string | null;
          max_access?: number | null;
          organization_id?: string | null;
          revoked_at?: string | null;
          token?: string | null;
        };
        Relationships: [
          { foreignKeyName: "document_shares_document_id_fkey", columns: ["document_id"], isOneToOne: false, referencedRelation: "documents", referencedColumns: ["id"] },
          { foreignKeyName: "document_shares_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      document_versions: {
        Row: {
          checksum: string | null;
          created_at: string;
          document_id: string;
          id: string;
          storage_path: string;
          uploaded_by: string;
          version_number: number;
        };
        Insert: {
          document_id: string;
          storage_path: string;
          uploaded_by: string;
          version_number: number;
          checksum?: string | null;
          created_at?: string | null;
          id?: string | null;
        };
        Update: {
          checksum?: string | null;
          created_at?: string | null;
          document_id?: string | null;
          id?: string | null;
          storage_path?: string | null;
          uploaded_by?: string | null;
          version_number?: number | null;
        };
        Relationships: [
          { foreignKeyName: "document_versions_document_id_fkey", columns: ["document_id"], isOneToOne: false, referencedRelation: "documents", referencedColumns: ["id"] },
        ];
      };      documents: {
        Row: {
          created_at: string;
          current_version: number;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          file_name: string | null;
          file_size: number | null;
          folder_path: string | null;
          id: string;
          metadata: Json;
          mime_type: string | null;
          name: string;
          organization_id: string;
          storage_bucket: string;
          storage_path: string;
          title: string | null;
          updated_at: string;
          uploaded_by: string;
          version: number;
          visibility: "private" | "org" | "internal" | "public";
        };
        Insert: {
          name: string;
          organization_id: string;
          storage_bucket: string;
          storage_path: string;
          uploaded_by: string;
          created_at?: string | null;
          current_version?: number | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          folder_path?: string | null;
          id?: string | null;
          metadata?: Json | null;
          mime_type?: string | null;
          title?: string | null;
          updated_at?: string | null;
          version?: number | null;
          visibility?: "private" | "org" | "internal" | "public" | null;
        };
        Update: {
          created_at?: string | null;
          current_version?: number | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          folder_path?: string | null;
          id?: string | null;
          metadata?: Json | null;
          mime_type?: string | null;
          name?: string | null;
          organization_id?: string | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          title?: string | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          version?: number | null;
          visibility?: "private" | "org" | "internal" | "public" | null;
        };
        Relationships: [
          { foreignKeyName: "documents_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      domain_monitors: {
        Row: {
          alerts_enabled: boolean;
          check_interval_hours: number;
          cloudflare_proxied: boolean;
          created_at: string;
          created_by: string | null;
          display_name: string | null;
          dkim_status: string;
          dmarc_policy: string | null;
          dmarc_status: string;
          dns_provider: string;
          domain: string;
          id: string;
          last_checked_at: string | null;
          metadata: Json;
          nameserver_mismatch: boolean;
          nameservers: Json;
          next_check_at: string | null;
          organization_id: string;
          owner_user_id: string | null;
          spf_status: string;
          ssl_expires: string | null;
          ssl_issuer: string | null;
          ssl_valid: boolean;
          status: string;
          updated_at: string;
          visibility: string;
          zone_id: string | null;
        };
        Insert: {
          domain: string;
          organization_id: string;
          alerts_enabled?: boolean | null;
          check_interval_hours?: number | null;
          cloudflare_proxied?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          display_name?: string | null;
          dkim_status?: string | null;
          dmarc_policy?: string | null;
          dmarc_status?: string | null;
          dns_provider?: string | null;
          id?: string | null;
          last_checked_at?: string | null;
          metadata?: Json | null;
          nameserver_mismatch?: boolean | null;
          nameservers?: Json | null;
          next_check_at?: string | null;
          owner_user_id?: string | null;
          spf_status?: string | null;
          ssl_expires?: string | null;
          ssl_issuer?: string | null;
          ssl_valid?: boolean | null;
          status?: string | null;
          updated_at?: string | null;
          visibility?: string | null;
          zone_id?: string | null;
        };
        Update: {
          alerts_enabled?: boolean | null;
          check_interval_hours?: number | null;
          cloudflare_proxied?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          display_name?: string | null;
          dkim_status?: string | null;
          dmarc_policy?: string | null;
          dmarc_status?: string | null;
          dns_provider?: string | null;
          domain?: string | null;
          id?: string | null;
          last_checked_at?: string | null;
          metadata?: Json | null;
          nameserver_mismatch?: boolean | null;
          nameservers?: Json | null;
          next_check_at?: string | null;
          organization_id?: string | null;
          owner_user_id?: string | null;
          spf_status?: string | null;
          ssl_expires?: string | null;
          ssl_issuer?: string | null;
          ssl_valid?: boolean | null;
          status?: string | null;
          updated_at?: string | null;
          visibility?: string | null;
          zone_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "domain_monitors_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      dynamic_client_forms: {
        Row: {
          closes_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          fields: Json;
          form_type: string;
          id: string;
          organization_id: string;
          published_at: string | null;
          settings: Json;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          title: string;
          closes_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          fields?: Json | null;
          form_type?: string | null;
          id?: string | null;
          published_at?: string | null;
          settings?: Json | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          closes_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          fields?: Json | null;
          form_type?: string | null;
          id?: string | null;
          organization_id?: string | null;
          published_at?: string | null;
          settings?: Json | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "dynamic_client_forms_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      dynamic_form_submissions: {
        Row: {
          answers: Json;
          created_at: string;
          form_id: string;
          id: string;
          organization_id: string;
          respondent_email: string | null;
          respondent_id: string | null;
          status: string;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          form_id: string;
          organization_id: string;
          answers?: Json | null;
          created_at?: string | null;
          id?: string | null;
          respondent_email?: string | null;
          respondent_id?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          answers?: Json | null;
          created_at?: string | null;
          form_id?: string | null;
          id?: string | null;
          organization_id?: string | null;
          respondent_email?: string | null;
          respondent_id?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "dynamic_form_submissions_form_id_fkey", columns: ["form_id"], isOneToOne: false, referencedRelation: "dynamic_client_forms", referencedColumns: ["id"] },
          { foreignKeyName: "dynamic_form_submissions_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      endpoint_security: {
        Row: {
          av_installed: number;
          coverage_pct: number | null;
          created_at: string;
          created_by: string | null;
          device_group: string;
          disk_encrypted: number;
          edr_deployed: number;
          firewall_enabled: number;
          id: string;
          last_checked_at: string | null;
          local_admin_removed: number;
          mdm_enrolled: number;
          notes: string | null;
          organization_id: string;
          status: string;
          total_endpoints: number;
          updated_at: string;
        };
        Insert: {
          device_group: string;
          organization_id: string;
          av_installed?: number | null;
          coverage_pct?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          disk_encrypted?: number | null;
          edr_deployed?: number | null;
          firewall_enabled?: number | null;
          id?: string | null;
          last_checked_at?: string | null;
          local_admin_removed?: number | null;
          mdm_enrolled?: number | null;
          notes?: string | null;
          status?: string | null;
          total_endpoints?: number | null;
          updated_at?: string | null;
        };
        Update: {
          av_installed?: number | null;
          coverage_pct?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          device_group?: string | null;
          disk_encrypted?: number | null;
          edr_deployed?: number | null;
          firewall_enabled?: number | null;
          id?: string | null;
          last_checked_at?: string | null;
          local_admin_removed?: number | null;
          mdm_enrolled?: number | null;
          notes?: string | null;
          organization_id?: string | null;
          status?: string | null;
          total_endpoints?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "endpoint_security_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      file_requests: {
        Row: {
          allowed_mime_types: string[] | null;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          expires_at: string;
          id: string;
          max_file_size_mb: number;
          max_files: number;
          metadata: Json;
          notify_on_upload: boolean;
          organization_id: string;
          status: string;
          storage_path: string;
          title: string;
          token: string;
          updated_at: string;
          upload_count: number;
          visibility: string;
        };
        Insert: {
          expires_at: string;
          organization_id: string;
          storage_path: string;
          title: string;
          token: string;
          allowed_mime_types?: string[] | null;
          completed_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          max_file_size_mb?: number | null;
          max_files?: number | null;
          metadata?: Json | null;
          notify_on_upload?: boolean | null;
          status?: string | null;
          updated_at?: string | null;
          upload_count?: number | null;
          visibility?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          completed_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          expires_at?: string | null;
          id?: string | null;
          max_file_size_mb?: number | null;
          max_files?: number | null;
          metadata?: Json | null;
          notify_on_upload?: boolean | null;
          organization_id?: string | null;
          status?: string | null;
          storage_path?: string | null;
          title?: string | null;
          token?: string | null;
          updated_at?: string | null;
          upload_count?: number | null;
          visibility?: string | null;
        };
        Relationships: [
          { foreignKeyName: "file_requests_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      findings: {
        Row: {
          affected_systems: string | null;
          assigned_to: string | null;
          controls_impacted: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          finding_category: string | null;
          id: string;
          metadata: Json;
          organization_id: string;
          owner_user_id: string | null;
          remediation_deadline: string | null;
          remediation_plan: string | null;
          resolved_at: string | null;
          severity: string;
          source: string;
          status: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          verification_steps: string | null;
          verified_at: string | null;
          verified_by: string | null;
          version: number;
          visibility: string;
        };
        Insert: {
          organization_id: string;
          title: string;
          affected_systems?: string | null;
          assigned_to?: string | null;
          controls_impacted?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          finding_category?: string | null;
          id?: string | null;
          metadata?: Json | null;
          owner_user_id?: string | null;
          remediation_deadline?: string | null;
          remediation_plan?: string | null;
          resolved_at?: string | null;
          severity?: string | null;
          source?: string | null;
          status?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          verification_steps?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
          version?: number | null;
          visibility?: string | null;
        };
        Update: {
          affected_systems?: string | null;
          assigned_to?: string | null;
          controls_impacted?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          finding_category?: string | null;
          id?: string | null;
          metadata?: Json | null;
          organization_id?: string | null;
          owner_user_id?: string | null;
          remediation_deadline?: string | null;
          remediation_plan?: string | null;
          resolved_at?: string | null;
          severity?: string | null;
          source?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          verification_steps?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
          version?: number | null;
          visibility?: string | null;
        };
        Relationships: [
          { foreignKeyName: "findings_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      hardware_staging: {
        Row: {
          asset_tag: string | null;
          configured: boolean;
          created_at: string;
          created_by: string | null;
          device_name: string;
          device_type: string;
          id: string;
          imaged: boolean;
          labeled: boolean;
          notes: string | null;
          organization_id: string;
          qa_verified: boolean;
          serial_number: string | null;
          staged_at: string | null;
          staged_by: string | null;
          status: string;
          tested: boolean;
          updated_at: string;
        };
        Insert: {
          device_name: string;
          device_type: string;
          organization_id: string;
          asset_tag?: string | null;
          configured?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          imaged?: boolean | null;
          labeled?: boolean | null;
          notes?: string | null;
          qa_verified?: boolean | null;
          serial_number?: string | null;
          staged_at?: string | null;
          staged_by?: string | null;
          status?: string | null;
          tested?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          asset_tag?: string | null;
          configured?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          device_name?: string | null;
          device_type?: string | null;
          id?: string | null;
          imaged?: boolean | null;
          labeled?: boolean | null;
          notes?: string | null;
          organization_id?: string | null;
          qa_verified?: boolean | null;
          serial_number?: string | null;
          staged_at?: string | null;
          staged_by?: string | null;
          status?: string | null;
          tested?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "hardware_staging_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      hardware_staging_checks: {
        Row: {
          asset_tag: string | null;
          assigned_to: string | null;
          checklist: Json;
          created_at: string;
          device_name: string;
          id: string;
          organization_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          device_name: string;
          organization_id: string;
          asset_tag?: string | null;
          assigned_to?: string | null;
          checklist?: Json | null;
          created_at?: string | null;
          id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          asset_tag?: string | null;
          assigned_to?: string | null;
          checklist?: Json | null;
          created_at?: string | null;
          device_name?: string | null;
          id?: string | null;
          organization_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "hardware_staging_checks_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      identity_verifications: {
        Row: {
          action_authorized: string | null;
          authorized_at: string | null;
          authorized_by: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          notes: string | null;
          organization_id: string;
          requestor_email: string | null;
          requestor_name: string;
          status: string;
          updated_at: string;
          verification_method: string;
          verification_pass: boolean;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          organization_id: string;
          requestor_name: string;
          verification_method: string;
          action_authorized?: string | null;
          authorized_at?: string | null;
          authorized_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          notes?: string | null;
          requestor_email?: string | null;
          status?: string | null;
          updated_at?: string | null;
          verification_pass?: boolean | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          action_authorized?: string | null;
          authorized_at?: string | null;
          authorized_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          requestor_email?: string | null;
          requestor_name?: string | null;
          status?: string | null;
          updated_at?: string | null;
          verification_method?: string | null;
          verification_pass?: boolean | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          { foreignKeyName: "identity_verifications_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      impersonation_log: {
        Row: {
          actor_role_key: string;
          actor_user_id: string;
          created_at: string;
          id: string;
          ip_address: string | null;
          metadata: Json;
          organization_id: string | null;
          reason: string | null;
          source: string;
          user_agent: string | null;
        };
        Insert: {
          actor_role_key: string;
          actor_user_id: string;
          created_at?: string | null;
          id?: string | null;
          ip_address?: string | null;
          metadata?: Json | null;
          organization_id?: string | null;
          reason?: string | null;
          source?: string | null;
          user_agent?: string | null;
        };
        Update: {
          actor_role_key?: string | null;
          actor_user_id?: string | null;
          created_at?: string | null;
          id?: string | null;
          ip_address?: string | null;
          metadata?: Json | null;
          organization_id?: string | null;
          reason?: string | null;
          source?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          { foreignKeyName: "impersonation_log_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      incident_responses: {
        Row: {
          affected_systems: string | null;
          closed_at: string | null;
          contained_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          detected_at: string | null;
          eradicated_at: string | null;
          id: string;
          incident_type: string;
          lead_user_id: string | null;
          lessons_learned: string | null;
          organization_id: string;
          recovered_at: string | null;
          root_cause: string | null;
          severity: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          incident_type: string;
          organization_id: string;
          title: string;
          affected_systems?: string | null;
          closed_at?: string | null;
          contained_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          detected_at?: string | null;
          eradicated_at?: string | null;
          id?: string | null;
          lead_user_id?: string | null;
          lessons_learned?: string | null;
          recovered_at?: string | null;
          root_cause?: string | null;
          severity?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          affected_systems?: string | null;
          closed_at?: string | null;
          contained_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          detected_at?: string | null;
          eradicated_at?: string | null;
          id?: string | null;
          incident_type?: string | null;
          lead_user_id?: string | null;
          lessons_learned?: string | null;
          organization_id?: string | null;
          recovered_at?: string | null;
          root_cause?: string | null;
          severity?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "incident_responses_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      insurance_evidence: {
        Row: {
          category: string;
          collected_at: string | null;
          coverage_area: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          document_reference: string | null;
          evidence_description: string;
          evidence_status: string;
          evidence_type: string;
          expiry_date: string | null;
          file_url: string | null;
          id: string;
          insurance_provider: string | null;
          last_verified_at: string | null;
          notes: string | null;
          organization_id: string;
          policy_number: string | null;
          renewal_date: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          evidence_description: string;
          organization_id: string;
          collected_at?: string | null;
          coverage_area?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          document_reference?: string | null;
          evidence_status?: string | null;
          evidence_type?: string | null;
          expiry_date?: string | null;
          file_url?: string | null;
          id?: string | null;
          insurance_provider?: string | null;
          last_verified_at?: string | null;
          notes?: string | null;
          policy_number?: string | null;
          renewal_date?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          collected_at?: string | null;
          coverage_area?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          document_reference?: string | null;
          evidence_description?: string | null;
          evidence_status?: string | null;
          evidence_type?: string | null;
          expiry_date?: string | null;
          file_url?: string | null;
          id?: string | null;
          insurance_provider?: string | null;
          last_verified_at?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          policy_number?: string | null;
          renewal_date?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "insurance_evidence_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      invoices: {
        Row: {
          created_at: string;
          currency: string;
          due_at: string | null;
          hosted_invoice_url: string | null;
          id: string;
          invoice_number: string | null;
          invoice_pdf_url: string | null;
          organization_id: string;
          paid_at: string | null;
          status: "draft" | "open" | "paid" | "void" | "uncollectible" | "overdue";
          stripe_invoice_id: string | null;
          subtotal_cents: number;
          tax_cents: number;
          total_cents: number;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          created_at?: string | null;
          currency?: string | null;
          due_at?: string | null;
          hosted_invoice_url?: string | null;
          id?: string | null;
          invoice_number?: string | null;
          invoice_pdf_url?: string | null;
          paid_at?: string | null;
          status?: "draft" | "open" | "paid" | "void" | "uncollectible" | "overdue" | null;
          stripe_invoice_id?: string | null;
          subtotal_cents?: number | null;
          tax_cents?: number | null;
          total_cents?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          currency?: string | null;
          due_at?: string | null;
          hosted_invoice_url?: string | null;
          id?: string | null;
          invoice_number?: string | null;
          invoice_pdf_url?: string | null;
          organization_id?: string | null;
          paid_at?: string | null;
          status?: "draft" | "open" | "paid" | "void" | "uncollectible" | "overdue" | null;
          stripe_invoice_id?: string | null;
          subtotal_cents?: number | null;
          tax_cents?: number | null;
          total_cents?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "invoices_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      isp_assessments: {
        Row: {
          bandwidth_current: string | null;
          bandwidth_needed: string | null;
          client_name: string;
          consolidation_score: number;
          contract_length_months: number;
          contract_status: string;
          created_at: string;
          created_by: string | null;
          current_cost: number | null;
          current_provider: string | null;
          id: string;
          monthly_cost: number;
          notes: string | null;
          organization_id: string;
          phone_lines: number;
          recommendation: string | null;
          recommended_cost: number | null;
          recommended_provider: string | null;
          services: string | null;
          status: string;
          updated_at: string;
          voip_ready: boolean;
        };
        Insert: {
          client_name: string;
          organization_id: string;
          bandwidth_current?: string | null;
          bandwidth_needed?: string | null;
          consolidation_score?: number | null;
          contract_length_months?: number | null;
          contract_status?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          current_cost?: number | null;
          current_provider?: string | null;
          id?: string | null;
          monthly_cost?: number | null;
          notes?: string | null;
          phone_lines?: number | null;
          recommendation?: string | null;
          recommended_cost?: number | null;
          recommended_provider?: string | null;
          services?: string | null;
          status?: string | null;
          updated_at?: string | null;
          voip_ready?: boolean | null;
        };
        Update: {
          bandwidth_current?: string | null;
          bandwidth_needed?: string | null;
          client_name?: string | null;
          consolidation_score?: number | null;
          contract_length_months?: number | null;
          contract_status?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          current_cost?: number | null;
          current_provider?: string | null;
          id?: string | null;
          monthly_cost?: number | null;
          notes?: string | null;
          organization_id?: string | null;
          phone_lines?: number | null;
          recommendation?: string | null;
          recommended_cost?: number | null;
          recommended_provider?: string | null;
          services?: string | null;
          status?: string | null;
          updated_at?: string | null;
          voip_ready?: boolean | null;
        };
        Relationships: [
          { foreignKeyName: "isp_assessments_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      kb_article_generations: {
        Row: {
          created_at: string;
          created_by: string | null;
          generated_at: string | null;
          generated_body: string | null;
          generated_content: string | null;
          id: string;
          organization_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          reviewed_content: string | null;
          source_ticket_id: string | null;
          source_title: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          created_at?: string | null;
          created_by?: string | null;
          generated_at?: string | null;
          generated_body?: string | null;
          generated_content?: string | null;
          id?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          reviewed_content?: string | null;
          source_ticket_id?: string | null;
          source_title?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          generated_at?: string | null;
          generated_body?: string | null;
          generated_content?: string | null;
          id?: string | null;
          organization_id?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          reviewed_content?: string | null;
          source_ticket_id?: string | null;
          source_title?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "kb_article_generations_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
          { foreignKeyName: "kb_article_generations_source_ticket_id_fkey", columns: ["source_ticket_id"], isOneToOne: false, referencedRelation: "tickets", referencedColumns: ["id"] },
        ];
      };      knowledge_articles: {
        Row: {
          category: string | null;
          content: string | null;
          created_at: string;
          created_by: string | null;
          helpful_count: number;
          id: string;
          is_published: boolean;
          not_helpful_count: number;
          organization_id: string;
          tags: string[] | null;
          title: string;
          updated_at: string;
          view_count: number;
        };
        Insert: {
          organization_id: string;
          title: string;
          category?: string | null;
          content?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          helpful_count?: number | null;
          id?: string | null;
          is_published?: boolean | null;
          not_helpful_count?: number | null;
          tags?: string[] | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          category?: string | null;
          content?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          helpful_count?: number | null;
          id?: string | null;
          is_published?: boolean | null;
          not_helpful_count?: number | null;
          organization_id?: string | null;
          tags?: string[] | null;
          title?: string | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          { foreignKeyName: "knowledge_articles_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      knowledge_base_articles: {
        Row: {
          body: string;
          category: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          is_published: boolean;
          organization_id: string;
          tags: string[] | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          organization_id: string;
          title: string;
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          is_published?: boolean | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          body?: string | null;
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          is_published?: boolean | null;
          organization_id?: string | null;
          tags?: string[] | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "knowledge_base_articles_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      license_allocations: {
        Row: {
          billing_cycle: string;
          cost_per_seat: number | null;
          created_at: string;
          created_by: string | null;
          id: string;
          last_audit_date: string | null;
          license_type: string;
          notes: string | null;
          organization_id: string;
          software_name: string;
          status: string;
          total_seats: number;
          updated_at: string;
          used_seats: number;
        };
        Insert: {
          organization_id: string;
          software_name: string;
          billing_cycle?: string | null;
          cost_per_seat?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          last_audit_date?: string | null;
          license_type?: string | null;
          notes?: string | null;
          status?: string | null;
          total_seats?: number | null;
          updated_at?: string | null;
          used_seats?: number | null;
        };
        Update: {
          billing_cycle?: string | null;
          cost_per_seat?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          last_audit_date?: string | null;
          license_type?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          software_name?: string | null;
          status?: string | null;
          total_seats?: number | null;
          updated_at?: string | null;
          used_seats?: number | null;
        };
        Relationships: [
          { foreignKeyName: "license_allocations_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      license_tracking: {
        Row: {
          annual_cost: number | null;
          assigned_seats: number;
          cost_per_seat: number | null;
          created_at: string;
          created_by: string | null;
          id: string;
          optimization_notes: string | null;
          organization_id: string;
          product_name: string;
          reclaimable_savings: number | null;
          renewal_date: string | null;
          status: string;
          total_seats: number;
          unused_seats: number;
          updated_at: string;
          vendor: string;
        };
        Insert: {
          organization_id: string;
          product_name: string;
          vendor: string;
          annual_cost?: number | null;
          assigned_seats?: number | null;
          cost_per_seat?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          optimization_notes?: string | null;
          reclaimable_savings?: number | null;
          renewal_date?: string | null;
          status?: string | null;
          total_seats?: number | null;
          unused_seats?: number | null;
          updated_at?: string | null;
        };
        Update: {
          annual_cost?: number | null;
          assigned_seats?: number | null;
          cost_per_seat?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          optimization_notes?: string | null;
          organization_id?: string | null;
          product_name?: string | null;
          reclaimable_savings?: number | null;
          renewal_date?: string | null;
          status?: string | null;
          total_seats?: number | null;
          unused_seats?: number | null;
          updated_at?: string | null;
          vendor?: string | null;
        };
        Relationships: [
          { foreignKeyName: "license_tracking_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      m365_hardening: {
        Row: {
          admin_count: number;
          audit_logging_enabled: boolean;
          conditional_access_configured: boolean;
          created_at: string;
          created_by: string | null;
          defender_configured: boolean;
          dlp_configured: boolean;
          guest_count: number;
          id: string;
          last_assessment_at: string | null;
          last_scanned_at: string | null;
          legacy_auth_blocked: boolean;
          mfa_enforced: boolean;
          next_review_at: string | null;
          next_scan_at: string | null;
          notes: string | null;
          organization_id: string;
          overall_score: number | null;
          scan_status: string | null;
          shared_mailbox_count: number;
          status: string;
          tenant_domain: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          tenant_domain: string;
          admin_count?: number | null;
          audit_logging_enabled?: boolean | null;
          conditional_access_configured?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          defender_configured?: boolean | null;
          dlp_configured?: boolean | null;
          guest_count?: number | null;
          id?: string | null;
          last_assessment_at?: string | null;
          last_scanned_at?: string | null;
          legacy_auth_blocked?: boolean | null;
          mfa_enforced?: boolean | null;
          next_review_at?: string | null;
          next_scan_at?: string | null;
          notes?: string | null;
          overall_score?: number | null;
          scan_status?: string | null;
          shared_mailbox_count?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          admin_count?: number | null;
          audit_logging_enabled?: boolean | null;
          conditional_access_configured?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          defender_configured?: boolean | null;
          dlp_configured?: boolean | null;
          guest_count?: number | null;
          id?: string | null;
          last_assessment_at?: string | null;
          last_scanned_at?: string | null;
          legacy_auth_blocked?: boolean | null;
          mfa_enforced?: boolean | null;
          next_review_at?: string | null;
          next_scan_at?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          overall_score?: number | null;
          scan_status?: string | null;
          shared_mailbox_count?: number | null;
          status?: string | null;
          tenant_domain?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "m365_hardening_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      maintenance_notices: {
        Row: {
          affected_component_ids: string[];
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          organization_id: string;
          scheduled_end: string;
          scheduled_start: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          scheduled_end: string;
          scheduled_start: string;
          title: string;
          affected_component_ids?: string[] | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          affected_component_ids?: string[] | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          organization_id?: string | null;
          scheduled_end?: string | null;
          scheduled_start?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "maintenance_notices_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      memberships: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          id: string;
          invited_by: string | null;
          is_billing_contact: boolean;
          is_security_contact: boolean;
          job_title: string | null;
          organization_id: string;
          role_id: string;
          status: "pending" | "approved" | "rejected" | "suspended";
          updated_at: string;
          user_id: string;
        };
        Insert: {
          organization_id: string;
          role_id: string;
          user_id: string;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          id?: string | null;
          invited_by?: string | null;
          is_billing_contact?: boolean | null;
          is_security_contact?: boolean | null;
          job_title?: string | null;
          status?: "pending" | "approved" | "rejected" | "suspended" | null;
          updated_at?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          id?: string | null;
          invited_by?: string | null;
          is_billing_contact?: boolean | null;
          is_security_contact?: boolean | null;
          job_title?: string | null;
          organization_id?: string | null;
          role_id?: string | null;
          status?: "pending" | "approved" | "rejected" | "suspended" | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "memberships_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
          { foreignKeyName: "memberships_role_id_fkey", columns: ["role_id"], isOneToOne: false, referencedRelation: "roles", referencedColumns: ["id"] },
        ];
      };      module_comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          edited_at: string | null;
          entity_id: string;
          entity_type: string;
          id: string;
          is_edited: boolean;
          is_internal: boolean;
          module_key: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          body: string;
          entity_id: string;
          entity_type: string;
          module_key: string;
          organization_id: string;
          created_at?: string | null;
          edited_at?: string | null;
          id?: string | null;
          is_edited?: boolean | null;
          is_internal?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          author_id?: string | null;
          body?: string | null;
          created_at?: string | null;
          edited_at?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string | null;
          is_edited?: boolean | null;
          is_internal?: boolean | null;
          module_key?: string | null;
          organization_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "module_comments_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      module_timeline_events: {
        Row: {
          actor_user_id: string | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          event_data: Json;
          event_type: string;
          id: string;
          module_key: string;
          organization_id: string;
        };
        Insert: {
          entity_id: string;
          entity_type: string;
          event_type: string;
          module_key: string;
          organization_id: string;
          actor_user_id?: string | null;
          created_at?: string | null;
          event_data?: Json | null;
          id?: string | null;
        };
        Update: {
          actor_user_id?: string | null;
          created_at?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          event_data?: Json | null;
          event_type?: string | null;
          id?: string | null;
          module_key?: string | null;
          organization_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "module_timeline_events_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      network_diagrams: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          diagram: Json;
          id: string;
          name: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          organization_id: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          diagram?: Json | null;
          id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          diagram?: Json | null;
          id?: string | null;
          name?: string | null;
          organization_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "network_diagrams_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      notification_preferences: {
        Row: {
          channel: "email" | "sms" | "in_app";
          created_at: string;
          enabled: boolean;
          id: string;
          module_key: string;
          organization_id: string;
          user_id: string;
          version: number;
        };
        Insert: {
          channel: "email" | "sms" | "in_app";
          module_key: string;
          organization_id: string;
          user_id: string;
          created_at?: string | null;
          enabled?: boolean | null;
          id?: string | null;
          version?: number | null;
        };
        Update: {
          channel?: "email" | "sms" | "in_app" | null;
          created_at?: string | null;
          enabled?: boolean | null;
          id?: string | null;
          module_key?: string | null;
          organization_id?: string | null;
          user_id?: string | null;
          version?: number | null;
        };
        Relationships: [
          { foreignKeyName: "notification_preferences_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      notifications: {
        Row: {
          action: string;
          body: string;
          created_at: string;
          id: string;
          module: string;
          module_id: string | null;
          notification_key: string | null;
          organization_id: string | null;
          read: boolean;
          read_at: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          action: string;
          body: string;
          module: string;
          title: string;
          user_id: string;
          created_at?: string | null;
          id?: string | null;
          module_id?: string | null;
          notification_key?: string | null;
          organization_id?: string | null;
          read?: boolean | null;
          read_at?: string | null;
        };
        Update: {
          action?: string | null;
          body?: string | null;
          created_at?: string | null;
          id?: string | null;
          module?: string | null;
          module_id?: string | null;
          notification_key?: string | null;
          organization_id?: string | null;
          read?: boolean | null;
          read_at?: string | null;
          title?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "notifications_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      offboarding_checklists: {
        Row: {
          access_reviewed: boolean;
          account_disabled: boolean;
          completed_at: string | null;
          completed_steps: string[];
          created_at: string;
          created_by: string | null;
          department: string | null;
          employee_email: string | null;
          employee_name: string;
          evidence_collected: boolean;
          id: string;
          license_reclaimed: boolean;
          mailbox_converted: boolean;
          notes: string | null;
          offboarding_date: string | null;
          onedrive_transferred: boolean;
          organization_id: string;
          status: string;
          submitted_at: string | null;
          updated_at: string;
        };
        Insert: {
          employee_name: string;
          organization_id: string;
          access_reviewed?: boolean | null;
          account_disabled?: boolean | null;
          completed_at?: string | null;
          completed_steps?: string[] | null;
          created_at?: string | null;
          created_by?: string | null;
          department?: string | null;
          employee_email?: string | null;
          evidence_collected?: boolean | null;
          id?: string | null;
          license_reclaimed?: boolean | null;
          mailbox_converted?: boolean | null;
          notes?: string | null;
          offboarding_date?: string | null;
          onedrive_transferred?: boolean | null;
          status?: string | null;
          submitted_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          access_reviewed?: boolean | null;
          account_disabled?: boolean | null;
          completed_at?: string | null;
          completed_steps?: string[] | null;
          created_at?: string | null;
          created_by?: string | null;
          department?: string | null;
          employee_email?: string | null;
          employee_name?: string | null;
          evidence_collected?: boolean | null;
          id?: string | null;
          license_reclaimed?: boolean | null;
          mailbox_converted?: boolean | null;
          notes?: string | null;
          offboarding_date?: string | null;
          onedrive_transferred?: boolean | null;
          organization_id?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "offboarding_checklists_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      onboarding_clients: {
        Row: {
          backup_configured: boolean;
          client_name: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          discovery_complete: boolean;
          documentation_prepared: boolean;
          handoff_complete: boolean;
          id: string;
          m365_setup_complete: boolean;
          network_documented: boolean;
          notes: string | null;
          organization_id: string;
          security_baseline_applied: boolean;
          started_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          client_name: string;
          organization_id: string;
          backup_configured?: boolean | null;
          completed_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          discovery_complete?: boolean | null;
          documentation_prepared?: boolean | null;
          handoff_complete?: boolean | null;
          id?: string | null;
          m365_setup_complete?: boolean | null;
          network_documented?: boolean | null;
          notes?: string | null;
          security_baseline_applied?: boolean | null;
          started_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          backup_configured?: boolean | null;
          client_name?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          discovery_complete?: boolean | null;
          documentation_prepared?: boolean | null;
          handoff_complete?: boolean | null;
          id?: string | null;
          m365_setup_complete?: boolean | null;
          network_documented?: boolean | null;
          notes?: string | null;
          organization_id?: string | null;
          security_baseline_applied?: boolean | null;
          started_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "onboarding_clients_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      organization_domains: {
        Row: {
          auto_approve: boolean;
          created_at: string;
          domain: string;
          id: string;
          organization_id: string;
        };
        Insert: {
          domain: string;
          organization_id: string;
          auto_approve?: boolean | null;
          created_at?: string | null;
          id?: string | null;
        };
        Update: {
          auto_approve?: boolean | null;
          created_at?: string | null;
          domain?: string | null;
          id?: string | null;
          organization_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "organization_domains_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      organizations: {
        Row: {
          accent_color: string | null;
          billing_email: string | null;
          brand_color: string | null;
          created_at: string;
          created_by: string | null;
          custom_domain: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          primary_domain: string | null;
          settings: Json;
          slug: string;
          status: "pending" | "approved" | "rejected" | "suspended";
          support_plan: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          name: string;
          slug: string;
          accent_color?: string | null;
          billing_email?: string | null;
          brand_color?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          custom_domain?: string | null;
          id?: string | null;
          logo_url?: string | null;
          primary_domain?: string | null;
          settings?: Json | null;
          status?: "pending" | "approved" | "rejected" | "suspended" | null;
          support_plan?: string | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Update: {
          accent_color?: string | null;
          billing_email?: string | null;
          brand_color?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          custom_domain?: string | null;
          id?: string | null;
          logo_url?: string | null;
          name?: string | null;
          primary_domain?: string | null;
          settings?: Json | null;
          slug?: string | null;
          status?: "pending" | "approved" | "rejected" | "suspended" | null;
          support_plan?: string | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Relationships: [
        ];
      };      patch_compliance: {
        Row: {
          compliance_pct: number | null;
          created_at: string;
          created_by: string | null;
          critical_patches: number;
          device_group: string;
          exception_count: number;
          id: string;
          last_checked_at: string | null;
          last_patch_date: string | null;
          next_maintenance_window: string | null;
          notes: string | null;
          organization_id: string;
          patched_devices: number;
          pending_patches: number;
          status: string;
          total_devices: number;
          updated_at: string;
        };
        Insert: {
          device_group: string;
          organization_id: string;
          compliance_pct?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          critical_patches?: number | null;
          exception_count?: number | null;
          id?: string | null;
          last_checked_at?: string | null;
          last_patch_date?: string | null;
          next_maintenance_window?: string | null;
          notes?: string | null;
          patched_devices?: number | null;
          pending_patches?: number | null;
          status?: string | null;
          total_devices?: number | null;
          updated_at?: string | null;
        };
        Update: {
          compliance_pct?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          critical_patches?: number | null;
          device_group?: string | null;
          exception_count?: number | null;
          id?: string | null;
          last_checked_at?: string | null;
          last_patch_date?: string | null;
          next_maintenance_window?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          patched_devices?: number | null;
          pending_patches?: number | null;
          status?: string | null;
          total_devices?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "patch_compliance_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      payments: {
        Row: {
          amount_cents: number;
          created_at: string;
          currency: string;
          id: string;
          invoice_id: string | null;
          organization_id: string;
          paid_at: string | null;
          status: string;
          stripe_payment_intent_id: string | null;
        };
        Insert: {
          amount_cents: number;
          organization_id: string;
          status: string;
          created_at?: string | null;
          currency?: string | null;
          id?: string | null;
          invoice_id?: string | null;
          paid_at?: string | null;
          stripe_payment_intent_id?: string | null;
        };
        Update: {
          amount_cents?: number | null;
          created_at?: string | null;
          currency?: string | null;
          id?: string | null;
          invoice_id?: string | null;
          organization_id?: string | null;
          paid_at?: string | null;
          status?: string | null;
          stripe_payment_intent_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "payments_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
          { foreignKeyName: "payments_invoice_id_fkey", columns: ["invoice_id"], isOneToOne: false, referencedRelation: "invoices", referencedColumns: ["id"] },
        ];
      };      permissions: {
        Row: {
          action_key: string;
          description: string | null;
          group_key: string;
          id: string;
          label: string | null;
          module_key: string;
          scope: string;
        };
        Insert: {
          action_key: string;
          module_key: string;
          description?: string | null;
          group_key?: string | null;
          id?: string | null;
          label?: string | null;
          scope?: string | null;
        };
        Update: {
          action_key?: string | null;
          description?: string | null;
          group_key?: string | null;
          id?: string | null;
          label?: string | null;
          module_key?: string | null;
          scope?: string | null;
        };
        Relationships: [
        ];
      };      phishing_campaigns: {
        Row: {
          campaign_name: string;
          click_count: number;
          clicked_count: number;
          created_at: string;
          created_by: string | null;
          ended_at: string | null;
          id: string;
          launched_at: string | null;
          notes: string | null;
          opened_count: number;
          organization_id: string;
          reported_count: number;
          started_at: string | null;
          status: string;
          target_count: number;
          updated_at: string;
        };
        Insert: {
          campaign_name: string;
          organization_id: string;
          click_count?: number | null;
          clicked_count?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          ended_at?: string | null;
          id?: string | null;
          launched_at?: string | null;
          notes?: string | null;
          opened_count?: number | null;
          reported_count?: number | null;
          started_at?: string | null;
          status?: string | null;
          target_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          campaign_name?: string | null;
          click_count?: number | null;
          clicked_count?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          ended_at?: string | null;
          id?: string | null;
          launched_at?: string | null;
          notes?: string | null;
          opened_count?: number | null;
          organization_id?: string | null;
          reported_count?: number | null;
          started_at?: string | null;
          status?: string | null;
          target_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "phishing_campaigns_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      port_maps: {
        Row: {
          connected_device: string | null;
          created_at: string;
          created_by: string | null;
          device_type: string | null;
          id: string;
          notes: string | null;
          organization_id: string;
          poe_enabled: boolean;
          port_number: number;
          speed: string;
          switch_name: string;
          updated_at: string;
          uplink: boolean;
          vlan_id: number | null;
          vlan_name: string | null;
          wall_jack_label: string | null;
        };
        Insert: {
          organization_id: string;
          port_number: number;
          switch_name: string;
          connected_device?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          device_type?: string | null;
          id?: string | null;
          notes?: string | null;
          poe_enabled?: boolean | null;
          speed?: string | null;
          updated_at?: string | null;
          uplink?: boolean | null;
          vlan_id?: number | null;
          vlan_name?: string | null;
          wall_jack_label?: string | null;
        };
        Update: {
          connected_device?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          device_type?: string | null;
          id?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          poe_enabled?: boolean | null;
          port_number?: number | null;
          speed?: string | null;
          switch_name?: string | null;
          updated_at?: string | null;
          uplink?: boolean | null;
          vlan_id?: number | null;
          vlan_name?: string | null;
          wall_jack_label?: string | null;
        };
        Relationships: [
          { foreignKeyName: "port_maps_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      portal_module_settings: {
        Row: {
          created_at: string;
          id: string;
          module_key: string;
          organization_id: string;
          settings: Json;
          updated_at: string;
        };
        Insert: {
          module_key: string;
          organization_id: string;
          created_at?: string | null;
          id?: string | null;
          settings?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string | null;
          module_key?: string | null;
          organization_id?: string | null;
          settings?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "portal_module_settings_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      powershell_scripts: {
        Row: {
          approval_required: boolean;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          organization_id: string;
          policy_checked: boolean;
          policy_violations: string[];
          risk_level: string;
          script_content: string | null;
          status: string;
          submitted_at: string | null;
          updated_at: string;
        };
        Insert: {
          name: string;
          organization_id: string;
          approval_required?: boolean | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          policy_checked?: boolean | null;
          policy_violations?: string[] | null;
          risk_level?: string | null;
          script_content?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          approval_required?: boolean | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          name?: string | null;
          organization_id?: string | null;
          policy_checked?: boolean | null;
          policy_violations?: string[] | null;
          risk_level?: string | null;
          script_content?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "powershell_scripts_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      procurement_quotes: {
        Row: {
          comparison_notes: string | null;
          competitor_quote: number | null;
          created_at: string;
          created_by: string | null;
          id: string;
          notes: string | null;
          organization_id: string;
          product: string;
          purchased_at: string | null;
          quote_amount: number | null;
          selected: boolean;
          updated_at: string;
          vendor_name: string;
        };
        Insert: {
          organization_id: string;
          product: string;
          vendor_name: string;
          comparison_notes?: string | null;
          competitor_quote?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          notes?: string | null;
          purchased_at?: string | null;
          quote_amount?: number | null;
          selected?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          comparison_notes?: string | null;
          competitor_quote?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          product?: string | null;
          purchased_at?: string | null;
          quote_amount?: number | null;
          selected?: boolean | null;
          updated_at?: string | null;
          vendor_name?: string | null;
        };
        Relationships: [
          { foreignKeyName: "procurement_quotes_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          default_organization_id: string | null;
          email: string | null;
          encrypted_pii: Json | null;
          full_name: string | null;
          id: string | null;
          is_super_admin: boolean;
          metadata: Json;
          phone: string | null;
          title: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          default_organization_id?: string | null;
          email?: string | null;
          encrypted_pii?: Json | null;
          full_name?: string | null;
          id?: string | null;
          is_super_admin?: boolean | null;
          metadata?: Json | null;
          phone?: string | null;
          title?: string | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          default_organization_id?: string | null;
          email?: string | null;
          encrypted_pii?: Json | null;
          full_name?: string | null;
          id?: string | null;
          is_super_admin?: boolean | null;
          metadata?: Json | null;
          phone?: string | null;
          title?: string | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Relationships: [
          { foreignKeyName: "profiles_default_organization_id_fkey", columns: ["default_organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      project_dependencies: {
        Row: {
          blocked_by_project_id: string | null;
          created_at: string;
          dependency_type: string;
          depends_on_milestone_id: string | null;
          depends_on_task_id: string | null;
          id: string;
          project_id: string;
        };
        Insert: {
          project_id: string;
          blocked_by_project_id?: string | null;
          created_at?: string | null;
          dependency_type?: string | null;
          depends_on_milestone_id?: string | null;
          depends_on_task_id?: string | null;
          id?: string | null;
        };
        Update: {
          blocked_by_project_id?: string | null;
          created_at?: string | null;
          dependency_type?: string | null;
          depends_on_milestone_id?: string | null;
          depends_on_task_id?: string | null;
          id?: string | null;
          project_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "project_dependencies_project_id_fkey", columns: ["project_id"], isOneToOne: false, referencedRelation: "projects", referencedColumns: ["id"] },
          { foreignKeyName: "project_dependencies_depends_on_milestone_id_fkey", columns: ["depends_on_milestone_id"], isOneToOne: false, referencedRelation: "project_milestones", referencedColumns: ["id"] },
          { foreignKeyName: "project_dependencies_blocked_by_project_id_fkey", columns: ["blocked_by_project_id"], isOneToOne: false, referencedRelation: "projects", referencedColumns: ["id"] },
        ];
      };      project_milestones: {
        Row: {
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          due_date: string | null;
          id: string;
          phase_id: string | null;
          project_id: string;
          status: string;
          title: string;
        };
        Insert: {
          project_id: string;
          title: string;
          completed_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string | null;
          phase_id?: string | null;
          status?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string | null;
          phase_id?: string | null;
          project_id?: string | null;
          status?: string | null;
          title?: string | null;
        };
        Relationships: [
          { foreignKeyName: "project_milestones_project_id_fkey", columns: ["project_id"], isOneToOne: false, referencedRelation: "projects", referencedColumns: ["id"] },
          { foreignKeyName: "project_milestones_phase_id_fkey", columns: ["phase_id"], isOneToOne: false, referencedRelation: "project_phases", referencedColumns: ["id"] },
        ];
      };      project_phases: {
        Row: {
          created_at: string;
          description: string | null;
          end_date: string | null;
          id: string;
          name: string;
          project_id: string;
          sort_order: number;
          start_date: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          project_id: string;
          created_at?: string | null;
          description?: string | null;
          end_date?: string | null;
          id?: string | null;
          sort_order?: number | null;
          start_date?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          end_date?: string | null;
          id?: string | null;
          name?: string | null;
          project_id?: string | null;
          sort_order?: number | null;
          start_date?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "project_phases_project_id_fkey", columns: ["project_id"], isOneToOne: false, referencedRelation: "projects", referencedColumns: ["id"] },
        ];
      };      project_task_comment_reads: {
        Row: {
          last_seen_at: string;
          organization_id: string;
          task_id: string;
          user_id: string;
        };
        Insert: {
          organization_id: string;
          task_id: string;
          user_id: string;
          last_seen_at?: string | null;
        };
        Update: {
          last_seen_at?: string | null;
          organization_id?: string | null;
          task_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "project_task_comment_reads_task_id_fkey", columns: ["task_id"], isOneToOne: false, referencedRelation: "project_tasks", referencedColumns: ["id"] },
          { foreignKeyName: "project_task_comment_reads_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      project_task_comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          is_internal: boolean;
          organization_id: string;
          project_id: string;
          task_id: string;
        };
        Insert: {
          author_id: string;
          body: string;
          organization_id: string;
          project_id: string;
          task_id: string;
          created_at?: string | null;
          id?: string | null;
          is_internal?: boolean | null;
        };
        Update: {
          author_id?: string | null;
          body?: string | null;
          created_at?: string | null;
          id?: string | null;
          is_internal?: boolean | null;
          organization_id?: string | null;
          project_id?: string | null;
          task_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "project_task_comments_task_id_fkey", columns: ["task_id"], isOneToOne: false, referencedRelation: "project_tasks", referencedColumns: ["id"] },
          { foreignKeyName: "project_task_comments_project_id_fkey", columns: ["project_id"], isOneToOne: false, referencedRelation: "projects", referencedColumns: ["id"] },
          { foreignKeyName: "project_task_comments_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      project_tasks: {
        Row: {
          actual_hours: number | null;
          approval_required: boolean;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          details: string | null;
          due_at: string | null;
          due_date: string | null;
          epic_key: string | null;
          estimate_hours: number | null;
          external_jira_issue_key: string | null;
          id: string;
          issue_type: string | null;
          jira_last_synced_at: string | null;
          labels: string[] | null;
          metadata: Json;
          organization_id: string;
          owner_id: string | null;
          parent_task_id: string | null;
          priority: string;
          project_id: string;
          resolution: string | null;
          sort_order: number;
          sprint: string | null;
          status: "todo" | "in_progress" | "in_review" | "blocked" | "done";
          title: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          created_by: string;
          organization_id: string;
          project_id: string;
          title: string;
          actual_hours?: number | null;
          approval_required?: boolean | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          description?: string | null;
          details?: string | null;
          due_at?: string | null;
          due_date?: string | null;
          epic_key?: string | null;
          estimate_hours?: number | null;
          external_jira_issue_key?: string | null;
          id?: string | null;
          issue_type?: string | null;
          jira_last_synced_at?: string | null;
          labels?: string[] | null;
          metadata?: Json | null;
          owner_id?: string | null;
          parent_task_id?: string | null;
          priority?: string | null;
          resolution?: string | null;
          sort_order?: number | null;
          sprint?: string | null;
          status?: "todo" | "in_progress" | "in_review" | "blocked" | "done" | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Update: {
          actual_hours?: number | null;
          approval_required?: boolean | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          details?: string | null;
          due_at?: string | null;
          due_date?: string | null;
          epic_key?: string | null;
          estimate_hours?: number | null;
          external_jira_issue_key?: string | null;
          id?: string | null;
          issue_type?: string | null;
          jira_last_synced_at?: string | null;
          labels?: string[] | null;
          metadata?: Json | null;
          organization_id?: string | null;
          owner_id?: string | null;
          parent_task_id?: string | null;
          priority?: string | null;
          project_id?: string | null;
          resolution?: string | null;
          sort_order?: number | null;
          sprint?: string | null;
          status?: "todo" | "in_progress" | "in_review" | "blocked" | "done" | null;
          title?: string | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Relationships: [
          { foreignKeyName: "project_tasks_project_id_fkey", columns: ["project_id"], isOneToOne: false, referencedRelation: "projects", referencedColumns: ["id"] },
          { foreignKeyName: "project_tasks_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
          { foreignKeyName: "project_tasks_parent_task_id_fkey", columns: ["parent_task_id"], isOneToOne: false, referencedRelation: "project_tasks", referencedColumns: ["id"] },
        ];
      };      project_updates: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          is_internal: boolean;
          is_pinned: boolean;
          organization_id: string;
          project_id: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          body: string;
          organization_id: string;
          project_id: string;
          created_at?: string | null;
          id?: string | null;
          is_internal?: boolean | null;
          is_pinned?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          author_id?: string | null;
          body?: string | null;
          created_at?: string | null;
          id?: string | null;
          is_internal?: boolean | null;
          is_pinned?: boolean | null;
          organization_id?: string | null;
          project_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "project_updates_project_id_fkey", columns: ["project_id"], isOneToOne: false, referencedRelation: "projects", referencedColumns: ["id"] },
          { foreignKeyName: "project_updates_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      projects: {
        Row: {
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          due_at: string | null;
          due_date: string | null;
          external_jira_project_key: string | null;
          id: string;
          jira_last_synced_at: string | null;
          metadata: Json;
          name: string;
          organization_id: string;
          owner_id: string | null;
          priority: string;
          progress_percent: number;
          start_date: string | null;
          starts_at: string | null;
          status: "planned" | "active" | "blocked" | "client_review" | "completed" | "archived";
          updated_at: string;
          version: number;
        };
        Insert: {
          created_by: string;
          name: string;
          organization_id: string;
          created_at?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          due_at?: string | null;
          due_date?: string | null;
          external_jira_project_key?: string | null;
          id?: string | null;
          jira_last_synced_at?: string | null;
          metadata?: Json | null;
          owner_id?: string | null;
          priority?: string | null;
          progress_percent?: number | null;
          start_date?: string | null;
          starts_at?: string | null;
          status?: "planned" | "active" | "blocked" | "client_review" | "completed" | "archived" | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          due_at?: string | null;
          due_date?: string | null;
          external_jira_project_key?: string | null;
          id?: string | null;
          jira_last_synced_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          organization_id?: string | null;
          owner_id?: string | null;
          priority?: string | null;
          progress_percent?: number | null;
          start_date?: string | null;
          starts_at?: string | null;
          status?: "planned" | "active" | "blocked" | "client_review" | "completed" | "archived" | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Relationships: [
          { foreignKeyName: "projects_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      proposal_line_items: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_optional: boolean;
          is_recurring: boolean;
          item_type: string;
          name: string;
          notes: string | null;
          phase_id: string | null;
          proposal_id: string;
          quantity: number;
          recurring_interval: string;
          sort_order: number;
          total_price: number;
          unit_price: number;
          updated_at: string;
        };
        Insert: {
          name: string;
          proposal_id: string;
          created_at?: string | null;
          description?: string | null;
          id?: string | null;
          is_optional?: boolean | null;
          is_recurring?: boolean | null;
          item_type?: string | null;
          notes?: string | null;
          phase_id?: string | null;
          quantity?: number | null;
          recurring_interval?: string | null;
          sort_order?: number | null;
          total_price?: number | null;
          unit_price?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string | null;
          is_optional?: boolean | null;
          is_recurring?: boolean | null;
          item_type?: string | null;
          name?: string | null;
          notes?: string | null;
          phase_id?: string | null;
          proposal_id?: string | null;
          quantity?: number | null;
          recurring_interval?: string | null;
          sort_order?: number | null;
          total_price?: number | null;
          unit_price?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "proposal_line_items_proposal_id_fkey", columns: ["proposal_id"], isOneToOne: false, referencedRelation: "proposals", referencedColumns: ["id"] },
          { foreignKeyName: "proposal_line_items_phase_id_fkey", columns: ["phase_id"], isOneToOne: false, referencedRelation: "proposal_phases", referencedColumns: ["id"] },
        ];
      };      proposal_phases: {
        Row: {
          assumptions: string | null;
          created_at: string;
          description: string | null;
          id: string;
          notes: string | null;
          proposal_id: string;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          proposal_id: string;
          title: string;
          assumptions?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string | null;
          notes?: string | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          assumptions?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string | null;
          notes?: string | null;
          proposal_id?: string | null;
          sort_order?: number | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "proposal_phases_proposal_id_fkey", columns: ["proposal_id"], isOneToOne: false, referencedRelation: "proposals", referencedColumns: ["id"] },
        ];
      };      proposals: {
        Row: {
          approval_request_id: string | null;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          expires_at: string | null;
          grand_total: number;
          id: string;
          metadata: Json;
          organization_id: string;
          owner_user_id: string | null;
          rejected_at: string | null;
          sent_at: string | null;
          status: string;
          title: string;
          total_labor: number;
          total_materials: number;
          total_one_time: number;
          total_recurring: number;
          updated_at: string;
          updated_by: string | null;
          valid_until: string | null;
          version: number;
          visibility: string;
        };
        Insert: {
          organization_id: string;
          title: string;
          approval_request_id?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          expires_at?: string | null;
          grand_total?: number | null;
          id?: string | null;
          metadata?: Json | null;
          owner_user_id?: string | null;
          rejected_at?: string | null;
          sent_at?: string | null;
          status?: string | null;
          total_labor?: number | null;
          total_materials?: number | null;
          total_one_time?: number | null;
          total_recurring?: number | null;
          updated_at?: string | null;
          updated_by?: string | null;
          valid_until?: string | null;
          version?: number | null;
          visibility?: string | null;
        };
        Update: {
          approval_request_id?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          expires_at?: string | null;
          grand_total?: number | null;
          id?: string | null;
          metadata?: Json | null;
          organization_id?: string | null;
          owner_user_id?: string | null;
          rejected_at?: string | null;
          sent_at?: string | null;
          status?: string | null;
          title?: string | null;
          total_labor?: number | null;
          total_materials?: number | null;
          total_one_time?: number | null;
          total_recurring?: number | null;
          updated_at?: string | null;
          updated_by?: string | null;
          valid_until?: string | null;
          version?: number | null;
          visibility?: string | null;
        };
        Relationships: [
          { foreignKeyName: "proposals_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
          { foreignKeyName: "proposals_approval_request_id_fkey", columns: ["approval_request_id"], isOneToOne: false, referencedRelation: "approval_requests", referencedColumns: ["id"] },
        ];
      };      public_interactions: {
        Row: {
          client_email: string | null;
          client_message: string | null;
          client_name: string | null;
          client_phone: string | null;
          company_name: string | null;
          created_at: string;
          employees: string | null;
          id: string;
          ip_address: string | null;
          location: string | null;
          platform: string | null;
          referrer: string | null;
          services_requested: string | null;
          status: string;
          submitted_at: string | null;
          urgency: string | null;
          user_agent: string | null;
        };
        Insert: {
          client_email?: string | null;
          client_message?: string | null;
          client_name?: string | null;
          client_phone?: string | null;
          company_name?: string | null;
          created_at?: string | null;
          employees?: string | null;
          id?: string | null;
          ip_address?: string | null;
          location?: string | null;
          platform?: string | null;
          referrer?: string | null;
          services_requested?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          urgency?: string | null;
          user_agent?: string | null;
        };
        Update: {
          client_email?: string | null;
          client_message?: string | null;
          client_name?: string | null;
          client_phone?: string | null;
          company_name?: string | null;
          created_at?: string | null;
          employees?: string | null;
          id?: string | null;
          ip_address?: string | null;
          location?: string | null;
          platform?: string | null;
          referrer?: string | null;
          services_requested?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          urgency?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
        ];
      };      qbr_reports: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          created_by: string | null;
          generated_at: string | null;
          generated_by: string | null;
          id: string;
          metadata: Json;
          organization_id: string;
          period_end: string | null;
          period_start: string | null;
          report_data: Json;
          sent_to_client_at: string | null;
          status: string;
          summary: string | null;
          title: string;
          updated_at: string;
          visibility: string;
        };
        Insert: {
          organization_id: string;
          title: string;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          generated_at?: string | null;
          generated_by?: string | null;
          id?: string | null;
          metadata?: Json | null;
          period_end?: string | null;
          period_start?: string | null;
          report_data?: Json | null;
          sent_to_client_at?: string | null;
          status?: string | null;
          summary?: string | null;
          updated_at?: string | null;
          visibility?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          generated_at?: string | null;
          generated_by?: string | null;
          id?: string | null;
          metadata?: Json | null;
          organization_id?: string | null;
          period_end?: string | null;
          period_start?: string | null;
          report_data?: Json | null;
          sent_to_client_at?: string | null;
          status?: string | null;
          summary?: string | null;
          title?: string | null;
          updated_at?: string | null;
          visibility?: string | null;
        };
        Relationships: [
          { foreignKeyName: "qbr_reports_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      retention_policies: {
        Row: {
          created_at: string;
          created_by: string | null;
          data_category: string;
          disposal_method: string | null;
          id: string;
          is_regulated: boolean;
          last_reviewed_at: string | null;
          next_review_at: string | null;
          notes: string | null;
          organization_id: string;
          regulation_reference: string | null;
          retention_period_days: number;
          status: string;
          system_name: string;
          updated_at: string;
        };
        Insert: {
          data_category: string;
          organization_id: string;
          retention_period_days: number;
          system_name: string;
          created_at?: string | null;
          created_by?: string | null;
          disposal_method?: string | null;
          id?: string | null;
          is_regulated?: boolean | null;
          last_reviewed_at?: string | null;
          next_review_at?: string | null;
          notes?: string | null;
          regulation_reference?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          data_category?: string | null;
          disposal_method?: string | null;
          id?: string | null;
          is_regulated?: boolean | null;
          last_reviewed_at?: string | null;
          next_review_at?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          regulation_reference?: string | null;
          retention_period_days?: number | null;
          status?: string | null;
          system_name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "retention_policies_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      risk_register: {
        Row: {
          acceptance_expires: string | null;
          accepted_at: string | null;
          accepted_by: string | null;
          accepting_controls: string | null;
          assessed_at: string | null;
          compensating_controls: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          impact: string;
          likelihood: string;
          mitigating_controls: string | null;
          organization_id: string;
          owner_user_id: string | null;
          risk_category: string;
          risk_description: string;
          risk_level: string | null;
          risk_score: number | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          risk_description: string;
          acceptance_expires?: string | null;
          accepted_at?: string | null;
          accepted_by?: string | null;
          accepting_controls?: string | null;
          assessed_at?: string | null;
          compensating_controls?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          impact?: string | null;
          likelihood?: string | null;
          mitigating_controls?: string | null;
          owner_user_id?: string | null;
          risk_category?: string | null;
          risk_level?: string | null;
          risk_score?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          acceptance_expires?: string | null;
          accepted_at?: string | null;
          accepted_by?: string | null;
          accepting_controls?: string | null;
          assessed_at?: string | null;
          compensating_controls?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string | null;
          impact?: string | null;
          likelihood?: string | null;
          mitigating_controls?: string | null;
          organization_id?: string | null;
          owner_user_id?: string | null;
          risk_category?: string | null;
          risk_description?: string | null;
          risk_level?: string | null;
          risk_score?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "risk_register_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      role_permissions: {
        Row: {
          permission_id: string;
          role_id: string;
        };
        Insert: {
          permission_id: string;
          role_id: string;
        };
        Update: {
          permission_id?: string | null;
          role_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "role_permissions_role_id_fkey", columns: ["role_id"], isOneToOne: false, referencedRelation: "roles", referencedColumns: ["id"] },
          { foreignKeyName: "role_permissions_permission_id_fkey", columns: ["permission_id"], isOneToOne: false, referencedRelation: "permissions", referencedColumns: ["id"] },
        ];
      };      roles: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_system: boolean;
          key: string;
          name: string;
        };
        Insert: {
          key: string;
          name: string;
          created_at?: string | null;
          description?: string | null;
          id?: string | null;
          is_system?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string | null;
          is_system?: boolean | null;
          key?: string | null;
          name?: string | null;
        };
        Relationships: [
        ];
      };      saas_audits: {
        Row: {
          annual_cost: number | null;
          cancellation_risk: string | null;
          classification: string;
          created_at: string;
          created_by: string | null;
          has_data_access: boolean;
          id: string;
          monthly_cost: number | null;
          notes: string | null;
          organization_id: string;
          payment_method: string | null;
          renewal_date: string | null;
          service_name: string;
          updated_at: string;
          usage_frequency: string | null;
          vendor_name: string;
        };
        Insert: {
          organization_id: string;
          service_name: string;
          vendor_name: string;
          annual_cost?: number | null;
          cancellation_risk?: string | null;
          classification?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          has_data_access?: boolean | null;
          id?: string | null;
          monthly_cost?: number | null;
          notes?: string | null;
          payment_method?: string | null;
          renewal_date?: string | null;
          updated_at?: string | null;
          usage_frequency?: string | null;
        };
        Update: {
          annual_cost?: number | null;
          cancellation_risk?: string | null;
          classification?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          has_data_access?: boolean | null;
          id?: string | null;
          monthly_cost?: number | null;
          notes?: string | null;
          organization_id?: string | null;
          payment_method?: string | null;
          renewal_date?: string | null;
          service_name?: string | null;
          updated_at?: string | null;
          usage_frequency?: string | null;
          vendor_name?: string | null;
        };
        Relationships: [
          { foreignKeyName: "saas_audits_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      satisfaction_pulse_schedules: {
        Row: {
          created_at: string;
          created_by: string | null;
          cron_expression: string | null;
          frequency: string | null;
          id: string;
          is_active: boolean;
          last_run_at: string | null;
          name: string;
          next_run_at: string | null;
          organization_id: string;
          template_id: string | null;
          trigger_config: Json;
          trigger_type: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          organization_id: string;
          created_at?: string | null;
          created_by?: string | null;
          cron_expression?: string | null;
          frequency?: string | null;
          id?: string | null;
          is_active?: boolean | null;
          last_run_at?: string | null;
          next_run_at?: string | null;
          template_id?: string | null;
          trigger_config?: Json | null;
          trigger_type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          cron_expression?: string | null;
          frequency?: string | null;
          id?: string | null;
          is_active?: boolean | null;
          last_run_at?: string | null;
          name?: string | null;
          next_run_at?: string | null;
          organization_id?: string | null;
          template_id?: string | null;
          trigger_config?: Json | null;
          trigger_type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "satisfaction_pulse_schedules_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
          { foreignKeyName: "satisfaction_pulse_schedules_template_id_fkey", columns: ["template_id"], isOneToOne: false, referencedRelation: "satisfaction_pulse_templates", referencedColumns: ["id"] },
        ];
      };      satisfaction_pulse_templates: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          organization_id: string;
          questions: Json;
          type: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          organization_id: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          is_active?: boolean | null;
          questions?: Json | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          is_active?: boolean | null;
          name?: string | null;
          organization_id?: string | null;
          questions?: Json | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "satisfaction_pulse_templates_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      satisfaction_pulses: {
        Row: {
          created_at: string;
          feedback: string | null;
          id: string;
          organization_id: string;
          question: string | null;
          rating: number;
          responded_at: string | null;
          respondent_organization_id: string | null;
          respondent_user_id: string | null;
          sent_at: string | null;
          source: string;
          source_entity_id: string | null;
          source_entity_type: string | null;
          status: string;
          subject: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          subject: string;
          created_at?: string | null;
          feedback?: string | null;
          id?: string | null;
          question?: string | null;
          rating?: number | null;
          responded_at?: string | null;
          respondent_organization_id?: string | null;
          respondent_user_id?: string | null;
          sent_at?: string | null;
          source?: string | null;
          source_entity_id?: string | null;
          source_entity_type?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          feedback?: string | null;
          id?: string | null;
          organization_id?: string | null;
          question?: string | null;
          rating?: number | null;
          responded_at?: string | null;
          respondent_organization_id?: string | null;
          respondent_user_id?: string | null;
          sent_at?: string | null;
          source?: string | null;
          source_entity_id?: string | null;
          source_entity_type?: string | null;
          status?: string | null;
          subject?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "satisfaction_pulses_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
          { foreignKeyName: "satisfaction_pulses_respondent_organization_id_fkey", columns: ["respondent_organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      scheduled_check_results: {
        Row: {
          check_target: string | null;
          check_type: string;
          checked_at: string;
          created_at: string;
          duration_ms: number | null;
          error_message: string | null;
          id: string;
          module_key: string;
          next_check_at: string | null;
          organization_id: string;
          result_data: Json;
          status: string;
        };
        Insert: {
          check_type: string;
          module_key: string;
          organization_id: string;
          check_target?: string | null;
          checked_at?: string | null;
          created_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string | null;
          next_check_at?: string | null;
          result_data?: Json | null;
          status?: string | null;
        };
        Update: {
          check_target?: string | null;
          check_type?: string | null;
          checked_at?: string | null;
          created_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string | null;
          module_key?: string | null;
          next_check_at?: string | null;
          organization_id?: string | null;
          result_data?: Json | null;
          status?: string | null;
        };
        Relationships: [
          { foreignKeyName: "scheduled_check_results_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      score_history: {
        Row: {
          category: string;
          id: string;
          organization_id: string;
          recorded_at: string;
          score: number;
        };
        Insert: {
          category: string;
          organization_id: string;
          score: number;
          id?: string | null;
          recorded_at?: string | null;
        };
        Update: {
          category?: string | null;
          id?: string | null;
          organization_id?: string | null;
          recorded_at?: string | null;
          score?: number | null;
        };
        Relationships: [
          { foreignKeyName: "score_history_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      service_catalog: {
        Row: {
          base_price: number;
          billing_model: string;
          bundle_id: string | null;
          category: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          included_units: number | null;
          is_active: boolean;
          is_bundled: boolean;
          metadata: Json;
          name: string;
          organization_id: string;
          overture_rate: number | null;
          status: string;
          unit: string;
          updated_at: string;
          visibility: string;
        };
        Insert: {
          name: string;
          organization_id: string;
          base_price?: number | null;
          billing_model?: string | null;
          bundle_id?: string | null;
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          included_units?: number | null;
          is_active?: boolean | null;
          is_bundled?: boolean | null;
          metadata?: Json | null;
          overture_rate?: number | null;
          status?: string | null;
          unit?: string | null;
          updated_at?: string | null;
          visibility?: string | null;
        };
        Update: {
          base_price?: number | null;
          billing_model?: string | null;
          bundle_id?: string | null;
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          included_units?: number | null;
          is_active?: boolean | null;
          is_bundled?: boolean | null;
          metadata?: Json | null;
          name?: string | null;
          organization_id?: string | null;
          overture_rate?: number | null;
          status?: string | null;
          unit?: string | null;
          updated_at?: string | null;
          visibility?: string | null;
        };
        Relationships: [
          { foreignKeyName: "service_catalog_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
          { foreignKeyName: "service_catalog_bundle_id_fkey", columns: ["bundle_id"], isOneToOne: false, referencedRelation: "service_catalog", referencedColumns: ["id"] },
        ];
      };      sharepoint_plans: {
        Row: {
          created_at: string;
          created_by: string | null;
          external_sharing: string;
          id: string;
          notes: string | null;
          organization_id: string;
          owner: string | null;
          sensitivity_label: string | null;
          site_name: string;
          status: string;
          structure_type: string;
          team_name: string | null;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          site_name: string;
          created_at?: string | null;
          created_by?: string | null;
          external_sharing?: string | null;
          id?: string | null;
          notes?: string | null;
          owner?: string | null;
          sensitivity_label?: string | null;
          status?: string | null;
          structure_type?: string | null;
          team_name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          external_sharing?: string | null;
          id?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          owner?: string | null;
          sensitivity_label?: string | null;
          site_name?: string | null;
          status?: string | null;
          structure_type?: string | null;
          team_name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "sharepoint_plans_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      sla_logs: {
        Row: {
          actual_minutes: number | null;
          breached: boolean;
          breached_at: string | null;
          created_at: string;
          id: string;
          metric: string;
          organization_id: string;
          resolved_at: string | null;
          target_minutes: number;
          ticket_id: string | null;
        };
        Insert: {
          metric: string;
          organization_id: string;
          actual_minutes?: number | null;
          breached?: boolean | null;
          breached_at?: string | null;
          created_at?: string | null;
          id?: string | null;
          resolved_at?: string | null;
          target_minutes?: number | null;
          ticket_id?: string | null;
        };
        Update: {
          actual_minutes?: number | null;
          breached?: boolean | null;
          breached_at?: string | null;
          created_at?: string | null;
          id?: string | null;
          metric?: string | null;
          organization_id?: string | null;
          resolved_at?: string | null;
          target_minutes?: number | null;
          ticket_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "sla_logs_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
          { foreignKeyName: "sla_logs_ticket_id_fkey", columns: ["ticket_id"], isOneToOne: false, referencedRelation: "tickets", referencedColumns: ["id"] },
        ];
      };      sop_library: {
        Row: {
          category: string | null;
          compliance_framework: string | null;
          content: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          document_url: string | null;
          framework: string[] | null;
          framework_control_ids: string[];
          id: string;
          last_reviewed_at: string | null;
          next_review_at: string | null;
          organization_id: string;
          owner_user_id: string | null;
          review_cycle_days: number;
          sop_category: string;
          sop_number: string | null;
          status: string;
          tags: string[];
          title: string;
          updated_at: string;
          version: string;
        };
        Insert: {
          organization_id: string;
          title: string;
          category?: string | null;
          compliance_framework?: string | null;
          content?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          document_url?: string | null;
          framework?: string[] | null;
          framework_control_ids?: string[] | null;
          id?: string | null;
          last_reviewed_at?: string | null;
          next_review_at?: string | null;
          owner_user_id?: string | null;
          review_cycle_days?: number | null;
          sop_category?: string | null;
          sop_number?: string | null;
          status?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
          version?: string | null;
        };
        Update: {
          category?: string | null;
          compliance_framework?: string | null;
          content?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          document_url?: string | null;
          framework?: string[] | null;
          framework_control_ids?: string[] | null;
          id?: string | null;
          last_reviewed_at?: string | null;
          next_review_at?: string | null;
          organization_id?: string | null;
          owner_user_id?: string | null;
          review_cycle_days?: number | null;
          sop_category?: string | null;
          sop_number?: string | null;
          status?: string | null;
          tags?: string[] | null;
          title?: string | null;
          updated_at?: string | null;
          version?: string | null;
        };
        Relationships: [
          { foreignKeyName: "sop_library_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      status_components: {
        Row: {
          component_type: string;
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          name: string;
          organization_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          organization_id: string;
          component_type?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          component_type?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string | null;
          name?: string | null;
          organization_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "status_components_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      status_incidents: {
        Row: {
          affected_component_ids: string[];
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          organization_id: string;
          resolved_at: string | null;
          severity: string;
          started_at: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          title: string;
          affected_component_ids?: string[] | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          resolved_at?: string | null;
          severity?: string | null;
          started_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          affected_component_ids?: string[] | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          organization_id?: string | null;
          resolved_at?: string | null;
          severity?: string | null;
          started_at?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "status_incidents_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      status_items: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_public: boolean;
          is_resolved: boolean;
          organization_id: string;
          resolved_at: string | null;
          scheduled_end: string | null;
          scheduled_start: string | null;
          severity: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          title: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          is_public?: boolean | null;
          is_resolved?: boolean | null;
          resolved_at?: string | null;
          scheduled_end?: string | null;
          scheduled_start?: string | null;
          severity?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          is_public?: boolean | null;
          is_resolved?: boolean | null;
          organization_id?: string | null;
          resolved_at?: string | null;
          scheduled_end?: string | null;
          scheduled_start?: string | null;
          severity?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "status_items_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      store_analytics_events: {
        Row: {
          anonymous_id: string | null;
          campaign_id: string | null;
          category_id: string | null;
          created_at: string;
          event: string;
          id: string;
          ip_address: string | null;
          metadata: Json;
          page: string | null;
          product_id: string | null;
          promo_id: string | null;
          quiz_id: string | null;
          quote_id: string | null;
          user_agent: string | null;
        };
        Insert: {
          event: string;
          anonymous_id?: string | null;
          campaign_id?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          id?: string | null;
          ip_address?: string | null;
          metadata?: Json | null;
          page?: string | null;
          product_id?: string | null;
          promo_id?: string | null;
          quiz_id?: string | null;
          quote_id?: string | null;
          user_agent?: string | null;
        };
        Update: {
          anonymous_id?: string | null;
          campaign_id?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          event?: string | null;
          id?: string | null;
          ip_address?: string | null;
          metadata?: Json | null;
          page?: string | null;
          product_id?: string | null;
          promo_id?: string | null;
          quiz_id?: string | null;
          quote_id?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
        ];
      };      store_categories: {
        Row: {
          count: number;
          created_at: string;
          description: string;
          id: string | null;
          name: string;
          organization_id: string | null;
          product_ids: string[];
          slug: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          count?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string | null;
          organization_id?: string | null;
          product_ids?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          count?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string | null;
          name?: string | null;
          organization_id?: string | null;
          product_ids?: string[] | null;
          slug?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "store_categories_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      store_leads: {
        Row: {
          assigned_owner: string | null;
          created_at: string;
          follow_up_due_at: string | null;
          id: string;
          lead_band: string;
          lead_score: number;
          quote_request_id: string | null;
          score_breakdown: Json;
          status: string;
          updated_at: string;
        };
        Insert: {
          assigned_owner?: string | null;
          created_at?: string | null;
          follow_up_due_at?: string | null;
          id?: string | null;
          lead_band?: string | null;
          lead_score?: number | null;
          quote_request_id?: string | null;
          score_breakdown?: Json | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          assigned_owner?: string | null;
          created_at?: string | null;
          follow_up_due_at?: string | null;
          id?: string | null;
          lead_band?: string | null;
          lead_score?: number | null;
          quote_request_id?: string | null;
          score_breakdown?: Json | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
        ];
      };      store_products: {
        Row: {
          attributes: Json;
          category: string;
          category_id: string | null;
          created_at: string;
          display: boolean;
          id: string | null;
          marketing_copy: string;
          marketing_headline: string;
          name: string;
          organization_id: string | null;
          price_range: string;
          pricing_model: string;
          purchase_mode: string;
          slug: string;
          status: string;
          summary: string;
          tags: string[];
          type: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          attributes?: Json | null;
          category?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          display?: boolean | null;
          id?: string | null;
          marketing_copy?: string | null;
          marketing_headline?: string | null;
          organization_id?: string | null;
          price_range?: string | null;
          pricing_model?: string | null;
          purchase_mode?: string | null;
          status?: string | null;
          summary?: string | null;
          tags?: string[] | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          attributes?: Json | null;
          category?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          display?: boolean | null;
          id?: string | null;
          marketing_copy?: string | null;
          marketing_headline?: string | null;
          name?: string | null;
          organization_id?: string | null;
          price_range?: string | null;
          pricing_model?: string | null;
          purchase_mode?: string | null;
          slug?: string | null;
          status?: string | null;
          summary?: string | null;
          tags?: string[] | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "store_products_category_id_fkey", columns: ["category_id"], isOneToOne: false, referencedRelation: "store_categories", referencedColumns: ["id"] },
          { foreignKeyName: "store_products_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      store_promotions: {
        Row: {
          badge_text: string;
          created_at: string;
          detail_text: string;
          eligibility_targets: string[];
          end_date: string | null;
          id: string;
          name: string;
          organization_id: string | null;
          promo_type: string;
          start_date: string | null;
          status: string;
          terms: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          badge_text?: string | null;
          created_at?: string | null;
          detail_text?: string | null;
          eligibility_targets?: string[] | null;
          end_date?: string | null;
          id?: string | null;
          organization_id?: string | null;
          promo_type?: string | null;
          start_date?: string | null;
          status?: string | null;
          terms?: string | null;
          updated_at?: string | null;
        };
        Update: {
          badge_text?: string | null;
          created_at?: string | null;
          detail_text?: string | null;
          eligibility_targets?: string[] | null;
          end_date?: string | null;
          id?: string | null;
          name?: string | null;
          organization_id?: string | null;
          promo_type?: string | null;
          start_date?: string | null;
          status?: string | null;
          terms?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "store_promotions_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      store_proposal_drafts: {
        Row: {
          created_at: string;
          generated_by: string | null;
          id: string;
          quote_request_id: string | null;
          reviewed_by: string | null;
          sections: Json;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string | null;
          generated_by?: string | null;
          id?: string | null;
          quote_request_id?: string | null;
          reviewed_by?: string | null;
          sections?: Json | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          generated_by?: string | null;
          id?: string | null;
          quote_request_id?: string | null;
          reviewed_by?: string | null;
          sections?: Json | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
        ];
      };      store_quote_requests: {
        Row: {
          created_at: string;
          customer: Json;
          id: string;
          items: Json;
          notes: string | null;
          recommended_bundle_ids: string[];
          selected_promo_ids: string[];
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string | null;
          customer?: Json | null;
          id?: string | null;
          items?: Json | null;
          notes?: string | null;
          recommended_bundle_ids?: string[] | null;
          selected_promo_ids?: string[] | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          customer?: Json | null;
          id?: string | null;
          items?: Json | null;
          notes?: string | null;
          recommended_bundle_ids?: string[] | null;
          selected_promo_ids?: string[] | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
        ];
      };      store_quotes: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          items: Json;
          name: string;
          notes: string;
          organization_id: string | null;
          phone: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          email: string;
          name: string;
          created_at?: string | null;
          id?: string | null;
          items?: Json | null;
          notes?: string | null;
          organization_id?: string | null;
          phone?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          id?: string | null;
          items?: Json | null;
          name?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          phone?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "store_quotes_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      store_visual_assets: {
        Row: {
          accent_color: string | null;
          alt_text: string | null;
          asset_type: string;
          created_at: string;
          decorative: boolean;
          icon_name: string | null;
          id: string;
          image_url: string | null;
          license_notes: string | null;
          linked_entity_id: string;
          linked_entity_type: string;
          provenance: string | null;
          updated_at: string;
        };
        Insert: {
          asset_type: string;
          linked_entity_id: string;
          linked_entity_type: string;
          accent_color?: string | null;
          alt_text?: string | null;
          created_at?: string | null;
          decorative?: boolean | null;
          icon_name?: string | null;
          id?: string | null;
          image_url?: string | null;
          license_notes?: string | null;
          provenance?: string | null;
          updated_at?: string | null;
        };
        Update: {
          accent_color?: string | null;
          alt_text?: string | null;
          asset_type?: string | null;
          created_at?: string | null;
          decorative?: boolean | null;
          icon_name?: string | null;
          id?: string | null;
          image_url?: string | null;
          license_notes?: string | null;
          linked_entity_id?: string | null;
          linked_entity_type?: string | null;
          provenance?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
        ];
      };      subscriptions: {
        Row: {
          amount_cents: number | null;
          created_at: string;
          currency: string;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          metadata: Json;
          organization_id: string;
          plan_name: string;
          status: string;
          stripe_subscription_id: string | null;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          plan_name: string;
          status: string;
          amount_cents?: number | null;
          created_at?: string | null;
          currency?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string | null;
          metadata?: Json | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          amount_cents?: number | null;
          created_at?: string | null;
          currency?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string | null;
          metadata?: Json | null;
          organization_id?: string | null;
          plan_name?: string | null;
          status?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "subscriptions_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      tabletop_exercises: {
        Row: {
          action_items: string | null;
          after_action_report: string | null;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          facilitator_id: string | null;
          id: string;
          notes: string | null;
          organization_id: string;
          participants: string | null;
          scenario: string;
          scenario_type: string;
          scheduled_date: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          scenario: string;
          title: string;
          action_items?: string | null;
          after_action_report?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          facilitator_id?: string | null;
          id?: string | null;
          notes?: string | null;
          participants?: string | null;
          scenario_type?: string | null;
          scheduled_date?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          action_items?: string | null;
          after_action_report?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          facilitator_id?: string | null;
          id?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          participants?: string | null;
          scenario?: string | null;
          scenario_type?: string | null;
          scheduled_date?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "tabletop_exercises_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      ticket_comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          edited_at: string | null;
          id: string;
          is_internal: boolean;
          organization_id: string;
          ticket_id: string;
        };
        Insert: {
          author_id: string;
          body: string;
          organization_id: string;
          ticket_id: string;
          created_at?: string | null;
          edited_at?: string | null;
          id?: string | null;
          is_internal?: boolean | null;
        };
        Update: {
          author_id?: string | null;
          body?: string | null;
          created_at?: string | null;
          edited_at?: string | null;
          id?: string | null;
          is_internal?: boolean | null;
          organization_id?: string | null;
          ticket_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "ticket_comments_ticket_id_fkey", columns: ["ticket_id"], isOneToOne: false, referencedRelation: "tickets", referencedColumns: ["id"] },
          { foreignKeyName: "ticket_comments_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      ticket_triage_drafts: {
        Row: {
          confidence_score: number;
          converted_ticket_id: string | null;
          created_at: string;
          created_by: string | null;
          first_response_draft: string | null;
          id: string;
          metadata: Json;
          missing_info: string[] | null;
          organization_id: string;
          raw_description: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          suggested_category: string | null;
          suggested_priority: string;
          suggested_subject: string | null;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          raw_description: string;
          confidence_score?: number | null;
          converted_ticket_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          first_response_draft?: string | null;
          id?: string | null;
          metadata?: Json | null;
          missing_info?: string[] | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
          suggested_category?: string | null;
          suggested_priority?: string | null;
          suggested_subject?: string | null;
          updated_at?: string | null;
        };
        Update: {
          confidence_score?: number | null;
          converted_ticket_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          first_response_draft?: string | null;
          id?: string | null;
          metadata?: Json | null;
          missing_info?: string[] | null;
          organization_id?: string | null;
          raw_description?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
          suggested_category?: string | null;
          suggested_priority?: string | null;
          suggested_subject?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "ticket_triage_drafts_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
          { foreignKeyName: "ticket_triage_drafts_converted_ticket_id_fkey", columns: ["converted_ticket_id"], isOneToOne: false, referencedRelation: "tickets", referencedColumns: ["id"] },
        ];
      };      tickets: {
        Row: {
          assigned_to: string | null;
          category: string | null;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          external_jsm_issue_key: string | null;
          id: string;
          jira_last_synced_at: string | null;
          labels: string[] | null;
          metadata: Json;
          organization_id: string;
          priority: "low" | "normal" | "high" | "urgent";
          resolution: string | null;
          source: string;
          status: "new" | "triaged" | "in_progress" | "waiting_on_client" | "resolved" | "closed";
          title: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          created_by: string;
          organization_id: string;
          title: string;
          assigned_to?: string | null;
          category?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          external_jsm_issue_key?: string | null;
          id?: string | null;
          jira_last_synced_at?: string | null;
          labels?: string[] | null;
          metadata?: Json | null;
          priority?: "low" | "normal" | "high" | "urgent" | null;
          resolution?: string | null;
          source?: string | null;
          status?: "new" | "triaged" | "in_progress" | "waiting_on_client" | "resolved" | "closed" | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Update: {
          assigned_to?: string | null;
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          external_jsm_issue_key?: string | null;
          id?: string | null;
          jira_last_synced_at?: string | null;
          labels?: string[] | null;
          metadata?: Json | null;
          organization_id?: string | null;
          priority?: "low" | "normal" | "high" | "urgent" | null;
          resolution?: string | null;
          source?: string | null;
          status?: "new" | "triaged" | "in_progress" | "waiting_on_client" | "resolved" | "closed" | null;
          title?: string | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Relationships: [
          { foreignKeyName: "tickets_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      time_entries: {
        Row: {
          billable: boolean;
          created_at: string;
          description: string;
          hours: number;
          id: string;
          organization_id: string;
          ticket_id: string | null;
          updated_at: string;
          user_id: string | null;
          work_date: string | null;
        };
        Insert: {
          description: string;
          organization_id: string;
          billable?: boolean | null;
          created_at?: string | null;
          hours?: number | null;
          id?: string | null;
          ticket_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          work_date?: string | null;
        };
        Update: {
          billable?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          hours?: number | null;
          id?: string | null;
          organization_id?: string | null;
          ticket_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          work_date?: string | null;
        };
        Relationships: [
          { foreignKeyName: "time_entries_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
          { foreignKeyName: "time_entries_ticket_id_fkey", columns: ["ticket_id"], isOneToOne: false, referencedRelation: "tickets", referencedColumns: ["id"] },
        ];
      };      training_courses: {
        Row: {
          category: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          difficulty: string;
          estimated_minutes: number;
          id: string;
          organization_id: string;
          passing_score: number;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          title: string;
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          difficulty?: string | null;
          estimated_minutes?: number | null;
          id?: string | null;
          passing_score?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          difficulty?: string | null;
          estimated_minutes?: number | null;
          id?: string | null;
          organization_id?: string | null;
          passing_score?: number | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "training_courses_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      training_enrollments: {
        Row: {
          completed_at: string | null;
          course_id: string;
          enrolled_at: string;
          id: string;
          progress_percent: number;
          status: string;
          user_id: string;
        };
        Insert: {
          course_id: string;
          user_id: string;
          completed_at?: string | null;
          enrolled_at?: string | null;
          id?: string | null;
          progress_percent?: number | null;
          status?: string | null;
        };
        Update: {
          completed_at?: string | null;
          course_id?: string | null;
          enrolled_at?: string | null;
          id?: string | null;
          progress_percent?: number | null;
          status?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "training_enrollments_course_id_fkey", columns: ["course_id"], isOneToOne: false, referencedRelation: "training_courses", referencedColumns: ["id"] },
        ];
      };      training_lessons: {
        Row: {
          content: string | null;
          course_id: string;
          created_at: string;
          id: string;
          lesson_type: string;
          sort_order: number;
          title: string;
        };
        Insert: {
          course_id: string;
          title: string;
          content?: string | null;
          created_at?: string | null;
          id?: string | null;
          lesson_type?: string | null;
          sort_order?: number | null;
        };
        Update: {
          content?: string | null;
          course_id?: string | null;
          created_at?: string | null;
          id?: string | null;
          lesson_type?: string | null;
          sort_order?: number | null;
          title?: string | null;
        };
        Relationships: [
          { foreignKeyName: "training_lessons_course_id_fkey", columns: ["course_id"], isOneToOne: false, referencedRelation: "training_courses", referencedColumns: ["id"] },
        ];
      };      training_modules: {
        Row: {
          category: string;
          completion_count: number;
          created_at: string;
          created_by: string | null;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          is_required: boolean;
          organization_id: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          title: string;
          category?: string | null;
          completion_count?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string | null;
          is_required?: boolean | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          completion_count?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string | null;
          is_required?: boolean | null;
          organization_id?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "training_modules_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      unifi_surveys: {
        Row: {
          access_points: number;
          ap_count: number;
          cable_runs_estimated: number;
          cameras: number;
          created_at: string;
          created_by: string | null;
          estimated_cost: number;
          id: string;
          notes: string | null;
          nvr_estimated_storage_tb: number | null;
          organization_id: string;
          outdoor_aps: number;
          poe_budget_watts: number | null;
          site_address: string | null;
          site_name: string;
          status: string;
          survey_date: string | null;
          switch_count: number;
          switches: number;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          site_name: string;
          access_points?: number | null;
          ap_count?: number | null;
          cable_runs_estimated?: number | null;
          cameras?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          estimated_cost?: number | null;
          id?: string | null;
          notes?: string | null;
          nvr_estimated_storage_tb?: number | null;
          outdoor_aps?: number | null;
          poe_budget_watts?: number | null;
          site_address?: string | null;
          status?: string | null;
          survey_date?: string | null;
          switch_count?: number | null;
          switches?: number | null;
          updated_at?: string | null;
        };
        Update: {
          access_points?: number | null;
          ap_count?: number | null;
          cable_runs_estimated?: number | null;
          cameras?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          estimated_cost?: number | null;
          id?: string | null;
          notes?: string | null;
          nvr_estimated_storage_tb?: number | null;
          organization_id?: string | null;
          outdoor_aps?: number | null;
          poe_budget_watts?: number | null;
          site_address?: string | null;
          site_name?: string | null;
          status?: string | null;
          survey_date?: string | null;
          switch_count?: number | null;
          switches?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "unifi_surveys_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      uptime_checks: {
        Row: {
          check_interval_minutes: number;
          check_type: string;
          created_at: string;
          created_by: string | null;
          expected_status_code: number;
          id: string;
          last_checked_at: string | null;
          last_status_code: number | null;
          organization_id: string;
          status: string;
          timeout_seconds: number;
          updated_at: string;
          url: string;
        };
        Insert: {
          organization_id: string;
          url: string;
          check_interval_minutes?: number | null;
          check_type?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          expected_status_code?: number | null;
          id?: string | null;
          last_checked_at?: string | null;
          last_status_code?: number | null;
          status?: string | null;
          timeout_seconds?: number | null;
          updated_at?: string | null;
        };
        Update: {
          check_interval_minutes?: number | null;
          check_type?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          expected_status_code?: number | null;
          id?: string | null;
          last_checked_at?: string | null;
          last_status_code?: number | null;
          organization_id?: string | null;
          status?: string | null;
          timeout_seconds?: number | null;
          updated_at?: string | null;
          url?: string | null;
        };
        Relationships: [
          { foreignKeyName: "uptime_checks_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      uptime_results: {
        Row: {
          check_id: string;
          checked_at: string;
          error_message: string | null;
          id: string;
          is_up: boolean;
          response_status: number | null;
          response_time_ms: number | null;
          ssl_days_remaining: number | null;
          ssl_expiry_date: string | null;
        };
        Insert: {
          check_id: string;
          checked_at?: string | null;
          error_message?: string | null;
          id?: string | null;
          is_up?: boolean | null;
          response_status?: number | null;
          response_time_ms?: number | null;
          ssl_days_remaining?: number | null;
          ssl_expiry_date?: string | null;
        };
        Update: {
          check_id?: string | null;
          checked_at?: string | null;
          error_message?: string | null;
          id?: string | null;
          is_up?: boolean | null;
          response_status?: number | null;
          response_time_ms?: number | null;
          ssl_days_remaining?: number | null;
          ssl_expiry_date?: string | null;
        };
        Relationships: [
          { foreignKeyName: "uptime_results_check_id_fkey", columns: ["check_id"], isOneToOne: false, referencedRelation: "uptime_checks", referencedColumns: ["id"] },
        ];
      };      user_permission_overrides: {
        Row: {
          created_at: string;
          id: string;
          is_allowed: boolean;
          organization_id: string;
          permission_id: string;
          user_id: string;
        };
        Insert: {
          is_allowed: boolean;
          organization_id: string;
          permission_id: string;
          user_id: string;
          created_at?: string | null;
          id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string | null;
          is_allowed?: boolean | null;
          organization_id?: string | null;
          permission_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "user_permission_overrides_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
          { foreignKeyName: "user_permission_overrides_permission_id_fkey", columns: ["permission_id"], isOneToOne: false, referencedRelation: "permissions", referencedColumns: ["id"] },
        ];
      };      vendor_contacts: {
        Row: {
          account_number: string | null;
          contact_name: string | null;
          created_at: string;
          created_by: string | null;
          email: string | null;
          escalation_path: string | null;
          id: string;
          is_primary: boolean;
          notes: string | null;
          organization_id: string;
          phone: string | null;
          role_title: string | null;
          status: string;
          support_portal_url: string | null;
          updated_at: string;
          vendor_name: string;
        };
        Insert: {
          organization_id: string;
          vendor_name: string;
          account_number?: string | null;
          contact_name?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          email?: string | null;
          escalation_path?: string | null;
          id?: string | null;
          is_primary?: boolean | null;
          notes?: string | null;
          phone?: string | null;
          role_title?: string | null;
          status?: string | null;
          support_portal_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          account_number?: string | null;
          contact_name?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          email?: string | null;
          escalation_path?: string | null;
          id?: string | null;
          is_primary?: boolean | null;
          notes?: string | null;
          organization_id?: string | null;
          phone?: string | null;
          role_title?: string | null;
          status?: string | null;
          support_portal_url?: string | null;
          updated_at?: string | null;
          vendor_name?: string | null;
        };
        Relationships: [
          { foreignKeyName: "vendor_contacts_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      vendor_contracts: {
        Row: {
          auto_renews: boolean;
          billing_frequency: string;
          contract_number: string | null;
          contract_type: string;
          contract_value: number | null;
          created_at: string;
          created_by: string | null;
          end_date: string | null;
          id: string;
          notes: string | null;
          organization_id: string;
          owner_user_id: string | null;
          primary_contact_id: string | null;
          renewal_date: string | null;
          renewal_notice_days: number;
          service_name: string;
          start_date: string | null;
          status: string;
          updated_at: string;
          vendor_name: string;
          visibility: string;
        };
        Insert: {
          organization_id: string;
          service_name: string;
          vendor_name: string;
          auto_renews?: boolean | null;
          billing_frequency?: string | null;
          contract_number?: string | null;
          contract_type?: string | null;
          contract_value?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          end_date?: string | null;
          id?: string | null;
          notes?: string | null;
          owner_user_id?: string | null;
          primary_contact_id?: string | null;
          renewal_date?: string | null;
          renewal_notice_days?: number | null;
          start_date?: string | null;
          status?: string | null;
          updated_at?: string | null;
          visibility?: string | null;
        };
        Update: {
          auto_renews?: boolean | null;
          billing_frequency?: string | null;
          contract_number?: string | null;
          contract_type?: string | null;
          contract_value?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          end_date?: string | null;
          id?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          owner_user_id?: string | null;
          primary_contact_id?: string | null;
          renewal_date?: string | null;
          renewal_notice_days?: number | null;
          service_name?: string | null;
          start_date?: string | null;
          status?: string | null;
          updated_at?: string | null;
          vendor_name?: string | null;
          visibility?: string | null;
        };
        Relationships: [
          { foreignKeyName: "vendor_contracts_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      webhook_dead_letters: {
        Row: {
          attempt_count: number;
          created_at: string;
          event: string;
          id: string;
          last_attempt_at: string;
          last_error: string | null;
          request_body: Json | null;
          webhook_id: string;
        };
        Insert: {
          attempt_count: number;
          event: string;
          last_attempt_at: string;
          webhook_id: string;
          created_at?: string | null;
          id?: string | null;
          last_error?: string | null;
          request_body?: Json | null;
        };
        Update: {
          attempt_count?: number | null;
          created_at?: string | null;
          event?: string | null;
          id?: string | null;
          last_attempt_at?: string | null;
          last_error?: string | null;
          request_body?: Json | null;
          webhook_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "webhook_dead_letters_webhook_id_fkey", columns: ["webhook_id"], isOneToOne: false, referencedRelation: "webhook_endpoints", referencedColumns: ["id"] },
        ];
      };      webhook_deliveries: {
        Row: {
          created_at: string;
          dead_letter: boolean;
          duration_ms: number | null;
          error: string | null;
          event: string;
          id: string;
          idempotency_key: string | null;
          next_retry_at: string | null;
          request_body: Json | null;
          response_body: string | null;
          response_status: number | null;
          retry_count: number;
          status: string;
          webhook_id: string;
        };
        Insert: {
          event: string;
          status: string;
          webhook_id: string;
          created_at?: string | null;
          dead_letter?: boolean | null;
          duration_ms?: number | null;
          error?: string | null;
          id?: string | null;
          idempotency_key?: string | null;
          next_retry_at?: string | null;
          request_body?: Json | null;
          response_body?: string | null;
          response_status?: number | null;
          retry_count?: number | null;
        };
        Update: {
          created_at?: string | null;
          dead_letter?: boolean | null;
          duration_ms?: number | null;
          error?: string | null;
          event?: string | null;
          id?: string | null;
          idempotency_key?: string | null;
          next_retry_at?: string | null;
          request_body?: Json | null;
          response_body?: string | null;
          response_status?: number | null;
          retry_count?: number | null;
          status?: string | null;
          webhook_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "webhook_deliveries_webhook_id_fkey", columns: ["webhook_id"], isOneToOne: false, referencedRelation: "webhook_endpoints", referencedColumns: ["id"] },
        ];
      };      webhook_endpoints: {
        Row: {
          created_at: string;
          created_by: string;
          events: string[];
          id: string;
          is_active: boolean;
          last_error: string | null;
          last_failure_at: string | null;
          last_success_at: string | null;
          name: string;
          organization_id: string;
          secret: string | null;
          updated_at: string;
          url: string;
          version: number;
        };
        Insert: {
          created_by: string;
          name: string;
          organization_id: string;
          url: string;
          created_at?: string | null;
          events?: string[] | null;
          id?: string | null;
          is_active?: boolean | null;
          last_error?: string | null;
          last_failure_at?: string | null;
          last_success_at?: string | null;
          secret?: string | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          events?: string[] | null;
          id?: string | null;
          is_active?: boolean | null;
          last_error?: string | null;
          last_failure_at?: string | null;
          last_success_at?: string | null;
          name?: string | null;
          organization_id?: string | null;
          secret?: string | null;
          updated_at?: string | null;
          url?: string | null;
          version?: number | null;
        };
        Relationships: [
          { foreignKeyName: "webhook_endpoints_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };      website_monitors: {
        Row: {
          alerts_enabled: boolean;
          check_interval_hours: number;
          created_at: string;
          created_by: string | null;
          display_name: string | null;
          id: string;
          last_checked_at: string | null;
          last_response_ms: number | null;
          last_status: string;
          lighthouse_score: number | null;
          next_check_at: string | null;
          organization_id: string;
          ssl_expires: string | null;
          ssl_valid: boolean;
          status: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          organization_id: string;
          url: string;
          alerts_enabled?: boolean | null;
          check_interval_hours?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          display_name?: string | null;
          id?: string | null;
          last_checked_at?: string | null;
          last_response_ms?: number | null;
          last_status?: string | null;
          lighthouse_score?: number | null;
          next_check_at?: string | null;
          ssl_expires?: string | null;
          ssl_valid?: boolean | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          alerts_enabled?: boolean | null;
          check_interval_hours?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          display_name?: string | null;
          id?: string | null;
          last_checked_at?: string | null;
          last_response_ms?: number | null;
          last_status?: string | null;
          lighthouse_score?: number | null;
          next_check_at?: string | null;
          organization_id?: string | null;
          ssl_expires?: string | null;
          ssl_valid?: boolean | null;
          status?: string | null;
          updated_at?: string | null;
          url?: string | null;
        };
        Relationships: [
          { foreignKeyName: "website_monitors_organization_id_fkey", columns: ["organization_id"], isOneToOne: false, referencedRelation: "organizations", referencedColumns: ["id"] },
        ];
      };    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      audit_actor_type: "user" | "system" | "service";
      comment_target_type: "ticket" | "project" | "task" | "document" | "contract";
      contract_status: "draft" | "in_review" | "pending_signature" | "signed" | "expired" | "cancelled";
      document_visibility: "private" | "org" | "internal" | "public";
      invoice_status: "draft" | "open" | "paid" | "void" | "uncollectible" | "overdue";
      membership_status: "pending" | "approved" | "rejected" | "suspended";
      notification_channel: "email" | "sms" | "in_app";
      org_status: "pending" | "approved" | "rejected" | "suspended";
      project_status: "planned" | "active" | "blocked" | "client_review" | "completed" | "archived";
      task_status: "todo" | "in_progress" | "in_review" | "blocked" | "done";
      ticket_priority: "low" | "normal" | "high" | "urgent";
      ticket_status: "new" | "triaged" | "in_progress" | "waiting_on_client" | "resolved" | "closed";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;
