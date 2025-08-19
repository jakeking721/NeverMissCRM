export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      custom_fields: {
        Row: {
          id: string;
          user_id: string;
          key: string;
          label: string;
          type: string;
          options: Json;
          required: boolean;
          order: number;
          visible_on: Json;
          archived: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          key: string;
          label: string;
          type: string;
          options?: Json;
          required?: boolean;
          order?: number;
          visible_on?: Json;
          archived?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          key?: string;
          label?: string;
          type?: string;
          options?: Json;
          required?: boolean;
          order?: number;
          visible_on?: Json;
          archived?: boolean;
        };
      };

      profiles: {
        Row: {
          id: string;
          username: string | null;
          role: string | null;
          credits: number | null;
          avatar: string | null;
        };
        Insert: {
          id: string;
          username?: string | null;
          role?: string | null;
          credits?: number | null;
          avatar?: string | null;
        };
        Update: {
          id?: string;
          username?: string | null;
          role?: string | null;
          credits?: number | null;
          avatar?: string | null;
        };
      };

      customers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          location: string | null;
          signup_date: string;
          extra: Json | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          location?: string | null;
          signup_date?: string;
          extra?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          location?: string | null;
          signup_date?: string;
          extra?: Json | null;
          updated_at?: string;
        };
      };

      campaigns: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          message: string | null;
          recipients: string[] | null;
          status: string;
          created_at: string;
          updated_at: string;
          scheduled_for: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          message?: string | null;
          recipients?: string[] | null;
          status?: string;
          created_at?: string;
          scheduled_for?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          message?: string | null;
          recipients?: string[] | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          scheduled_for?: string | null;
        };
      };

      campaign_forms: {
        Row: {
          id: string;
          owner_id: string;
          campaign_id: string | null;
          template_id: string | null;
          slug: string;
          schema_json: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          campaign_id?: string | null;
          template_id?: string | null;
          slug: string;
          schema_json?: Json;
        };
        Update: {
          id?: string;
          owner_id?: string;
          campaign_id?: string | null;
          template_id?: string | null;
          slug?: string;
          schema_json?: Json;
          updated_at?: string;
        };
      };

      public_slugs: {
        Row: {
          slug: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          slug: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          slug?: string;
          user_id?: string;
          created_at?: string;
        };
      };

      credit_ledger: {
        Row: {
          id: string;
          user_id: string;
          change: number;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          change: number;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          change?: number;
          reason?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
