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
      campaign_forms: {
        Row: {
          campaign_id: string | null
          created_at: string
          data: Json
          id: string
          owner_id: string
          slug: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          owner_id?: string
          slug?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          owner_id?: string
          slug?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_forms_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_forms_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "campaign_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_templates: {
        Row: {
          created_at: string
          id: string
          message: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string
          id: string
          message: string | null
          name: string
          recipients: string[] | null
          scheduled_for: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          name: string
          recipients?: string[] | null
          scheduled_for?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          name?: string
          recipients?: string[] | null
          scheduled_for?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          created_at: string
          delta: number
          id: string
          owner_id: string | null
          reason: string
          related_id: string | null
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          owner_id?: string | null
          reason: string
          related_id?: string | null
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          owner_id?: string | null
          reason?: string
          related_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          archived: boolean
          id: string
          key: string
          label: string
          options: Json
          order: number
          required: boolean
          type: string
          user_id: string
          visibleOn: Json
        }
        Insert: {
          archived?: boolean
          id?: string
          key: string
          label: string
          options?: Json
          order?: number
          required?: boolean
          type?: string
          user_id: string
          visibleOn?: Json
        }
        Update: {
          archived?: boolean
          id?: string
          key?: string
          label?: string
          options?: Json
          order?: number
          required?: boolean
          type?: string
          user_id?: string
          visibleOn?: Json
        }
        Relationships: []
      }
      customer_custom_field_values: {
        Row: {
          customer_id: string
          field_id: string
          value: string | null
        }
        Insert: {
          customer_id: string
          field_id: string
          value?: string | null
        }
        Update: {
          customer_id?: string
          field_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_custom_field_values_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_custom_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_email_collisions: {
        Row: {
          email: string | null
          ids: string[] | null
          user_id: string | null
        }
        Insert: {
          email?: string | null
          ids?: string[] | null
          user_id?: string | null
        }
        Update: {
          email?: string | null
          ids?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      customer_phone_collisions: {
        Row: {
          ids: string[] | null
          phone: string | null
          user_id: string | null
        }
        Insert: {
          ids?: string[] | null
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          ids?: string[] | null
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          email: string | null
          extra: Json
          first_name: string
          id: string
          last_name: string
          phone: string | null
          signup_date: string
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          email?: string | null
          extra?: Json
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          signup_date?: string
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          email?: string | null
          extra?: Json
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          signup_date?: string
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          credits: number | null
          deactivated_at: string | null
          email: string | null
          id: string
          inserted_at: string | null
          is_active: boolean
          is_approved: boolean
          role: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar?: string | null
          credits?: number | null
          deactivated_at?: string | null
          email?: string | null
          id: string
          inserted_at?: string | null
          is_active?: boolean
          is_approved?: boolean
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar?: string | null
          credits?: number | null
          deactivated_at?: string | null
          email?: string | null
          id?: string
          inserted_at?: string | null
          is_active?: boolean
          is_approved?: boolean
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      public_slugs: {
        Row: {
          created_at: string
          slug: string
          user_id: string
        }
        Insert: {
          created_at?: string
          slug: string
          user_id: string
        }
        Update: {
          created_at?: string
          slug?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      ensure_user_slug: {
        Args: Record<PropertyKey, never> | { p_user_id: string }
        Returns: {
          created_at: string
          slug: string
          user_id: string
        }
      }
      increment_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      intake_add_customer: {
        Args:
          | {
              p_extra?: Json
              p_location?: string
              p_name: string
              p_phone: string
              p_slug: string
              p_user_id: string
            }
          | {
              p_extra?: Json
              p_location?: string
              p_name: string
              p_phone: string
              p_slug: string
              p_user_id: string
            }
          | {
              p_extra?: Json
              p_location?: string
              p_name: string
              p_phone: string
              p_slug: string
              p_user_id?: string
            }
          | { p_payload: Json; p_slug: string }
          | { payload: Json }
        Returns: string
      }
      normalize_phone: {
        Args: { input: string }
        Returns: string
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
