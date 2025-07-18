export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          cor: string | null
          created_at: string | null
          id: string
          nome: string
          tipo: string
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          id?: string
          nome: string
          tipo: string
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          tipo?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          nome: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          nome: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          nome?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      family_invites: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          family_id: string
          id: string
          invited_by: string
          role: string
          status: string
          token: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          family_id: string
          id?: string
          invited_by: string
          role?: string
          status?: string
          token?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          family_id?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_invites_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          family_id: string
          id: string
          joined_at: string | null
          permissions: string[] | null
          role: string
          user_id: string
        }
        Insert: {
          family_id: string
          id?: string
          joined_at?: string | null
          permissions?: string[] | null
          role?: string
          user_id: string
        }
        Update: {
          family_id?: string
          id?: string
          joined_at?: string | null
          permissions?: string[] | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_expenses: {
        Row: {
          ativa: boolean | null
          categoria_id: string | null
          created_at: string | null
          dia_vencimento: number
          id: string
          nome: string
          user_id: string
          valor: number
        }
        Insert: {
          ativa?: boolean | null
          categoria_id?: string | null
          created_at?: string | null
          dia_vencimento: number
          id?: string
          nome: string
          user_id: string
          valor: number
        }
        Update: {
          ativa?: boolean | null
          categoria_id?: string | null
          created_at?: string | null
          dia_vencimento?: number
          id?: string
          nome?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expenses_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          prazo: string | null
          updated_at: string | null
          user_id: string
          valor_atual: number | null
          valor_meta: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          prazo?: string | null
          updated_at?: string | null
          user_id: string
          valor_atual?: number | null
          valor_meta: number
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          prazo?: string | null
          updated_at?: string | null
          user_id?: string
          valor_atual?: number | null
          valor_meta?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          foto_url: string | null
          id: string
          nome: string
          percentual_divisao: number | null
          poupanca_mensal: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          percentual_divisao?: number | null
          poupanca_mensal?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          percentual_divisao?: number | null
          poupanca_mensal?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          categoria_id: string | null
          created_at: string | null
          data: string
          descricao: string | null
          id: string
          modo: string
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string | null
          data: string
          descricao?: string | null
          id?: string
          modo: string
          tipo: string
          user_id: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string | null
          data?: string
          descricao?: string | null
          id?: string
          modo?: string
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_family_invite: {
        Args: { invite_token: string }
        Returns: Json
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