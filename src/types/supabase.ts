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
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
