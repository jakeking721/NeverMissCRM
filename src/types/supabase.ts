export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          permissions: Json | null
          user_id: string
        }
        Insert: {
          permissions?: Json | null
          user_id: string
        }
        Update: {
          permissions?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      campaign_forms: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          description: string | null
          id: string
          owner_id: string
          schema_json: Json | null
          slug: string | null
          template_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          owner_id?: string
          schema_json?: Json | null
          slug?: string | null
          template_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          owner_id?: string
          schema_json?: Json | null
          slug?: string | null
          template_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      campaign_templates: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string | null
          end_at: string | null
          form_snapshot_json: Json | null
          form_template_id: string | null
          id: string
          message: string | null
          name: string | null
          owner_id: string
          recipients: string[] | null
          slug: string | null
          start_at: string | null
          status: string | null
          title: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_at?: string | null
          form_snapshot_json?: Json | null
          form_template_id?: string | null
          id?: string
          message?: string | null
          name?: string | null
          owner_id: string
          recipients?: string[] | null
          slug?: string | null
          start_at?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_at?: string | null
          form_snapshot_json?: Json | null
          form_template_id?: string | null
          id?: string
          message?: string | null
          name?: string | null
          owner_id?: string
          recipients?: string[] | null
          slug?: string | null
          start_at?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "campaign_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          created_at: string | null
          delta: number
          id: string
          owner_id: string
          reason: string | null
          related_id: string | null
        }
        Insert: {
          created_at?: string | null
          delta: number
          id?: string
          owner_id: string
          reason?: string | null
          related_id?: string | null
        }
        Update: {
          created_at?: string | null
          delta?: number
          id?: string
          owner_id?: string
          reason?: string | null
          related_id?: string | null
        }
        Relationships: []
      }
      custom_fields: {
        Row: {
          created_at: string | null
          default_label: string | null
          field_name: string | null
          id: string
          is_active: boolean | null
          options: Json | null
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_label?: string | null
          field_name?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json | null
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_label?: string | null
          field_name?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customer_latest_values: {
        Row: {
          customer_id: string
          data_key: string
          updated_at: string | null
          user_id: string
          value: Json
        }
        Insert: {
          customer_id: string
          data_key: string
          updated_at?: string | null
          user_id: string
          value: Json
        }
        Update: {
          customer_id?: string
          data_key?: string
          updated_at?: string | null
          user_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "customer_latest_values_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          consent_collected_at: string | null
          consent_text: string | null
          created_at: string | null
          campaign_id: string | null
          form_id: string | null
          email: string | null
          extra: Json | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
          zip_code: string | null
        }
        Insert: {
          consent_collected_at?: string | null
          consent_text?: string | null
          created_at?: string | null
          campaign_id?: string | null
          form_id?: string | null
          email?: string | null
          extra?: Json | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
          zip_code?: string | null
        }
        Update: {
          consent_collected_at?: string | null
          consent_text?: string | null
          created_at?: string | null
          campaign_id?: string | null
          form_id?: string | null
          email?: string | null
          extra?: Json | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "intake_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "campaign_forms"
            referencedColumns: ["id"]
          }
        ]
      }
      form_submissions: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          customer_id: string | null
          form_id: string | null
          form_version: number | null
          id: string
          is_checkin: boolean | null
          payload: Json | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          form_id?: string | null
          form_version?: number | null
          id?: string
          is_checkin?: boolean | null
          payload?: Json | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          form_id?: string | null
          form_version?: number | null
          id?: string
          is_checkin?: boolean | null
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      form_versions: {
        Row: {
          created_at: string | null
          form_id: string | null
          id: string
          owner_id: string | null
          schema_json: Json
          version_label: string | null
          version_number: number
        }
        Insert: {
          created_at?: string | null
          form_id?: string | null
          id?: string
          owner_id?: string | null
          schema_json: Json
          version_label?: string | null
          version_number: number
        }
        Update: {
          created_at?: string | null
          form_id?: string | null
          id?: string
          owner_id?: string | null
          schema_json?: Json
          version_label?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "form_versions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "campaign_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_campaigns: {
        Row: {
          created_at: string | null
          end_date: string | null
          form_snapshot_json: Json | null
          form_version_id: string
          gate_field: string | null
          id: string
          is_active: boolean
          owner_id: string
          prefill_gate: boolean | null
          require_consent: boolean | null
          slug: string | null
          start_date: string | null
          status: string | null
          success_message: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          form_snapshot_json?: Json | null
          form_version_id: string
          gate_field?: string | null
          id?: string
          is_active?: boolean
          owner_id: string
          prefill_gate?: boolean | null
          require_consent?: boolean | null
          slug?: string | null
          start_date?: string | null
          status?: string | null
          success_message?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          form_snapshot_json?: Json | null
          form_version_id?: string
          gate_field?: string | null
          id?: string
          is_active?: boolean
          owner_id?: string
          prefill_gate?: boolean | null
          require_consent?: boolean | null
          slug?: string | null
          start_date?: string | null
          status?: string | null
          success_message?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_campaigns_form_version_id_fkey"
            columns: ["form_version_id"]
            isOneToOne: false
            referencedRelation: "form_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_submissions: {
        Row: {
          answers: Json
          campaign_id: string | null
          consent_text: string | null
          customer_id: string | null
          form_id: string | null
          form_version_id: string | null
          id: string
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          answers: Json
          campaign_id?: string | null
          consent_text?: string | null
          customer_id?: string | null
          form_id?: string | null
          form_version_id?: string | null
          id?: string
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json
          campaign_id?: string | null
          consent_text?: string | null
          customer_id?: string | null
          form_id?: string | null
          form_version_id?: string | null
          id?: string
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_submissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "intake_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_submissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "intake_resolver"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "intake_submissions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "campaign_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_submissions_form_version_id_fkey"
            columns: ["form_version_id"]
            isOneToOne: false
            referencedRelation: "form_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_submissions_owner_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          credits: number | null
          deactivated_at: string | null
          default_form_id: string | null
          email: string | null
          id: string
          is_active: boolean
          is_approved: boolean
          role: string | null
          settings: Json | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          credits?: number | null
          deactivated_at?: string | null
          default_form_id?: string | null
          email?: string | null
          id: string
          is_active?: boolean
          is_approved?: boolean
          role?: string | null
          settings?: Json | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string
          credits?: number | null
          deactivated_at?: string | null
          default_form_id?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_approved?: boolean
          role?: string | null
          settings?: Json | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_form_id_fkey"
            columns: ["default_form_id"]
            referencedRelation: "campaign_forms"
            referencedColumns: ["id"]
          }
        ]
      }
      public_slugs: {
        Row: {
          created_at: string | null
          default_form_id: string | null
          slug: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_form_id?: string | null
          slug: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_form_id?: string | null
          slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_slugs_default_form_id_fkey"
            columns: ["default_form_id"]
            referencedRelation: "campaign_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_slugs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      intake_resolver: {
        Row: {
          campaign_id: string | null
          end_date: string | null
          form_json: Json | null
          form_version_id: string | null
          gate_field: string | null
          owner_id: string | null
          prefill_gate: boolean | null
          require_consent: boolean | null
          slug: string | null
          start_date: string | null
          status: string | null
          success_message: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_campaigns_form_version_id_fkey"
            columns: ["form_version_id"]
            isOneToOne: false
            referencedRelation: "form_versions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      apply_customer_answers: {
        Args: {
          p_answers: Json
          p_customer_id: string
          p_owner_id: string
          p_save_to_latest: boolean
        }
        Returns: {
          consent_collected_at: string | null
          consent_text: string | null
          created_at: string | null
          email: string | null
          extra: Json | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
          zip_code: string | null
        }
      }
      ensure_user_slug: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      increment_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      intake_add_customer: {
        Args: {
          p_extra: Json
          p_first_name: string
          p_last_name: string
          p_phone: string
          p_slug: string
          p_user_id?: string
          p_zip_code: string
        }
        Returns: string
      }
      intake_submit: {
        Args:
          | { input_data: Json }
          | {
              p_answers: Json
              p_form_id: string
              p_campaign_id?: string
              p_consent_text?: string
              p_user_id: string
            }
        Returns: string
      }
      intake_submit_attach: {
        Args:
          | {
              p_campaign_id: string
              p_extra?: Json
              p_first_name?: string
              p_form_version_id: string
              p_last_name?: string
              p_payload_json?: Json
              p_phone?: string
              p_slug?: string
              p_user_id?: string
              p_zip_code?: string
            }
          | {
              p_campaign_slug: string
              p_customer_id: string
              p_email: string
              p_owner_id: string
              p_payload: Json
              p_phone: string
            }
        Returns: string
      }
      is_admin: {
        Args: { uid: string }
        Returns: boolean
      }
      is_blank: {
        Args: { t: string }
        Returns: boolean
      }
      normalize_datakey: {
        Args: { k: string }
        Returns: string
      }
      normalize_phone: {
        Args: { phone_number: string }
        Returns: string
      }
      profile_is_active_and_approved: {
        Args: { uid: string }
        Returns: boolean
      }
      upsert_customer_custom_field_value: {
        Args: { p_customer_id: string; p_field_id: string; p_value: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
