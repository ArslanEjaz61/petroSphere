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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          meta: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          meta?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          meta?: Json | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          country_code: string | null
          created_at: string
          created_by: string
          id: string
          industry: string | null
          name: string
          notes: string | null
          owner_id: string | null
          risk_rating: Database["public"]["Enums"]["risk_rating"]
          status: Database["public"]["Enums"]["company_status"]
          tags: string[] | null
          type: Database["public"]["Enums"]["company_type"]
          updated_at: string
          website: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          created_by?: string
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          owner_id?: string | null
          risk_rating?: Database["public"]["Enums"]["risk_rating"]
          status?: Database["public"]["Enums"]["company_status"]
          tags?: string[] | null
          type?: Database["public"]["Enums"]["company_type"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string
          created_by?: string
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          owner_id?: string | null
          risk_rating?: Database["public"]["Enums"]["risk_rating"]
          status?: Database["public"]["Enums"]["company_status"]
          tags?: string[] | null
          type?: Database["public"]["Enums"]["company_type"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      contacts: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          id: string
          linkedin: string | null
          name: string
          nationality: string | null
          notes: string | null
          phone: string | null
          title: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          linkedin?: string | null
          name: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          linkedin?: string | null
          name?: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          name: string
          region: string | null
        }
        Insert: {
          code: string
          name: string
          region?: string | null
        }
        Update: {
          code?: string
          name?: string
          region?: string | null
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          name: string
          symbol: string | null
        }
        Insert: {
          code: string
          name: string
          symbol?: string | null
        }
        Update: {
          code?: string
          name?: string
          symbol?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          buyer_id: string | null
          created_at: string
          created_by: string
          currency: string | null
          expected_close: string | null
          expected_profit: number | null
          id: string
          notes: string | null
          owner_id: string | null
          port_destination: string | null
          port_loading: string | null
          price: number | null
          product_id: string | null
          quantity: number | null
          reference: string
          seller_id: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          expected_close?: string | null
          expected_profit?: number | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          port_destination?: string | null
          port_loading?: string | null
          price?: number | null
          product_id?: string | null
          quantity?: number | null
          reference?: string
          seller_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          expected_close?: string | null
          expected_profit?: number | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          port_destination?: string | null
          port_loading?: string | null
          price?: number | null
          product_id?: string | null
          quantity?: number | null
          reference?: string
          seller_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "deals_port_destination_fkey"
            columns: ["port_destination"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_port_loading_fkey"
            columns: ["port_loading"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_summary: string | null
          category: Database["public"]["Enums"]["doc_category"]
          company_id: string | null
          created_at: string
          deal_id: string | null
          id: string
          mime_type: string | null
          name: string
          size_bytes: number | null
          storage_path: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          ai_summary?: string | null
          category?: Database["public"]["Enums"]["doc_category"]
          company_id?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
          uploaded_by?: string
        }
        Update: {
          ai_summary?: string | null
          category?: Database["public"]["Enums"]["doc_category"]
          company_id?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      market_news: {
        Row: {
          headline: string
          id: string
          published_at: string
          region: string | null
          source: string | null
          url: string | null
        }
        Insert: {
          headline: string
          id?: string
          published_at?: string
          region?: string | null
          source?: string | null
          url?: string | null
        }
        Update: {
          headline?: string
          id?: string
          published_at?: string
          region?: string | null
          source?: string | null
          url?: string | null
        }
        Relationships: []
      }
      market_prices: {
        Row: {
          change_pct: number
          history: Json
          id: string
          price: number
          product: string
          region: string
          symbol: string
          unit: string
          updated_at: string
        }
        Insert: {
          change_pct?: number
          history?: Json
          id?: string
          price: number
          product: string
          region: string
          symbol: string
          unit?: string
          updated_at?: string
        }
        Update: {
          change_pct?: number
          history?: Json
          id?: string
          price?: number
          product?: string
          region?: string
          symbol?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      ports: {
        Row: {
          country_code: string | null
          id: string
          name: string
          region: string | null
        }
        Insert: {
          country_code?: string | null
          id?: string
          name: string
          region?: string | null
        }
        Update: {
          country_code?: string | null
          id?: string
          name?: string
          region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ports_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          id: string
          name: string
          unit: string | null
        }
        Insert: {
          category?: string | null
          id?: string
          name: string
          unit?: string | null
        }
        Update: {
          category?: string | null
          id?: string
          name?: string
          unit?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          company_id: string | null
          created_at: string
          created_by: string
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "trading_manager"
        | "trader"
        | "compliance_officer"
        | "finance"
        | "viewer"
      company_status:
        | "prospect"
        | "active"
        | "onboarding"
        | "blocked"
        | "archived"
      company_type:
        | "supplier"
        | "buyer"
        | "broker"
        | "refinery"
        | "inspection"
        | "storage"
        | "shipping"
        | "bank"
        | "other"
      deal_stage:
        | "lead"
        | "inquiry"
        | "offer"
        | "loi"
        | "icpo"
        | "fco"
        | "negotiation"
        | "spa"
        | "payment"
        | "loading"
        | "shipment"
        | "delivered"
        | "cancelled"
      doc_category:
        | "loi"
        | "icpo"
        | "fco"
        | "spa"
        | "ncnda"
        | "imfpa"
        | "pop"
        | "sgs"
        | "tank_storage"
        | "bill_of_lading"
        | "invoice"
        | "insurance"
        | "certificate_of_origin"
        | "inspection"
        | "other"
      risk_rating: "low" | "medium" | "high" | "unknown"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "working" | "waiting" | "done"
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
    Enums: {
      app_role: [
        "admin",
        "trading_manager",
        "trader",
        "compliance_officer",
        "finance",
        "viewer",
      ],
      company_status: [
        "prospect",
        "active",
        "onboarding",
        "blocked",
        "archived",
      ],
      company_type: [
        "supplier",
        "buyer",
        "broker",
        "refinery",
        "inspection",
        "storage",
        "shipping",
        "bank",
        "other",
      ],
      deal_stage: [
        "lead",
        "inquiry",
        "offer",
        "loi",
        "icpo",
        "fco",
        "negotiation",
        "spa",
        "payment",
        "loading",
        "shipment",
        "delivered",
        "cancelled",
      ],
      doc_category: [
        "loi",
        "icpo",
        "fco",
        "spa",
        "ncnda",
        "imfpa",
        "pop",
        "sgs",
        "tank_storage",
        "bill_of_lading",
        "invoice",
        "insurance",
        "certificate_of_origin",
        "inspection",
        "other",
      ],
      risk_rating: ["low", "medium", "high", "unknown"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "working", "waiting", "done"],
    },
  },
} as const
